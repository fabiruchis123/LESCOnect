import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';

interface SignsToTextScreenProps {
  onBackPress?: () => void;
}

export function SignsToTextScreen({ onBackPress }: SignsToTextScreenProps) {
  const router = useRouter();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [transcribedText, setTranscribedText] = useState(
    'Hola, buenos días. ¿Dónde puedo realizar este trámite?'
  );

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleToggleDetection = () => {
    haptics.medium();
    setIsDetecting((prev) => !prev);
    if (!isDetecting) {
      // Simular reconocimiento progresivo
      setTranscribedText('Detectando señas...');
      setTimeout(() => {
        setTranscribedText('Hola, necesito asistencia en ventanilla');
        haptics.success();
      }, 1200);
    }
  };

  const handleSpeak = () => {
    haptics.light();
    speechService.speak(transcribedText);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación Superior */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver</Text>
        </View>

        <Text style={styles.title}>Señas → Texto / Voz</Text>
        <Text style={styles.subtitle}>Detección y reconocimiento de señas</Text>

        {/* Viewport Simulado de Cámara */}
        <View style={styles.cameraBox}>
          {/* Badge Estado */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {isDetecting ? '🔴 Reconociendo LESCO' : '🟢 MediaPipe Listo'}
            </Text>
          </View>

          {/* Icono central y guía de encuadre */}
          <View style={styles.frameGuide}>
            <View style={styles.cameraIconBox}>
              <Text style={{ fontSize: 32 }}>📷</Text>
            </View>
            <Text style={styles.cameraTitle}>
              {isDetecting ? 'Mano detectada en el encuadre' : 'Vista de Cámara LESCO'}
            </Text>
            <Text style={styles.cameraSub}>
              Coloca tu mano dentro del encuadre para reconocer señas en tiempo real
            </Text>
          </View>

          {/* Controles de Cámara Superiores */}
          <View style={styles.cameraControlsRow}>
            <TouchableOpacity
              style={[styles.camControlBtn, isFlashOn && styles.camControlBtnActive]}
              onPress={() => {
                haptics.light();
                setIsFlashOn(!isFlashOn);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.camControlIcon}>{isFlashOn ? '⚡' : '💡'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.camControlBtn}
              onPress={() => {
                haptics.light();
                setIsFrontCamera(!isFrontCamera);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.camControlIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Área de Transcripción */}
        <View style={styles.transcriptionCard}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.transcriptionLabel}>Texto transcrito:</Text>
            <TouchableOpacity onPress={handleSpeak} style={styles.ttsBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>🔊</Text>
              <Text style={styles.ttsBtnText}>Escuchar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.transcribedText}>{transcribedText}</Text>
        </View>

        {/* Botón Principal de Acción */}
        <TouchableOpacity
          style={[styles.actionBtn, isDetecting && styles.actionBtnStop]}
          onPress={handleToggleDetection}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnEmoji}>{isDetecting ? '⏹️' : '📷'}</Text>
          <Text style={styles.actionBtnText}>
            {isDetecting ? 'Pausar detección con cámara' : 'Iniciar detección con cámara'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl * 2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    ...Shadows.subtle,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B241C',
  },
  backBtnLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },
  title: {
    fontSize: 30,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.lg,
  },
  cameraBox: {
    width: '100%',
    height: 280,
    backgroundColor: '#2B241C',
    borderRadius: Radius.xl * 1.2,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#5C7A5C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  frameGuide: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  cameraIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cameraTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cameraSub: {
    fontSize: 11,
    color: '#EAE0D0',
    opacity: 0.85,
    textAlign: 'center',
    maxWidth: 240,
  },
  cameraControlsRow: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  camControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  camControlBtnActive: {
    backgroundColor: '#B5551A',
  },
  camControlIcon: {
    fontSize: 16,
  },
  transcriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    borderLeftWidth: 8,
    borderLeftColor: '#B5551A',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transcriptionLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ttsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  ttsBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
  },
  transcribedText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 26,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#B5551A',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.primaryGlow,
  },
  actionBtnStop: {
    backgroundColor: '#C0392B',
  },
  actionBtnEmoji: {
    fontSize: 18,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
