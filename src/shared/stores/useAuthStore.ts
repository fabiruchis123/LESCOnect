import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { supabase } from '../../lib/supabase';
import {
  sanitizeText,
  validateAndFormatCedulaCR,
  validateCRPhone,
} from '../utils/security';

export interface SosContactItem {
  id: string;
  name: string;
  phone: string;
  relation?: string;
  knowsLesco?: boolean;
  receivesSms?: boolean;
}

export interface User {
  id: string;
  name: string;
  nombre?: string;
  apellidos?: string;
  cedula?: string;
  phone?: string;
  telefono?: string;
  fechaNacimiento?: string;
  emergencyContact?: string;
  contactoEmergencia?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaParentesco?: string;
  contactoEmergenciaSabeLesco?: boolean;
  sosContacts?: SosContactItem[];
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registeredAccounts: Record<string, User>;
  lastRegisteredPhone: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
  findRegisteredUser: (identifier: string) => User | null;
  getLastRegisteredUser: () => User | null;
}

const AUTH_STORAGE_KEY = 'lesconect-auth';

/**
 * Extrae llaves normalizadas (teléfono de 8 dígitos y cédula de 9-12 dígitos)
 * para indexar y buscar cuentas registradas sin importar guiones o espacios.
 */
function getAccountLookupKeys(user: Partial<User> | null | undefined): string[] {
  if (!user) return [];
  const keys = new Set<string>();

  const rawPhone = user.phone || user.telefono || '';
  if (rawPhone) {
    const phoneDigits = validateCRPhone(rawPhone).digits;
    if (phoneDigits.length === 8) {
      keys.add(phoneDigits);
      keys.add(`phone:${phoneDigits}`);
    }
  }

  const rawCedula = user.cedula || '';
  if (rawCedula) {
    const cedulaDigits = validateAndFormatCedulaCR(rawCedula).digits;
    if (cedulaDigits.length >= 9) {
      keys.add(cedulaDigits);
      keys.add(`cedula:${cedulaDigits}`);
    }
  }

  return Array.from(keys);
}

/**
 * Actualiza el diccionario de cuentas registradas indexando por teléfono y por cédula.
 */
function upsertRegisteredAccountMap(
  currentMap: Record<string, User>,
  user: User
): Record<string, User> {
  const nextMap = { ...currentMap };
  const keys = getAccountLookupKeys(user);

  // Preservar copia profunda de sosContacts para evitar mutaciones accidentales
  const snapshotUser: User = {
    ...user,
    sosContacts: Array.isArray(user.sosContacts)
      ? user.sosContacts.map((c) => ({ ...c }))
      : [],
  };

  for (const key of keys) {
    nextMap[key] = snapshotUser;
  }

  return nextMap;
}

/**
 * Busca un usuario en el directorio persistente usando teléfono (8 dígitos) o cédula (9-12 dígitos).
 */
function lookupUserInDirectory(
  directory: Record<string, User> | undefined,
  identifier: string
): User | null {
  if (!directory || typeof identifier !== 'string') return null;
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const phoneCheck = validateCRPhone(trimmed);
  if (phoneCheck.digits.length === 8) {
    const byPhone =
      directory[phoneCheck.digits] || directory[`phone:${phoneCheck.digits}`];
    if (byPhone) return byPhone;
  }

  const cedulaCheck = validateAndFormatCedulaCR(trimmed);
  if (cedulaCheck.digits.length >= 9) {
    const byCedula =
      directory[cedulaCheck.digits] || directory[`cedula:${cedulaCheck.digits}`];
    if (byCedula) return byCedula;
  }

  const rawDigits = trimmed.replace(/\D/g, '');
  if (rawDigits) {
    const direct =
      directory[rawDigits] ||
      directory[`phone:${rawDigits}`] ||
      directory[`cedula:${rawDigits}`];
    if (direct) return direct;

    // Búsqueda de respaldo recorriendo los perfiles almacenados
    for (const storedUser of Object.values(directory)) {
      if (!storedUser) continue;
      const uPhone = validateCRPhone(storedUser.phone || storedUser.telefono || '').digits;
      const uCedula = validateAndFormatCedulaCR(storedUser.cedula || '').digits;
      if (
        (uPhone && uPhone === rawDigits) ||
        (uCedula && uCedula === rawDigits)
      ) {
        return storedUser;
      }
    }
  }

  return null;
}

