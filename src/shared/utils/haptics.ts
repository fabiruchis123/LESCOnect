import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/useSettingsStore';

export const haptics = {
  /**
   * Vibración táctil para botones, tabs y selecciones
   */
  light: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Vibration.vibrate(80);
    } catch {}
  },

  /**
   * Vibración media para confirmaciones y cambios de estado (toggle)
   */
  medium: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Vibration.vibrate(150);
    } catch {}
  },

  /**
   * Doble pulso de confirmación exitosa (ej: crear cuenta)
   */
  success: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Vibration.vibrate(200);
    } catch {}
  },

  /**
   * Pulso de advertencia o error en formulario
   */
  warning: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Vibration.vibrate(180);
    } catch {}
  },

  /**
   * Patrón de vibración continuo e insistente para emergencias SOS 9-1-1
   */
  emergency: () => {
    if (!useSettingsStore.getState().vibrationEnabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Vibration.vibrate(500);
    } catch {}
  },

  /**
   * Pulso de prueba directo para verificar el hardware del teléfono
   */
  test: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Vibration.vibrate(300);
    } catch {}
  },
};
