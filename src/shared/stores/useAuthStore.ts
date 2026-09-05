import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

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
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
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
    (set) => ({
      user: {
        id: '1',
        name: 'Génesis Pamela',
        nombre: 'Génesis Pamela',
        apellidos: 'Leiva Gómez',
        cedula: '5-0454-0188',
        telefono: '8888-8888',
        phone: '8888-8888',
        contactoEmergencia: '',
        contactoEmergenciaNombre: '',
        sosContacts: [],
      },
      token: 'mock-token-lesconect',
      isAuthenticated: true,
      isLoading: false,

      login: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (partialUser: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : (partialUser as User),
        })),

      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: 'lesconect-auth',
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