/**
 * Sanitiza todos los campos de texto, cédula, teléfonos y contactos SOS del usuario.
 */
function sanitizeUserPayload(partial: Partial<User>): Partial<User> {
  const sanitized: Partial<User> = { ...partial };

  if (typeof sanitized.id === 'string') {
    sanitized.id = sanitizeText(sanitized.id, 64);
  }
  if (typeof sanitized.name === 'string') {
    sanitized.name = sanitizeText(sanitized.name, 100);
  }
  if (typeof sanitized.nombre === 'string') {
    sanitized.nombre = sanitizeText(sanitized.nombre, 80);
  }
  if (typeof sanitized.apellidos === 'string') {
    sanitized.apellidos = sanitizeText(sanitized.apellidos, 80);
  }
  if (typeof sanitized.cedula === 'string') {
    const cedulaCheck = validateAndFormatCedulaCR(sanitized.cedula);
    sanitized.cedula = cedulaCheck.formatted || sanitizeText(sanitized.cedula, 20);
  }
  if (typeof sanitized.phone === 'string') {
    const phoneCheck = validateCRPhone(sanitized.phone);
    sanitized.phone = phoneCheck.formatted || sanitizeText(sanitized.phone, 20);
  }
  if (typeof sanitized.telefono === 'string') {
    const telCheck = validateCRPhone(sanitized.telefono);
    sanitized.telefono = telCheck.formatted || sanitizeText(sanitized.telefono, 20);
  }
  if (typeof sanitized.fechaNacimiento === 'string') {
    sanitized.fechaNacimiento = sanitizeText(sanitized.fechaNacimiento, 20);
  }
  if (typeof sanitized.emergencyContact === 'string') {
    const ecCheck = validateCRPhone(sanitized.emergencyContact);
    sanitized.emergencyContact =
      ecCheck.formatted || sanitizeText(sanitized.emergencyContact, 20);
  }
  if (typeof sanitized.contactoEmergencia === 'string') {
    const ceCheck = validateCRPhone(sanitized.contactoEmergencia);
    sanitized.contactoEmergencia =
      ceCheck.formatted || sanitizeText(sanitized.contactoEmergencia, 20);
  }
  if (typeof sanitized.contactoEmergenciaNombre === 'string') {
    sanitized.contactoEmergenciaNombre = sanitizeText(
      sanitized.contactoEmergenciaNombre,
      100
    );
  }
  if (typeof sanitized.contactoEmergenciaParentesco === 'string') {
    sanitized.contactoEmergenciaParentesco = sanitizeText(
      sanitized.contactoEmergenciaParentesco,
      50
    );
  }
  if (typeof sanitized.email === 'string') {
    sanitized.email = sanitizeText(sanitized.email, 120);
  }
  if (typeof sanitized.role === 'string') {
    sanitized.role = sanitizeText(sanitized.role, 32);
  }
  if (Array.isArray(sanitized.sosContacts)) {
    sanitized.sosContacts = sanitized.sosContacts.slice(0, 10).map((contact) => {
      const phoneCheck = validateCRPhone(contact.phone || '');
      return {
        ...contact,
        id: sanitizeText(contact.id || '', 64),
        name: sanitizeText(contact.name || '', 100),
        phone: phoneCheck.formatted || sanitizeText(contact.phone || '', 20),
        relation:
          typeof contact.relation === 'string'
            ? sanitizeText(contact.relation, 50)
            : contact.relation,
      };
    });
  }

  return sanitized;
}

