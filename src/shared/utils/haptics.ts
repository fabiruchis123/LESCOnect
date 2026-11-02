import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/useSettingsStore';

export const haptics = {
  /**
   * Vibración táctil para botones, tabs y selecciones
   */
  light: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      try {
        Vibration.vibrate(40);
      } catch {}
    });
  },

  /**
   * Vibración media para confirmaciones y cambios de estado (toggle)
   */
  medium: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
      try {
        Vibration.vibrate(80);
      } catch {}
    });
  },

  /**
   * Doble pulso de confirmación exitosa (ej: crear cuenta)
   */
  success: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      try {
        Vibration.vibrate(140);
      } catch {}
    });
  },

  /**
   * Pulso de advertencia o error en formulario
   */
  warning: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {
      try {
        Vibration.vibrate(140);
      } catch {}
    });
  },

  /**
   * Patrón de vibración continuo e insistente para emergencias SOS 9-1-1
   */
  emergency: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    try {
      Vibration.vibrate([0, 250, 120, 250]);
    } catch {}
  },

  /**
   * Pulso de prueba directo para verificar el hardware del teléfono
   */
  test: () => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      Vibration.vibrate(220);
    } catch {}
  },
};
