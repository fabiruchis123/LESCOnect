import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Utilidad de síntesis de voz (Text-to-Speech) multiplataforma (Web + iOS + Android)
 * Configurado con acento en español y cadencia pausada y clara para ventanillas.
 */
export const speechService = {
  speak: (text: string, onDone?: () => void) => {
    if (!text || !text.trim()) return;

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'es-CR'; // Preferencia español de Costa Rica
          utterance.rate = 0.92;    // Velocidad clara y comprensible
          utterance.pitch = 1.0;
          if (onDone) {
            utterance.onend = onDone;
          }
          window.speechSynthesis.speak(utterance);
          return;
        }
      }

      // Entorno nativo con expo-speech
      Speech.stop();
      Speech.speak(text, {
        language: 'es-CR',
        pitch: 1.0,
        rate: 0.92,
        onDone,
      });
    } catch (error) {
      console.warn('Error en síntesis de voz TTS:', error);
    }
  },

  stop: () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        return;
      }
      Speech.stop();
    } catch (error) {
      console.warn('Error al detener síntesis de voz:', error);
    }
  },
};
