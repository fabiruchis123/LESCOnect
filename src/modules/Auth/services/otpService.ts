import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore, User, SosContactItem } from '@/shared/stores/useAuthStore';
import {
  otpRateLimiter,
  sanitizeText,
  validateAndFormatCedulaCR,
  validateCRPhone,
  validateOtpCode,
} from '@/shared/utils/security';
import { OtpSendResult, OtpVerifyResult } from '../types';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutos máximo de vigencia (OWASP MASVS)
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 segundos entre reenvíos
const MAX_VERIFY_ATTEMPTS = 5; // Límite contra fuerza bruta
const LOCKOUT_DURATION_MS = 60 * 1000; // 60s de bloqueo tras exceder intentos

interface ActiveOtpRecord {
  code: string;
  normalizedPhone: string;
  displayPhone: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  lockedUntil: number;
  channel: 'supabase' | 'assisted_local';
}

// Almacenamiento efímero en memoria (nunca en AsyncStorage ni logs por seguridad)
const otpStore = new Map<string, ActiveOtpRecord>();

/**
 * Extrae los 8 dígitos limpios de un número telefónico de Costa Rica.
 */
export function sanitizeCRPhoneDigits(raw: string): string {
  return validateCRPhone(raw || '').digits;
}

/**
 * Valida que sea un número telefónico costarricense válido de 8 dígitos.
 */
export function isValidCRPhone(raw: string): boolean {
  return validateCRPhone(raw || '').isValid;
}

/**
 * Convierte un teléfono de CR a formato E.164 (+506XXXXXXXX).
 */
export function toE164CRPhone(raw: string): string {
  const digits = sanitizeCRPhoneDigits(raw);
  return digits ? `+506${digits}` : '';
}

/**
 * Formatea los 8 dígitos como XXXX-XXXX para lectura fácil.
 */
export function formatCRPhoneDisplay(raw: string): string {
  return validateCRPhone(raw || '').formatted;
}

/**
 * Extrae un código OTP de 6 dígitos desde un texto pegado o mensaje SMS completo
 * (ej. "LESCOnect: Tu código de verificación es 482910").
 */
export function extractOtpFromText(rawText: string): string {
  if (!rawText) return '';
  const sixDigitMatch = rawText.match(/\b(\d{6})\b/);
  if (sixDigitMatch && sixDigitMatch[1]) {
    return sixDigitMatch[1];
  }
  return rawText.replace(/\D/g, '').slice(0, 6);
}

/**
 * Genera un código numérico aleatorio de 6 dígitos (100000 - 999999).
 */
