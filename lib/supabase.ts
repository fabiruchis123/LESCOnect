import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ifxloswngdoharodsawt.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_CEyylatwjyHdl2najqA1Jg_v99j8QIX';
export const VIDEO_BASE_URL = (
  process.env.EXPO_PUBLIC_VIDEO_BASE_URL ||
  'https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev'
).replace(/\/+$/, '');

// Adaptador seguro para SSR/Web y React Native (AsyncStorage)
const safeAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') return null;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') return;
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') return;
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type VideoOrientation = 'vertical' | 'horizontal';

/**
 * Construye la URL pública en Cloudflare R2 para un r2_key dado.
 * Ejemplo: videoUrl('lesco/v1/m5/emergencia/1_2.mp4')
 * Soporta tanto la presentación vertical (por defecto) como la horizontal.
 */
export const videoUrl = (
  r2Key: string,
  orientation: VideoOrientation = 'vertical'
): string => {
  const cleanKey = r2Key.replace(/^\/+/, '');
  if (orientation === 'horizontal') {
    if (cleanKey.startsWith('horizontal/')) {
      return `${VIDEO_BASE_URL}/${cleanKey}`;
    }
    return `${VIDEO_BASE_URL}/horizontal/${cleanKey}`;
  }
  return `${VIDEO_BASE_URL}/${cleanKey}`;
};
