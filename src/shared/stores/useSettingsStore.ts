import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export interface SettingsState {
  vibrationEnabled: boolean;
  textSize: 'normal' | 'large' | 'extraLarge';
  setVibrationEnabled: (enabled: boolean) => void;
  toggleVibration: () => void;
  setTextSize: (size: 'normal' | 'large' | 'extraLarge') => void;
}

const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vibrationEnabled: true, // Activado de forma predeterminada
      textSize: 'normal',

      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      setTextSize: (textSize) => set({ textSize }),
    }),
    {
      name: 'lesconect-settings',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
