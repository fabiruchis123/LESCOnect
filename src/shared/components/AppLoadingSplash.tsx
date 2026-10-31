import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { BrandLogo } from './BrandLogo';

const LOADING_MESSAGES = [
  '🤟 Preparando catálogo de señas y modo offline...',
  '🚨 Verificando canal visual de Auxilio SOS y Red de Apoyo...',
  '✨ Sincronizando subtítulos e intérprete LESCO...',
  '📱 Iniciando motor de visión artificial LESCOnect...',
];

export const AppLoadingSplash: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeEntrance = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(14)).current;

  // Ondas concéntricas de expresión visual (Terracota y Verde Salvia)
  const rippleTerracotaScale = useRef(new Animated.Value(1)).current;
  const rippleTerracotaOpacity = useRef(new Animated.Value(0.45)).current;

  const rippleSalviaScale = useRef(new Animated.Value(1)).current;
  const rippleSalviaOpacity = useRef(new Animated.Value(0.35)).current;

  // Progreso animado con Native Driver (scaleX)
  const progressScale = useRef(new Animated.Value(0.15)).current;

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Configurar título dinámico en entorno Web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'LESCOnect — Puente de comunicación e inclusión';
    }

    // Entrada suave de elementos
    Animated.parallel([
      Animated.timing(fadeEntrance, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animación suave de respiración / pulso del medallón central
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.97,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Anillo 1: Onda Terracota (#B5551A)
    const terracotaRippleLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(rippleTerracotaScale, {
          toValue: 1.52,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rippleTerracotaOpacity, {
          toValue: 0,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Anillo 2: Onda Verde Salvia (#5C7A5C) desfasada
    const salviaRippleLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(rippleSalviaScale, {
            toValue: 1.72,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleSalviaOpacity, {
            toValue: 0,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Barra de progreso continua de 10 segundos para inicialización completa de la app
    progressScale.setValue(0.04);
    const progressAnimation = Animated.timing(progressScale, {
      toValue: 1.0,
      duration: 10000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    });

    pulseLoop.start();
    terracotaRippleLoop.start();
    salviaRippleLoop.start();
    progressAnimation.start();

    const stepTimer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      pulseLoop.stop();
      terracotaRippleLoop.stop();
      salviaRippleLoop.stop();
      progressAnimation.stop();
      clearInterval(stepTimer);
    };
  }, [
    fadeEntrance,
    progressScale,
    pulseAnim,
    rippleSalviaOpacity,
    rippleSalviaScale,
    rippleTerracotaOpacity,
    rippleTerracotaScale,
    slideUpAnim,
  ]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando LESCOnect, puente de comunicación e inclusión"
    >
      {/* Decoración ambiental superior e inferior en tonos cálidos */}
      <View style={styles.ambientTopGlow} pointerEvents="none" />
      <View style={styles.ambientBottomGlow} pointerEvents="none" />

      {/* Banner Superior de Identidad */}
      <Animated.View
        style={[
          styles.topIdentityPill,
          {
            opacity: fadeEntrance,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <View style={styles.liveDot} />
        <Text style={styles.topIdentityText}>
          COSTA RICA • INCLUSIÓN DIGITAL LESCO
        </Text>
      </Animated.View>

      {/* Halo / Ondas Visuales de Comunicación + Isotipo de Manos */}
      <View style={styles.emblemStage}>
        {/* Anillo exterior Verde Salvia (#5C7A5C) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rippleRing,
            styles.rippleRingSalvia,
            {
              opacity: rippleSalviaOpacity,
              transform: [{ scale: rippleSalviaScale }],
            },
          ]}
        />

        {/* Anillo interior Terracota (#B5551A) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rippleRing,
            styles.rippleRingTerracota,
            {
              opacity: rippleTerracotaOpacity,
              transform: [{ scale: rippleTerracotaScale }],
            },
          ]}
        />

        {/* Contenedor del Isologotipo con pulso suave */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.logoBadge}>
            <View style={styles.logoInnerRing}>
              <BrandLogo variant="hands" height={96} width={96} />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Logotipo tipográfico y lema oficial */}
      <Animated.View
        style={[
          styles.brandBlock,
          {
            opacity: fadeEntrance,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <BrandLogo
          variant="wordmark"
          height={36}
          containerStyle={styles.wordmarkContainer}
        />

        <Text style={styles.tagline}>Puente de comunicación e inclusión</Text>
      </Animated.View>

      {/* Tarjeta de Progreso e Inicialización Inteligente */}
      <Animated.View
        style={[
          styles.progressCard,
          {
            opacity: fadeEntrance,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressStatusText} numberOfLines={1}>
            {LOADING_MESSAGES[stepIndex]}
          </Text>
          <ActivityIndicator size="small" color={Colors.primary.main} />
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                transform: [{ scaleX: progressScale }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Banners / Píldoras Inferiores de Pilares de LESCOnect */}
      <Animated.View
        style={[
          styles.pillarsRow,
          {
            opacity: fadeEntrance,
          },
        ]}
      >
        <View style={[styles.pillarBadge, styles.pillarBadgeTerracota]}>
          <Text style={styles.pillarBadgeTextTerracota}>🤟 54 Videos LESCO</Text>
        </View>

        <View style={[styles.pillarBadge, styles.pillarBadgeEmergency]}>
          <Text style={styles.pillarBadgeTextEmergency}>🚨 Auxilio SOS 911</Text>
        </View>

        <View style={[styles.pillarBadge, styles.pillarBadgeSalvia]}>
          <Text style={styles.pillarBadgeTextSalvia}>📶 Offline Ready</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  ambientTopGlow: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#F3EADA',
    opacity: 0.7,
  },
  ambientBottomGlow: {
    position: 'absolute',
    bottom: -130,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#EBF2EB',
    opacity: 0.65,
  },
  topIdentityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.xxl,
    ...Shadows.subtle,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
  },
  topIdentityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    letterSpacing: 0.8,
  },
  emblemStage: {
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rippleRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  rippleRingTerracota: {
    borderWidth: 2.5,
    borderColor: '#B5551A',
    backgroundColor: 'rgba(181, 85, 26, 0.06)',
  },
  rippleRingSalvia: {
    borderWidth: 2,
    borderColor: '#5C7A5C',
    backgroundColor: 'rgba(92, 122, 92, 0.05)',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  logoInnerRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1,
    borderColor: '#F3EADA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  wordmarkContainer: {
    marginBottom: 8,
  },
  tagline: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#7A6E5C',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  progressCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: Spacing.sm,
  },
  progressStatusText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#2B241C',
  },
  progressTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#EAE0D0',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#B5551A',
    borderRadius: Radius.pill,
  },
  pillarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    maxWidth: 380,
  },
  pillarBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pillarBadgeTerracota: {
    backgroundColor: '#F3EADA',
    borderColor: '#E6B08A',
  },
  pillarBadgeTextTerracota: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
  },
  pillarBadgeEmergency: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
  },
  pillarBadgeTextEmergency: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#C0392B',
  },
  pillarBadgeSalvia: {
    backgroundColor: '#EBF2EB',
    borderColor: '#C8DAC8',
  },
  pillarBadgeTextSalvia: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#5C7A5C',
  },
});
