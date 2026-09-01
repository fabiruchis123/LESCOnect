import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { LescoVideoModal, LescoVideoInfo } from '@/modules/Home';

export function WelcomeScreen() {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleStart = () => {
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={welcomeStyles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={welcomeStyles.container}>
        {/* Badge LESCO Superior */}
        <View style={welcomeStyles.badgeRow}>
          <View style={welcomeStyles.badge}>
            <Text style={welcomeStyles.badgeText}>🤟 LESCO Costarricense</Text>
          </View>

          {/* Botón de Video LESCO de Bienvenida */}
          <TouchableOpacity
            style={welcomeStyles.videoBtn}
            onPress={() =>
              setActiveVideo({
                title: 'Bienvenida a LESCOnect',
                category: 'Presentación en Señas',
                glossText: 'HOLA BIENVENIDO / LESCOnect APLICACIÓN TRADUCTOR / PERSONA SORDA OYENTE COMUNICAR',
              })
            }
            activeOpacity={0.8}
            accessibilityLabel="Ver bienvenida en señas LESCO"
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>📹</Text>
            <Text style={welcomeStyles.videoBtnText}>Ver en Señas</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta Central Hero */}
        <View style={welcomeStyles.heroCard}>
          <View style={welcomeStyles.iconCircle}>
            <Text style={welcomeStyles.heroIcon}>🤟</Text>
          </View>

          <Text style={welcomeStyles.appName}>LESCOnect</Text>
          <Text style={welcomeStyles.appTagline}>Puente de comunicación e inclusión</Text>

          <View style={welcomeStyles.divider} />

          <Text style={welcomeStyles.description}>
            Traducción en tiempo real entre Lengua de Señas (LESCO), voz y texto para trámites y emergencias.
          </Text>
        </View>

        {/* Botones Inferiores de Acción */}
        <View style={welcomeStyles.actionArea}>
          <TouchableOpacity
            style={welcomeStyles.primaryButton}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={welcomeStyles.primaryButtonText}>Crear mi cuenta →</Text>
          </TouchableOpacity>

          {/* Indicador de Swipe / Continuar */}
          <View style={welcomeStyles.swipeIndicator}>
            <Text style={welcomeStyles.swipeArrow}>▲</Text>
            <Text style={welcomeStyles.swipeText}>Desliza hacia arriba para comenzar</Text>
          </View>
        </View>
      </View>

      {/* Modal de Video LESCO */}
      {activeVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const welcomeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.secondary.surface,
    borderColor: Colors.secondary.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.surface,
    borderColor: Colors.primary.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  videoBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.primary.main,
  },
  heroCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl * 1.2,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary.surface,
    borderWidth: 2,
    borderColor: Colors.primary.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  heroIcon: {
    fontSize: 42,
  },
  appName: {
    fontSize: 32,
    fontWeight: Typography.weights.black,
    color: Colors.primary.main,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
    marginTop: 2,
  },
  divider: {
    width: '40%',
    height: 2,
    backgroundColor: Colors.border.subtle,
    marginVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: Typography.weights.medium,
  },
  actionArea: {
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  swipeIndicator: {
    alignItems: 'center',
    gap: 2,
  },
  swipeArrow: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  swipeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.muted,
    fontWeight: Typography.weights.medium,
  },
});
