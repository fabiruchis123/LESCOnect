import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type TextSizeType = 'small' | 'normal' | 'large' | 'extraLarge';

export interface SettingsState {
  vibrationEnabled: boolean;
  textSize: TextSizeType;
  fontSizeNumber: number; // 14, 16, 20, 24
  fontScale: number; // 0.875, 1.0, 1.25, 1.5
  setVibrationEnabled: (enabled: boolean) => void;
  toggleVibration: () => void;
  setTextSize: (size: TextSizeType | number) => void;
}

// Almacenamiento seguro en memoria / LocalStorage para Web y fallback
const memoryStorage = new Map<string, string>();

let mmkvSettingsStorage: StateStorage = {
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
  const mmkvInstance = createMMKV({ id: 'lesconect-settings-storage' });
  if (mmkvInstance) {
    mmkvSettingsStorage = {
      setItem: (name: string, value: string) => mmkvInstance.set(name, value),
      getItem: (name: string) => mmkvInstance.getString(name) ?? null,
      removeItem: (name: string) => mmkvInstance.remove(name),
    };
  }
} catch {
  // Fallback para Expo Go y Web
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vibrationEnabled: true, // Activado de forma predeterminada
      textSize: 'normal',
      fontSizeNumber: 16,
      fontScale: 1.0,

      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      setTextSize: (input) => {
        let size: TextSizeType = 'normal';
        let num = 16;
        let scale = 1.0;

        if (typeof input === 'number') {
          num = input;
          if (input <= 14) {
            size = 'small';
            scale = 0.875;
          } else if (input <= 16) {
            size = 'normal';
            scale = 1.0;
          } else if (input <= 20) {
            size = 'large';
            scale = 1.25;
          } else {
            size = 'extraLarge';
            scale = 1.5;
          }
        } else {
          size = input;
          if (input === 'small') {
            num = 14;
            scale = 0.875;
          } else if (input === 'normal') {
            num = 16;
            scale = 1.0;
          } else if (input === 'large') {
            num = 20;
            scale = 1.25;
          } else if (input === 'extraLarge') {
            num = 24;
            scale = 1.5;
          }
        }

        set({ textSize: size, fontSizeNumber: num, fontScale: scale });
      },
    }),
    {
      name: 'lesconect-settings-storage',
      storage: createJSONStorage(() => mmkvSettingsStorage),
    }
  )
);
