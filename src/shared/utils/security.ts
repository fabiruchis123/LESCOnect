/**
 * Módulo Central de Seguridad y Sanitización — LESCOnect
 * Estándar: OWASP MASVS / lesconect-security
 */

const DEFAULT_R2_HOST = 'https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev';

export interface CedulaValidationResult {
  isValid: boolean;
  formatted: string;
  digits: string;
  type: 'fisica' | 'juridica' | 'dimex_nite' | 'invalid';
}

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  digits: string;
}

/**
 * Elimina caracteres de control invisibles, vectores XSS/HTML (`<`, `>`, `javascript:`, `data:`)
 * y recorta la cadena a una longitud máxima segura.
 */
export function sanitizeText(input: unknown, maxLength: number = 150): string {
  if (typeof input !== 'string') {
    return '';
  }

  const safeLimit = Math.max(1, Math.min(maxLength, 2000));

  return input
    // Eliminar caracteres de control ASCII y Unicode invisibles (excepto espacio estándar)
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
    // Neutralizar esquemas ejecutables peligrosos antes y después de limpiar delimitadores
    .replace(/(?:javascript|vbscript|data)\s*:/gi, '')
    // Eliminar etiquetas HTML o delimitadores angulares
    .replace(/[<>]/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, safeLimit);
}

/**
 * Valida y formatea números de identificación de Costa Rica:
 * - Cédula física: 9 dígitos (formato X-XXXX-XXXX, primer dígito 1-9)
 * - Cédula jurídica: 10 dígitos (formato X-XXX-XXXXXX)
 * - DIMEX / NITE: 11 o 12 dígitos numéricos
 */
export function validateAndFormatCedulaCR(input: string): CedulaValidationResult {
  if (typeof input !== 'string') {
    return { isValid: false, formatted: '', digits: '', type: 'invalid' };
  }

  const digits = input.replace(/\D/g, '').slice(0, 12);

  // Cédula física nacional: 9 dígitos, provincia 1-9
  if (/^[1-9]\d{8}$/.test(digits)) {
    const formatted = `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}`;
    return {
      isValid: true,
      formatted,
      digits,
      type: 'fisica',
    };
  }

  // Cédula jurídica: 10 dígitos
  if (/^[1-9]\d{9}$/.test(digits)) {
    const formatted = `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 10)}`;
    return {
      isValid: true,
      formatted,
      digits,
      type: 'juridica',
    };
  }

  // DIMEX o NITE: 11 a 12 dígitos
  if (/^[1-9]\d{10,11}$/.test(digits)) {
    return {
      isValid: true,
      formatted: digits,
      digits,
      type: 'dimex_nite',
    };
  }

  // Formato parcial para edición progresiva segura
  let partialFormatted = digits;
  if (digits.length > 1 && digits.length <= 5) {
    partialFormatted = `${digits.slice(0, 1)}-${digits.slice(1)}`;
  } else if (digits.length > 5 && digits.length <= 9) {
    partialFormatted = `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 9)}`;
  }

  return {
    isValid: false,
    formatted: partialFormatted,
    digits,
    type: 'invalid',
  };
}

/**
 * Valida teléfonos de Costa Rica (8 dígitos iniciando en 2, 4, 5, 6, 7 u 8).
 * Acepta opcionalmente el código de país +506 / 506 y devuelve formato XXXX-XXXX.
 */
