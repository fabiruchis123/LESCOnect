import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

interface TextToSignsScreenProps {
  onBackPress?: () => void;
}

const QUICK_CHIPS = ['Hola', 'Por favor', 'Gracias', '¿Dónde queda?', 'Necesito ayuda'];

export function TextToSignsScreen({ onBackPress }: TextToSignsScreenProps) {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [speed, setSpeed] = useState<'0.5x' | '0.75x' | '1x'>('1x');
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleTranslate = () => {
    if (!inputText.trim()) {
      Alert.alert('Escribe una frase', 'Por favor ingresa texto para generar el video en señas.');
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación Superior */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver</Text>
        </View>

        <Text style={styles.title}>Texto / Voz → Señas</Text>
        <Text style={styles.subtitle}>Traduce texto o voz a videos en señas LESCO</Text>

        {/* Cuadro del Reproductor de Señas */}
        <View style={styles.playerBox}>
          {/* Selector de Velocidad */}
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
                <Text style={[styles.speedChipText, speed === s && styles.speedChipTextActive]}>
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
            onPress={handleTranslate}
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
    color: '#5C7A5C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.lg,
  },
  playerBox: {
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
    minHeight: 100,
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
