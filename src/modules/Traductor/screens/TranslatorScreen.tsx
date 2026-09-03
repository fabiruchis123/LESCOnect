import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

const QUICK_CHIPS = ['Hola', 'Por favor', 'Gracias', '¿Dónde queda?', 'Necesito ayuda'];

export function TranslatorScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'signsToText' | 'textToSigns'>('signsToText');

  // Sincronizar parámetro si proviene de otra vista
  useEffect(() => {
    if (params.mode === 'textToSigns' || params.mode === 'text_to_signs') {
      setMode('textToSigns');
    } else if (params.mode === 'signsToText' || params.mode === 'signs_to_text') {
      setMode('signsToText');
    }
  }, [params.mode]);

  // Estados Modo Cámara (Señas → Texto/Voz)
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [transcribedText, setTranscribedText] = useState(
    'Hola, buenos días. ¿Dónde puedo realizar este trámite?'
  );

  // Estados Modo Texto/Voz (Texto/Voz → Señas)
  const [inputText, setInputText] = useState('');
  const [speed, setSpeed] = useState<'0.5x' | '0.75x' | '1x'>('1x');
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleToggleDetection = () => {
    haptics.medium();
    setIsDetecting((prev) => !prev);
    if (!isDetecting) {
      setTranscribedText('Detectando señas...');
      setTimeout(() => {
        setTranscribedText('Hola, necesito asistencia en ventanilla');
        haptics.success();
      }, 1200);
    }
  };

  const handleSpeak = (text: string) => {
    haptics.light();
    speechService.speak(text);
  };

  const handleTranslateToSigns = () => {
    if (!inputText.trim()) {
      Alert.alert('Escribe una frase', 'Por favor ingresa texto para generar la seña en LESCO.');
      return;
    }
    haptics.success();
    setActiveVideo({
      title: inputText.trim(),
      category: 'Traducción a Señas',
      glossText: inputText.trim().toUpperCase().split(' ').join(' • '),
    });
  };

  const handleVoiceDictation = () => {
    haptics.medium();
    Alert.alert(
      '🎙️ Dictado por Voz',
      'Escuchando audio... Di tu frase con claridad.',
      [
        {
          text: 'Simular "Buenas tardes, vengo a consultar"',
          onPress: () => {
            setInputText('Buenas tardes, vengo a consultar');
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Encabezado Principal */}
        <Text style={styles.title}>Traductor LESCO</Text>
        <Text style={styles.subtitle}>Traducción bidireccional en tiempo real</Text>

        {/* Selector de Modo Directo (Pestañas Segmentadas en la cabecera) */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'signsToText' && styles.tabBtnActiveSigns]}
            onPress={() => {
              haptics.light();
              setMode('signsToText');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                mode === 'signsToText' && styles.tabBtnTextActiveSigns,
              ]}
            >
              📷 Señas → Texto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'textToSigns' && styles.tabBtnActiveText]}
            onPress={() => {
              haptics.light();
              setMode('textToSigns');
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                mode === 'textToSigns' && styles.tabBtnTextActiveText,
              ]}
            >
              💬 Texto → Señas
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================= */}
        {/* MODO 1: CÁMARA (SEÑAS → TEXTO / VOZ)                    */}
        {/* ======================================================= */}
        {mode === 'signsToText' && (
          <View>
            {/* Viewport de Cámara */}
            <View style={styles.cameraBox}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {isDetecting ? '🔴 Reconociendo LESCO' : '🟢 MediaPipe Listo'}
                </Text>
              </View>

              <View style={styles.frameGuide}>
                <View style={styles.cameraIconBox}>
                  <Text style={{ fontSize: 32 }}>📷</Text>
                </View>
                <Text style={styles.cameraTitle}>
                  {isDetecting ? 'Mano detectada en el encuadre' : 'Vista de Cámara LESCO'}
                </Text>
                <Text style={styles.cameraSub}>
                  Coloca tu mano dentro del encuadre para reconocer dactilología y señas
                </Text>
              </View>

              {/* Controles de Cámara */}
              <View style={styles.cameraControlsRow}>
                <TouchableOpacity
                  style={[styles.camControlBtn, isFlashOn && styles.camControlBtnActive]}
                  onPress={() => {
                    haptics.light();
                    setIsFlashOn(!isFlashOn);
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel="Alternar linterna"
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
                  accessibilityLabel="Cambiar cámara"
                >
                  <Text style={styles.camControlIcon}>🔄</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Área de Transcripción */}
            <View style={styles.transcriptionCard}>
              <View style={styles.transcriptionHeader}>
                <Text style={styles.transcriptionLabel}>Texto transcrito:</Text>
                <TouchableOpacity
                  onPress={() => handleSpeak(transcribedText)}
                  style={styles.ttsBtn}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>🔊</Text>
                  <Text style={styles.ttsBtnText}>Escuchar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.transcribedText}>{transcribedText}</Text>
            </View>

            {/* Botón Principal de Detección */}
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
          </View>
        )}

        {/* ======================================================= */}
        {/* MODO 2: REPRODUCTOR (TEXTO / VOZ → SEÑAS)               */}
        {/* ======================================================= */}
        {mode === 'textToSigns' && (
          <View>
            {/* Cuadro del Reproductor de Señas */}
            <View style={styles.playerBox}>
              <View style={styles.speedRow}>
                {(['0.5x', '0.75x', '1x'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.speedChip, speed === s && styles.speedChipActive]}
                    onPress={() => {
                      haptics.light();
                      setSpeed(s);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.speedChipText,
                        speed === s && styles.speedChipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>🤟</Text>
              </View>
              <Text style={styles.playerTitle}>Reproductor de Señas LESCO</Text>
              <Text style={styles.playerSub}>
                Los clips secuenciales de señas se reproducirán aquí
              </Text>
            </View>

            {/* Chips de Frases Rápidas */}
            <View style={styles.quickChipsRow}>
              {QUICK_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => {
                    haptics.light();
                    setInputText(chip);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Entrada de Texto */}
            <TextInput
              style={styles.textArea}
              placeholder="Escribe aquí lo que deseas traducir a señas LESCO..."
              placeholderTextColor="#7A6E5C"
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={setInputText}
            />

            {/* Botones de Acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.translateBtn}
                onPress={handleTranslateToSigns}
                activeOpacity={0.85}
              >
                <Text style={styles.translateBtnText}>Traducir a señas</Text>
                <Text style={{ fontSize: 18 }}>🤟</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dictationBtn}
                onPress={handleVoiceDictation}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>🎤</Text>
                <Text style={styles.dictationBtnText}>Usar dictado por voz</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Video LESCO */}
      {activeVideo && (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
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
  title: {
    fontSize: 28,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EADA',
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActiveSigns: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  tabBtnActiveText: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  tabBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },
  tabBtnTextActiveSigns: {
    color: '#B5551A',
  },
  tabBtnTextActiveText: {
    color: '#5C7A5C',
  },
  cameraBox: {
    width: '100%',
    height: 270,
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
    width: 60,
    height: 60,
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
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 24,
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
  playerBox: {
    width: '100%',
    height: 260,
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
  speedRow: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.pill,
    padding: 3,
    gap: 3,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  speedChipActive: {
    backgroundColor: '#5C7A5C',
  },
  speedChipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  speedChipTextActive: {
    color: '#FFFFFF',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerSub: {
    fontSize: 11,
    color: '#EAE0D0',
    opacity: 0.85,
    textAlign: 'center',
    maxWidth: 240,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    padding: Spacing.md,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: '#2B241C',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  translateBtn: {
    width: '100%',
    backgroundColor: '#5C7A5C',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  translateBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  dictationBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    paddingVertical: 12,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dictationBtnText: {
    color: '#2B241C',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
});
