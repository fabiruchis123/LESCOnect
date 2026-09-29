import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { useSettingsStore } from '@/shared/stores';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

interface TextSizeScreenProps {
  onBackPress?: () => void;
}

const TEXT_OPTIONS = [
  { size: 14, label: 'Pequeño (14px)', desc: 'Para pantallas compactas' },
  { size: 16, label: 'Normal (16px) • Recomendado', desc: 'Tamaño estándar del sistema' },
  { size: 20, label: 'Grande (20px)', desc: 'Mayor legibilidad y confort visual' },
  { size: 24, label: 'Muy grande (24px)', desc: 'Máxima visibilidad accesible' },
];

export function TextSizeScreen({ onBackPress }: TextSizeScreenProps) {
  const router = useRouter();
  const fontSizeNumber = useSettingsStore((state) => state.fontSizeNumber || 16);
  const setTextSize = useSettingsStore((state) => state.setTextSize);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleSelectSize = (size: number) => {
    haptics.medium();
    setTextSize(size);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver al perfil</Text>

          <TouchableOpacity
            style={styles.lescoBtn}
            onPress={() =>
              setActiveVideo({
                title: 'Ajustes de Tamaño de Texto',
                category: 'Accesibilidad Visual',
                glossText: 'LETRAS TEXTO TAMAÑO GRANDE PEQUEÑO CONFIGURAR VISUAL FÁCIL',
              })
            }
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>📹</Text>
            <Text style={styles.lescoBtnText}>Ver en señas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Tamaño de texto</Text>
          {savedFeedback && (
            <View style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>✓ Guardado</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Ajusta la legibilidad según tu preferencia visual</Text>

        {/* Tarjeta de Previsualización en Tiempo Real */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>Vista previa en tiempo real:</Text>
            <Text style={styles.previewSizeIndicator}>{fontSizeNumber}px</Text>
          </View>
          <Text
            style={[
              styles.previewText,
              { fontSize: fontSizeNumber, lineHeight: Math.round(fontSizeNumber * 1.35) },
            ]}
          >
            "Hola, soy una persona sorda. Necesito que nos comuniquemos por medio de esta pantalla."
          </Text>
        </View>

        {/* Opciones de Tamaño */}
        <View style={styles.optionsList}>
          {TEXT_OPTIONS.map((opt) => {
            const isSelected = fontSizeNumber === opt.size;
            return (
              <TouchableOpacity
                key={opt.size}
                style={[
                  styles.optionBtn,
                  isSelected && styles.optionBtnActive,
                ]}
                onPress={() => handleSelectSize(opt.size)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${opt.label}. ${opt.desc}`}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleActive,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={styles.activeCheckPill}>
                    <Text style={styles.activeCheckText}>Activo</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
    flex: 1,
  },
  lescoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#C8DAC8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  lescoBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#5C7A5C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    letterSpacing: -0.5,
  },
  savedBadge: {
    backgroundColor: '#EAF5EA',
    borderWidth: 1,
    borderColor: '#5C7A5C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#5C7A5C',
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.lg,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewSizeIndicator: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    color: '#7A6E5C',
    backgroundColor: '#F3EADA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  previewText: {
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  optionBtnActive: {
    borderColor: '#B5551A',
    backgroundColor: '#FDFBF7',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#B5551A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B5551A',
  },
  optionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  optionLabelActive: {
    color: '#B5551A',
  },
  optionDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    marginTop: 1,
  },
  activeCheckPill: {
    backgroundColor: '#B5551A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  activeCheckText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
  },
});
