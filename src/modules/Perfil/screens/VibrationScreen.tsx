import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

interface VibrationScreenProps {
  onBackPress?: () => void;
}

export function VibrationScreen({ onBackPress }: VibrationScreenProps) {
  const router = useRouter();
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [intensity, setIntensity] = useState<'suave' | 'media' | 'fuerte'>('media');
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleTestVibration = () => {
    if (!isVibrationEnabled) return;
    if (intensity === 'suave') haptics.light();
    else if (intensity === 'media') haptics.medium();
    else haptics.emergency();
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
                title: 'Ajustes de Vibración Háptica',
                category: 'Accesibilidad Táctil',
                glossText: 'VIBRAR TELÉFONO HÁPTICO TOCAR BOTONES SENTIR ALERTA',
              })
            }
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>📹</Text>
            <Text style={styles.lescoBtnText}>Ver en señas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Vibración</Text>
        <Text style={styles.subtitle}>Configuración de retroalimentación háptica</Text>

        {/* Tarjeta Principal de Switch */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchTitle}>Activar vibración táctil</Text>
              <Text style={styles.switchDesc}>
                Vibrar al tocar botones, confirmar envíos y al recibir respuestas
              </Text>
            </View>

            <Switch
              value={isVibrationEnabled}
              onValueChange={(val) => {
                haptics.light();
                setIsVibrationEnabled(val);
              }}
              trackColor={{ false: '#EAE0D0', true: Colors.primary.border }}
              thumbColor={isVibrationEnabled ? Colors.primary.main : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Nivel de Intensidad */}
        {isVibrationEnabled && (
          <View style={styles.intensityCard}>
            <Text style={styles.intensityLabel}>Intensidad de vibración:</Text>

            <View style={styles.intensityOptionsRow}>
              {(['suave', 'media', 'fuerte'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.intensityBtn,
                    intensity === lvl && styles.intensityBtnActive,
                  ]}
                  onPress={() => {
                    setIntensity(lvl);
                    if (lvl === 'suave') haptics.light();
                    else if (lvl === 'media') haptics.medium();
                    else haptics.emergency();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.intensityBtnText,
                      intensity === lvl && styles.intensityBtnTextActive,
                    ]}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestVibration}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14 }}>📳</Text>
              <Text style={styles.testBtnText}>Probar vibración</Text>
            </TouchableOpacity>
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
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#F9E79F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  lescoBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#B7950B',
  },
  title: {
    fontSize: 30,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    lineHeight: 16,
  },
  intensityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  intensityLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
    textTransform: 'uppercase',
  },
  intensityOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityBtnActive: {
    borderColor: '#B5551A',
    backgroundColor: '#F3EADA',
  },
  intensityBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },
  intensityBtnTextActive: {
    color: '#B5551A',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: Radius.md,
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
});