// Almacenamiento seguro en memoria / LocalStorage para Expo Go y Web
const memoryStorage = new Map<string, string>();

let mmkvStateStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch {}
    memoryStorage.set(name, value);
  },
  getItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {}
    return memoryStorage.get(name) ?? null;
  },
  removeItem: (name) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch {}
    memoryStorage.delete(name);
  },
};

// Intento de inicialización nativa de MMKV con fallback seguro
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createMMKV } = require('react-native-mmkv');
  const mmkvInstance = createMMKV({ id: 'lesconect-auth-storage' });
  if (mmkvInstance) {
    mmkvStateStorage = {
      setItem: (name: string, value: string) => mmkvInstance.set(name, value),
      getItem: (name: string) => mmkvInstance.getString(name) ?? null,
      removeItem: (name: string) => mmkvInstance.remove(name),
    };
  }
} catch (error) {
  // Fallback transparente para entornos Expo Go y Web
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      registeredAccounts: {},
      lastRegisteredPhone: null,

      login: (user: User, token: string) => {
        const cleanIncoming = sanitizeUserPayload(user) as User;
        set((state) => {
          const priorAccount =
            lookupUserInDirectory(
              state.registeredAccounts,
              cleanIncoming.phone || cleanIncoming.telefono || ''
            ) ||
            lookupUserInDirectory(
              state.registeredAccounts,
              cleanIncoming.cedula || ''
            );

          const isGenericName =
            !cleanIncoming.name ||
            cleanIncoming.name === 'Usuario LESCOnect';

          const resolvedNombre =
            (!isGenericName ? cleanIncoming.nombre : undefined) ||
            priorAccount?.nombre ||
            cleanIncoming.nombre ||
            cleanIncoming.name;
          const resolvedApellidos =
            cleanIncoming.apellidos || priorAccount?.apellidos || '';
          const resolvedFullName =
            (!isGenericName ? cleanIncoming.name : undefined) ||
            priorAccount?.name ||
            `${resolvedNombre || ''} ${resolvedApellidos || ''}`.trim() ||
            'Usuario LESCOnect';

          const incomingSos = Array.isArray(cleanIncoming.sosContacts)
            ? cleanIncoming.sosContacts
            : [];
          const priorSos = Array.isArray(priorAccount?.sosContacts)
            ? priorAccount.sosContacts
            : [];

          // Si el login entrante no trae contactos SOS pero la cuenta registrada sí tenía, se preservan
          const mergedSosContacts =
            incomingSos.length > 0 ? incomingSos : priorSos;
          const primarySos = mergedSosContacts[0];

          const resolvedPhone =
            cleanIncoming.phone ||
            cleanIncoming.telefono ||
            priorAccount?.phone ||
            priorAccount?.telefono ||
            '';

          const finalUser: User = {
            ...(priorAccount || {}),
            ...cleanIncoming,
            id: cleanIncoming.id || priorAccount?.id || Date.now().toString(),
            name: resolvedFullName,
            nombre: resolvedNombre,
            apellidos: resolvedApellidos,
            cedula: cleanIncoming.cedula || priorAccount?.cedula || '',
            phone: resolvedPhone,
            telefono: resolvedPhone,
            fechaNacimiento:
              cleanIncoming.fechaNacimiento || priorAccount?.fechaNacimiento,
            emergencyContact:
              cleanIncoming.emergencyContact ||
              cleanIncoming.contactoEmergencia ||
              priorAccount?.emergencyContact ||
              priorAccount?.contactoEmergencia ||
              primarySos?.phone ||
              '',
            contactoEmergencia:
              cleanIncoming.contactoEmergencia ||
              cleanIncoming.emergencyContact ||
              priorAccount?.contactoEmergencia ||
              priorAccount?.emergencyContact ||
              primarySos?.phone ||
              '',
            contactoEmergenciaNombre:
              cleanIncoming.contactoEmergenciaNombre ||
              priorAccount?.contactoEmergenciaNombre ||
              primarySos?.name ||
              '',
            contactoEmergenciaParentesco:
              cleanIncoming.contactoEmergenciaParentesco ||
              priorAccount?.contactoEmergenciaParentesco ||
              primarySos?.relation ||
              'Familiar',
            contactoEmergenciaSabeLesco:
              cleanIncoming.contactoEmergenciaSabeLesco ??
              priorAccount?.contactoEmergenciaSabeLesco ??
              primarySos?.knowsLesco ??
              false,
            sosContacts: mergedSosContacts,
          };

          const updatedDirectory = upsertRegisteredAccountMap(
            state.registeredAccounts,
            finalUser
          );
          const cleanPhoneDigits = validateCRPhone(resolvedPhone).digits;

          return {
            user: finalUser,
            token: sanitizeText(token, 512),
            isAuthenticated: true,
            isLoading: false,
            registeredAccounts: updatedDirectory,
            lastRegisteredPhone:
              cleanPhoneDigits || state.lastRegisteredPhone || null,
          };
        });
      },

      logout: () => {
        set((state) => {
          // Resguardar cualquier cambio final del usuario activo antes de cerrar la sesión
          const updatedDirectory = state.user
            ? upsertRegisteredAccountMap(state.registeredAccounts, state.user)
            : state.registeredAccounts;
          const activePhoneDigits = state.user
            ? validateCRPhone(state.user.phone || state.user.telefono || '').digits
            : '';

          return {
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            registeredAccounts: updatedDirectory,
            lastRegisteredPhone:
              activePhoneDigits || state.lastRegisteredPhone || null,
          };
        });
        supabase.auth.signOut().catch(() => {});
      },

      updateUser: (partialUser: Partial<User>) => {
        const cleanPartial = sanitizeUserPayload(partialUser);
        set((state) => {
          const baseUser = state.user || ({} as User);
          const nextUser: User = {
            ...baseUser,
            ...cleanPartial,
          };

          // Mantener sincronizados los campos del contacto primario cuando se actualiza sosContacts
          if (
            Array.isArray(nextUser.sosContacts) &&
            nextUser.sosContacts.length > 0
          ) {
            const primary = nextUser.sosContacts[0];
            if (!cleanPartial.contactoEmergencia && primary.phone) {
              nextUser.contactoEmergencia = primary.phone;
              nextUser.emergencyContact = primary.phone;
            }
            if (!cleanPartial.contactoEmergenciaNombre && primary.name) {
              nextUser.contactoEmergenciaNombre = primary.name;
            }
            if (!cleanPartial.contactoEmergenciaParentesco && primary.relation) {
              nextUser.contactoEmergenciaParentesco = primary.relation;
            }
            if (
              cleanPartial.contactoEmergenciaSabeLesco === undefined &&
              primary.knowsLesco !== undefined
            ) {
              nextUser.contactoEmergenciaSabeLesco = primary.knowsLesco;
            }
          }

          const updatedDirectory = upsertRegisteredAccountMap(
            state.registeredAccounts,
            nextUser
          );
          const phoneDigits = validateCRPhone(
            nextUser.phone || nextUser.telefono || ''
          ).digits;

          return {
            user: nextUser,
            registeredAccounts: updatedDirectory,
            lastRegisteredPhone:
              phoneDigits || state.lastRegisteredPhone || null,
          };
        });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      findRegisteredUser: (identifier: string) => {
        const state = get();
        return lookupUserInDirectory(state.registeredAccounts, identifier);
      },

      getLastRegisteredUser: () => {
        const state = get();
        if (state.lastRegisteredPhone) {
          const found = lookupUserInDirectory(
            state.registeredAccounts,
            state.lastRegisteredPhone
          );
          if (found) return found;
        }
        if (state.user) {
          return state.user;
        }
        return null;
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        registeredAccounts: state.registeredAccounts,
        lastRegisteredPhone: state.lastRegisteredPhone,
      }),
    }
  )
);
