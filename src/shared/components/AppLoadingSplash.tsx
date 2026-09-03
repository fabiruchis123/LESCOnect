import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Spacing, Typography } from '@/shared/theme';
import { BrandLogo } from './BrandLogo';

export const AppLoadingSplash: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Configurar título dinámico en entorno Web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'LESCOnect — Puente de comunicación e inclusión';
    }

    // Animación suave de respiración / pulso
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.97,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
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
          <BrandLogo variant="hands" height={100} width={100} />
        </View>
      </Animated.View>

      {/* Logotipo tipográfico */}
      <BrandLogo
        variant="wordmark"
        height={34}
        containerStyle={styles.wordmarkContainer}
      />

      <Text style={styles.tagline}>Puente de comunicación e inclusión</Text>

      {/* Indicador de carga terracota */}
      <View style={styles.indicatorContainer}>
        <ActivityIndicator size="small" color={Colors.primary.main} />
      </View>
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
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  wordmarkContainer: {
    marginBottom: 6,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#7A6E5C',
    letterSpacing: 0.2,
    marginBottom: Spacing.xl,
  },
  indicatorContainer: {
    marginTop: Spacing.md,
  },
});
