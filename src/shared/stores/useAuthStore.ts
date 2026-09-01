import { createMMKV, type MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  nombre?: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  fechaNacimiento?: string;
  contactoEmergencia?: string;
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

// Inicialización segura de MMKV con fallback en caso de entornos sin módulos nativos (ej. Web)
let mmkvInstance: MMKV | null = null;
try {
  mmkvInstance = createMMKV({ id: 'lesconect-auth-storage' });
} catch (error) {
  console.warn('MMKV initialization fallback to in-memory state:', error);
}

const mmkvStateStorage: StateStorage = {
  setItem: (name, value) => {
    if (mmkvInstance) {
      mmkvInstance.set(name, value);
    }
  },
  getItem: (name) => {
    if (mmkvInstance) {
      const value = mmkvInstance.getString(name);
      return value ?? null;
    }
    return null;
  },
  removeItem: (name) => {
    if (mmkvInstance) {
      mmkvInstance.remove(name);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: 'user-demo-1',
        name: 'Pamela Leiva',
        nombre: 'Pamela',
        apellidos: 'Leiva',
        cedula: '1-1234-5678',
        telefono: '8888-8888',
        contactoEmergencia: '8765-4321',
      },
      token: 'demo-token',
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
