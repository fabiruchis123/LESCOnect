import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/shared/theme';
import { BrandLogo } from './BrandLogo';

interface AppLoadingSplashProps {
  onFinish?: () => void;
  targetDuration?: number;
}

export const AppLoadingSplash: React.FC<AppLoadingSplashProps> = ({
  onFinish,
  targetDuration = 2200,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // Configurar título dinámico en entorno Web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'LESCOnect — Puente de comunicación e inclusión';
    }

    // 1. Animación suave de respiración / pulso en el logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 2. Listener para actualizar el porcentaje numérico en tiempo real (0% -> 100%)
    const listenerId = progressAnim.addListener(({ value }) => {
      setPercent(Math.min(100, Math.round(value)));
    });

    // 3. Animación fluida de la barra de progreso
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: targetDuration,
      useNativeDriver: false,
    }).start(() => {
      if (onFinish) {
        onFinish();
      }
    });

    return () => {
      pulseLoop.stop();
      progressAnim.removeListener(listenerId);
    };
  }, [pulseAnim, progressAnim, onFinish, targetDuration]);

  // Mensaje dinámico según el porcentaje de carga
  const getLoadingMessage = (p: number) => {
    if (p < 35) return 'Iniciando LESCOnect...';
    if (p < 75) return 'Cargando módulos de señas...';
    if (p < 95) return 'Preparando red de auxilio...';
    return '¡Todo listo!';
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Contenedor del Isologotipo de manos sin recuadros grises */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <BrandLogo variant="hands" height={110} width={110} />
      </Animated.View>

      {/* Logotipo tipográfico oficial */}
      <BrandLogo
        variant="wordmark"
        height={36}
        containerStyle={styles.wordmarkContainer}
      />

      {/* Eslogan empático */}
      <Text style={styles.tagline}>Puente de comunicación e inclusión</Text>

      {/* Barra de Progreso Animada con Porcentaje */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfoRow}>
          <Text style={styles.loadingMessage}>{getLoadingMessage(percent)}</Text>
          <Text style={styles.percentageText}>{percent}%</Text>
        </View>

        {/* Pista de la barra */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
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
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkContainer: {
    marginBottom: 6,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: '#7A6E5C',
    letterSpacing: 0.2,
    marginBottom: Spacing.xxxl,
  },
  progressSection: {
    width: 240,
    alignItems: 'center',
  },
  progressInfoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B5551A',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#E8DFCE',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DFD5C4',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: '#B5551A',
  },
});