function generateSixDigitCode(): string {
  const array = new Uint32Array(1);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return String(num);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Comparación en tiempo constante para evitar ataques de timing.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const otpService = {
  /**
   * Envía un código OTP de 6 dígitos al teléfono indicado.
   * Intenta usar Supabase Auth SMS OTP con timeout corto y activa el canal asistido
   * de recepción automática para usuarios sordos / no informáticos.
   */
  async sendSmsOtp(rawPhone: string, forceResend = false): Promise<OtpSendResult> {
    if (!isValidCRPhone(rawPhone)) {
      return {
        success: false,
        normalizedPhone: '',
        displayPhone: formatCRPhoneDisplay(rawPhone),
        channel: 'assisted_local',
        expiresAt: 0,
        cooldownSeconds: 0,
        error: 'Ingresa un número de celular válido de 8 dígitos (ej. 8888-8888).',
      };
    }

    const normalizedPhone = toE164CRPhone(rawPhone);
    const displayPhone = formatCRPhoneDisplay(rawPhone);
    const now = Date.now();
    const existing = otpStore.get(normalizedPhone);

    if (!otpRateLimiter.canAttempt(now) || (existing && existing.lockedUntil > now)) {
      const limiterSec = otpRateLimiter.getRemainingCooldownSeconds(now);
      const recordSec =
        existing && existing.lockedUntil > now
          ? Math.ceil((existing.lockedUntil - now) / 1000)
          : 0;
      const waitSec = Math.max(limiterSec, recordSec, 1);
      return {
        success: false,
        normalizedPhone,
        displayPhone,
        channel: existing?.channel || 'assisted_local',
        expiresAt: existing?.expiresAt || 0,
        cooldownSeconds: waitSec,
        error: `Demasiados intentos. Espera ${waitSec} segundos por seguridad.`,
      };
    }

    if (existing && !forceResend) {
      const elapsed = now - existing.lastSentAt;
      if (elapsed < RESEND_COOLDOWN_MS && existing.expiresAt > now) {
        const remainingCooldown = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return {
          success: true,
          normalizedPhone,
          displayPhone,
          channel: existing.channel,
          incomingSmsCode: existing.code,
          expiresAt: existing.expiresAt,
          cooldownSeconds: remainingCooldown,
        };
      }
    }

    const generatedCode = generateSixDigitCode();
    const expiresAt = now + OTP_TTL_MS;
    let channel: 'supabase' | 'assisted_local' = 'assisted_local';
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
        timeoutId = setTimeout(() => resolve({ error: new Error('timeout') }), 8000);
      });

      const supabasePromise = supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      // Llamada paralela al servicio SMS del servidor para envío automático
      supabase.functions.invoke('send-sms-otp', {
        body: { phone: normalizedPhone, code: generatedCode },
      }).catch(() => {});

      const result = await Promise.race([supabasePromise, timeoutPromise]);
      if (!result.error) {
        channel = 'supabase';
      }
    } catch {
      // Fallback limpio al detector asistido local
      channel = 'assisted_local';
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    otpStore.set(normalizedPhone, {
      code: generatedCode,
      normalizedPhone,
      displayPhone,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      lockedUntil: 0,
      channel,
    });

    return {
      success: true,
      normalizedPhone,
      displayPhone,
      channel,
      incomingSmsCode: generatedCode,
      expiresAt,
      cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    };
  },

  /**
   * Verifica estrictamente un código OTP de 6 dígitos (/^\d{6}$/).
   */
  async verifySmsOtp(rawPhone: string, rawCode: string): Promise<OtpVerifyResult> {
    const cleanCode = rawCode.replace(/\D/g, '');
    if (!validateOtpCode(cleanCode)) {
      return {
        success: false,
        error: 'El código debe tener exactamente 6 números.',
      };
    }

    const normalizedPhone = toE164CRPhone(rawPhone);
    const now = Date.now();
    const record = otpStore.get(normalizedPhone);

    if (!record) {
      return {
        success: false,
        error: 'El código expiró o no fue solicitado. Pulsa "Reenviar código".',
      };
    }

    if (!otpRateLimiter.canAttempt(now) || record.lockedUntil > now) {
      const limiterSec = otpRateLimiter.getRemainingCooldownSeconds(now);
      const recordSec =
        record.lockedUntil > now ? Math.ceil((record.lockedUntil - now) / 1000) : 0;
      const lockedSeconds = Math.max(limiterSec, recordSec, 1);
      return {
        success: false,
        lockedSeconds,
        remainingAttempts: 0,
        error: `Por seguridad, espera ${lockedSeconds}s antes de intentar de nuevo.`,
      };
    }

    if (now > record.expiresAt) {
      otpStore.delete(normalizedPhone);
      return {
        success: false,
        error: 'El código venció (máximo 5 minutos). Solicita uno nuevo.',
      };
    }

    // 1. Verificar contra código asistido o Supabase Auth
    const matchesAssisted = timingSafeEqualStr(cleanCode, record.code);

    if (record.channel === 'supabase' && !matchesAssisted) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: cleanCode,
          type: 'sms',
        });

        if (!error && data?.session) {
          otpStore.delete(normalizedPhone);
          otpRateLimiter.recordSuccess();
          return {
            success: true,
            token: data.session.access_token,
            supabaseUserId: data.user?.id,
          };
        }
      } catch {
        // Continúa al manejo de intentos fallidos
      }
    }

    if (matchesAssisted) {
      otpStore.delete(normalizedPhone);
      otpRateLimiter.recordSuccess();
      return {
        success: true,
        token: `lesconect-otp-verified-${Date.now()}`,
      };
    }

    // Intento fallido: incrementar contador y sincronizar con otpRateLimiter
    record.attempts += 1;
    const limiterResult = otpRateLimiter.recordFailure(now);
    const remainingAttempts = Math.min(
      Math.max(0, MAX_VERIFY_ATTEMPTS - record.attempts),
      limiterResult.remainingAttempts
    );

    if (record.attempts >= MAX_VERIFY_ATTEMPTS || limiterResult.isLocked) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
      const lockedSeconds = Math.max(
        Math.ceil(LOCKOUT_DURATION_MS / 1000),
        limiterResult.cooldownSeconds
      );
      return {
        success: false,
        remainingAttempts: 0,
        lockedSeconds,
        error: `Demasiados intentos incorrectos. Bloqueado por ${lockedSeconds} segundos.`,
      };
    }

    return {
      success: false,
      remainingAttempts,
      error: `Código incorrecto. Te quedan ${remainingAttempts} ${
        remainingAttempts === 1 ? 'intento' : 'intentos'
      }.`,
    };
  },

  /**
   * Busca de forma síncrona una cuenta en el directorio persistente local (por teléfono o cédula).
   */
  findLocalRegisteredAccount(identifier: string): User | null {
    return useAuthStore.getState().findRegisteredUser(identifier);
  },

  /**
   * Resuelve una cuenta registrada combinando el directorio persistente local (`useAuthStore`)
   * y una consulta rápida no bloqueante a `public.profiles` en Supabase (por `phone`/`telefono` o `cedula`/`national_id`).
   */
  async resolveRegisteredAccount(identifier: string): Promise<User | null> {
    const localAccount = useAuthStore.getState().findRegisteredUser(identifier);
    const phoneCheck = validateCRPhone(identifier);
    const cedulaCheck = validateAndFormatCedulaCR(identifier);

    let remoteUser: Partial<User> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const fetchPromise = (async (): Promise<Partial<User> | null> => {
        const formattedPhone = phoneCheck.formatted;
        const formattedCedula = cedulaCheck.formatted;

        let query = supabase.from('profiles').select('*');
        if (phoneCheck.isValid) {
          query = query.or(
            `phone.eq.${formattedPhone},phone.eq.${phoneCheck.digits},telefono.eq.${formattedPhone},telefono.eq.${phoneCheck.digits}`
          );
        } else if (cedulaCheck.isValid) {
          query = query.or(
            `national_id.eq.${formattedCedula},national_id.eq.${cedulaCheck.digits},cedula.eq.${formattedCedula},cedula.eq.${cedulaCheck.digits}`
          );
        } else {
          return null;
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error || !data) return null;

        const row = data as Record<string, unknown>;
        const nombre = typeof row.nombre === 'string' ? row.nombre : '';
        const apellidos = typeof row.apellidos === 'string' ? row.apellidos : '';
        const fullName =
          (typeof row.full_name === 'string' && row.full_name) ||
          `${nombre} ${apellidos}`.trim() ||
          nombre;
        const tel =
          (typeof row.phone === 'string' && row.phone) ||
          (typeof row.telefono === 'string' && row.telefono) ||
          formattedPhone;
        const ced =
          (typeof row.national_id === 'string' && row.national_id) ||
          (typeof row.cedula === 'string' && row.cedula) ||
          formattedCedula;

        const remoteSos: SosContactItem[] = [];
        const ceTel =
          (typeof row.emergency_contact_phone === 'string' && row.emergency_contact_phone) ||
          (typeof row.contacto_emergencia_telefono === 'string' && row.contacto_emergencia_telefono) ||
          '';
        const ceNom =
          (typeof row.emergency_contact_name === 'string' && row.emergency_contact_name) ||
          (typeof row.contacto_emergencia_nombre === 'string' && row.contacto_emergencia_nombre) ||
          '';
        const ceRel =
          (typeof row.emergency_contact_relation === 'string' && row.emergency_contact_relation) ||
          (typeof row.contacto_emergencia_parentesco === 'string' && row.contacto_emergencia_parentesco) ||
          'Familiar';
        const ceLesco =
          typeof row.emergency_contact_knows_lesco === 'boolean'
            ? row.emergency_contact_knows_lesco
            : typeof row.contacto_emergencia_sabe_lesco === 'boolean'
            ? row.contacto_emergencia_sabe_lesco
            : false;

        if (ceTel || ceNom) {
          remoteSos.push({
            id: 'sos-remote-1',
            name: ceNom || 'Contacto SOS',
            phone: ceTel,
            relation: ceRel,
            knowsLesco: ceLesco,
            receivesSms: true,
          });
        }

        return {
          id: typeof row.id === 'string' ? row.id : undefined,
          name: fullName || undefined,
          nombre: nombre || undefined,
          apellidos: apellidos || undefined,
          cedula: ced || undefined,
          phone: tel || undefined,
          telefono: tel || undefined,
          fechaNacimiento:
            typeof row.fecha_nacimiento === 'string'
              ? row.fecha_nacimiento
              : undefined,
          contactoEmergencia: ceTel || undefined,
          emergencyContact: ceTel || undefined,
          contactoEmergenciaNombre: ceNom || undefined,
          contactoEmergenciaParentesco:
            typeof row.contacto_emergencia_parentesco === 'string'
              ? row.contacto_emergencia_parentesco
              : undefined,
          contactoEmergenciaSabeLesco:
            typeof row.contacto_emergencia_sabe_lesco === 'boolean'
              ? row.contacto_emergencia_sabe_lesco
              : undefined,
          sosContacts: remoteSos.length > 0 ? remoteSos : undefined,
        };
      })();

      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), 1200);
      });

      remoteUser = await Promise.race([fetchPromise, timeoutPromise]);
    } catch {
      remoteUser = null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!localAccount && !remoteUser) {
      return null;
    }

    const mergedSos =
      localAccount?.sosContacts && localAccount.sosContacts.length > 0
        ? localAccount.sosContacts
        : remoteUser?.sosContacts || [];

    const resolvedName =
      localAccount?.name ||
      remoteUser?.name ||
      `${localAccount?.nombre || remoteUser?.nombre || ''} ${
        localAccount?.apellidos || remoteUser?.apellidos || ''
      }`.trim() ||
      'Usuario LESCOnect';

    return {
      ...(remoteUser || {}),
      ...(localAccount || {}),
      id: localAccount?.id || remoteUser?.id || Date.now().toString(),
      name: resolvedName,
      nombre: localAccount?.nombre || remoteUser?.nombre || resolvedName,
      apellidos: localAccount?.apellidos || remoteUser?.apellidos || '',
      cedula: localAccount?.cedula || remoteUser?.cedula || '',
      phone:
        localAccount?.phone ||
        localAccount?.telefono ||
        remoteUser?.phone ||
        phoneCheck.formatted ||
        '',
      telefono:
        localAccount?.telefono ||
        localAccount?.phone ||
        remoteUser?.telefono ||
        phoneCheck.formatted ||
        '',
      fechaNacimiento:
        localAccount?.fechaNacimiento || remoteUser?.fechaNacimiento,
      emergencyContact:
        localAccount?.emergencyContact ||
        localAccount?.contactoEmergencia ||
        remoteUser?.emergencyContact ||
        mergedSos[0]?.phone ||
        '',
      contactoEmergencia:
        localAccount?.contactoEmergencia ||
        localAccount?.emergencyContact ||
        remoteUser?.contactoEmergencia ||
        mergedSos[0]?.phone ||
        '',
      contactoEmergenciaNombre:
        localAccount?.contactoEmergenciaNombre ||
        remoteUser?.contactoEmergenciaNombre ||
        mergedSos[0]?.name ||
        '',
      contactoEmergenciaParentesco:
        localAccount?.contactoEmergenciaParentesco ||
        remoteUser?.contactoEmergenciaParentesco ||
        mergedSos[0]?.relation ||
        'Familiar',
      contactoEmergenciaSabeLesco:
        localAccount?.contactoEmergenciaSabeLesco ??
        remoteUser?.contactoEmergenciaSabeLesco ??
        mergedSos[0]?.knowsLesco ??
        false,
      sosContacts: mergedSos,
    };
  },

  /**
   * Sincroniza de forma no bloqueante los datos del perfil en public.profiles si existe sesión activa en Supabase.
   */
  async syncProfileNonBlocking(user: User): Promise<void> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUid = sessionData?.session?.user?.id || (user.id && user.id.length > 20 ? user.id : undefined);
      if (!authUid) return;

      const fullName = sanitizeText(
        user.name || `${user.nombre || ''} ${user.apellidos || ''}`.trim() || 'Usuario LESCOnect',
        120
      );

      await supabase.from('profiles').upsert(
        {
          id: authUid,
          full_name: fullName,
          national_id: sanitizeText(user.cedula || '', 20),
          phone: sanitizeText(user.telefono || user.phone || '', 20),
          birth_date: user.fechaNacimiento ? sanitizeText(user.fechaNacimiento, 20) : null,
          emergency_contact_name: user.contactoEmergenciaNombre
            ? sanitizeText(user.contactoEmergenciaNombre, 100)
            : user.sosContacts?.[0]?.name || null,
          emergency_contact_phone: user.contactoEmergencia
            ? sanitizeText(user.contactoEmergencia, 20)
            : user.sosContacts?.[0]?.phone || null,
          emergency_contact_relation: user.contactoEmergenciaParentesco
            ? sanitizeText(user.contactoEmergenciaParentesco, 50)
            : user.sosContacts?.[0]?.relation || null,
          emergency_contact_knows_lesco:
            user.contactoEmergenciaSabeLesco ?? user.sosContacts?.[0]?.knowsLesco ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // No bloqueante: la sesión local en MMKV/Zustand permanece intacta
    }
  },
};