export function validateCRPhone(input: string): PhoneValidationResult {
  if (typeof input !== 'string') {
    return { isValid: false, formatted: '', digits: '' };
  }

  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00506') && digits.length >= 13) {
    digits = digits.slice(5);
  } else if (digits.startsWith('506') && digits.length > 8) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 8);

  const isValid = /^[245678]\d{7}$/.test(digits);
  const formatted =
    digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4, 8)}` : digits;

  return {
    isValid,
    formatted,
    digits,
  };
}

/**
 * Valida estrictamente que un código OTP sea de 6 dígitos numéricos exactos.
 */
export function validateOtpCode(code: string): boolean {
  if (typeof code !== 'string') {
    return false;
  }
  return /^\d{6}$/.test(code.trim());
}

/**
 * Control contra ataques de fuerza bruta en validación de códigos OTP.
 * Bloquea temporalmente tras alcanzar el límite de intentos fallidos (por defecto 5 intentos -> 60 s).
 */
export class OtpRateLimiter {
  private failedAttempts = 0;
  private lockedUntilMs = 0;
  private readonly maxAttempts: number;
  private readonly cooldownMs: number;

  constructor(maxAttempts: number = 5, cooldownSeconds: number = 60) {
    this.maxAttempts = maxAttempts;
    this.cooldownMs = cooldownSeconds * 1000;
  }

  /**
   * Indica si se permite un nuevo intento de verificación en este instante.
   */
  public canAttempt(nowMs: number = Date.now()): boolean {
    if (this.lockedUntilMs > 0 && nowMs >= this.lockedUntilMs) {
      this.reset();
    }
    return this.lockedUntilMs === 0;
  }

  /**
   * Segundos restantes de bloqueo temporal (0 si no está bloqueado).
   */
  public getRemainingCooldownSeconds(nowMs: number = Date.now()): number {
    if (this.lockedUntilMs === 0) {
      return 0;
    }
    const remainingMs = this.lockedUntilMs - nowMs;
    if (remainingMs <= 0) {
      this.reset();
      return 0;
    }
    return Math.ceil(remainingMs / 1000);
  }

  /**
   * Registra un intento fallido de OTP y activa el bloqueo si alcanza `maxAttempts`.
   */
  public recordFailure(nowMs: number = Date.now()): {
    isLocked: boolean;
    remainingAttempts: number;
    cooldownSeconds: number;
  } {
    if (this.lockedUntilMs > 0 && nowMs < this.lockedUntilMs) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        cooldownSeconds: this.getRemainingCooldownSeconds(nowMs),
      };
    }

    if (this.lockedUntilMs > 0 && nowMs >= this.lockedUntilMs) {
      this.failedAttempts = 0;
      this.lockedUntilMs = 0;
    }

    this.failedAttempts += 1;

    if (this.failedAttempts >= this.maxAttempts) {
      this.lockedUntilMs = nowMs + this.cooldownMs;
      return {
        isLocked: true,
        remainingAttempts: 0,
        cooldownSeconds: Math.ceil(this.cooldownMs / 1000),
      };
    }

    return {
      isLocked: false,
      remainingAttempts: Math.max(0, this.maxAttempts - this.failedAttempts),
      cooldownSeconds: 0,
    };
  }

  /**
   * Reinicia el contador tras una verificación exitosa.
   */
  public recordSuccess(): void {
    this.reset();
  }

  /**
   * Restablece el estado completo del limitador.
   */
  public reset(): void {
    this.failedAttempts = 0;
    this.lockedUntilMs = 0;
  }

  public getFailedAttempts(): number {
    return this.failedAttempts;
  }

  public getMaxAttempts(): number {
    return this.maxAttempts;
  }
}

export const otpRateLimiter = new OtpRateLimiter(5, 60);

/**
 * Sanitiza una clave `r2Key` de Cloudflare R2 eliminando intentos de Path Traversal (`..`),
 * barras invertidas, caracteres nulos y prefijos `/` redundantes.
 */
export function sanitizeR2Key(r2Key: string): string {
  if (typeof r2Key !== 'string') {
    return '';
  }

  const normalized = r2Key
    .trim()
    .replace(/\\/g, '/')
    .replace(/[\u0000-\u001F\u007F]/g, '');

  const safeSegments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.includes('..') &&
        /^[a-zA-Z0-9._-]+$/.test(segment)
    );

  return safeSegments.join('/');
}

/**
 * Verifica que cualquier URL de video pertenezca exclusivamente al dominio HTTPS autorizado
 * de Cloudflare R2 (`EXPO_PUBLIC_VIDEO_BASE_URL` o `https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev`)
 * o sea un archivo local `file://` seguro sin secuencias de path traversal (`..`).
 */
export function isTrustedVideoUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('\\')) {
    return false;
  }

  // Permitir rutas de caché local del dispositivo (FileSystem.documentDirectory / cacheDirectory)
  if (trimmed.startsWith('file://')) {
    return /^file:\/\/\/[a-zA-Z0-9._\-/:%+]+$/.test(trimmed);
  }

  const configuredBase = (
    process.env.EXPO_PUBLIC_VIDEO_BASE_URL || DEFAULT_R2_HOST
  ).replace(/\/+$/, '');

  try {
    const parsedUrl = new URL(trimmed);
    const parsedBase = new URL(configuredBase);

    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    const isAllowedHost =
      parsedUrl.hostname === parsedBase.hostname ||
      parsedUrl.hostname === 'pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev';

    if (!isAllowedHost) {
      return false;
    }

    const decodedPath = decodeURIComponent(parsedUrl.pathname);
    if (decodedPath.includes('..') || decodedPath.includes('\\')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Enmascara datos sensibles (cédula, teléfono, tokens) dejando visibles únicamente
 * los últimos `visibleEnd` caracteres para logs o vistas protegidas.
 */
export function maskSensitiveData(value: string, visibleEnd: number = 4): string {
  if (typeof value !== 'string') {
    return '';
  }

  const clean = value.trim();
  if (!clean) {
    return '';
  }

  const safeVisible = Math.max(0, Math.min(visibleEnd, clean.length));
  if (clean.length <= safeVisible) {
    return '*'.repeat(clean.length);
  }

  const maskedLength = clean.length - safeVisible;
  return `${'*'.repeat(maskedLength)}${clean.slice(maskedLength)}`;
}
