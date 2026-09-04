import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { BrandLogo } from '@/shared/components';
import { haptics } from '@/shared/utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function WelcomeScreen() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const isNavigating = useRef(false);

  // Animación física de salida del video hacia arriba (Swipe Up)
  const slideY = useRef(new Animated.Value(0)).current;

  // Animación continua de rebote para la flecha de Swipe Up
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  // Video oficial de bienvenida en señas
  const videoSource = require('../../../../assets/videos/demo_lesco.mp4');

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const toggleSound = () => {
    haptics.light();
    if (!player) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.muted = nextMuted;
  };

  const togglePlay = () => {
    haptics.light();
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  // Navegar al registro haciendo que el video suba físicamente y se reemplace la pantalla
  const triggerSwipeUpNavigation = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    haptics.success();

    // 1. Iniciar subida del video de inmediato hacia arriba
    Animated.timing(slideY, {
      toValue: -SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // 2. Disparar reemplazo a la mitad de la subida para evitar cualquier pausa o pantalla blanca
    setTimeout(() => {
      if (player) {
        player.pause();
      }
      router.replace('/(auth)/signup');
    }, 110);
  };

  // Gesto táctil PanResponder en toda la pantalla
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 || gestureState.vy < -0.25) {
          triggerSwipeUpNavigation();
        }
      },
    })
  ).current;

  return (
    <View style={welcomeStyles.rootBackground}>
      <Animated.View
        style={[
          welcomeStyles.container,
          {
            transform: [{ translateY: slideY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* 1. Video en Señas LESCO a Pantalla Completa */}
        <View style={StyleSheet.absoluteFill}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
          {/* Gradientes superior e inferior para legibilidad */}
          <View style={welcomeStyles.topGradient} />
          <View style={welcomeStyles.bottomGradient} />
        </View>

        <SafeAreaView style={welcomeStyles.safeContent} edges={['top', 'bottom', 'left', 'right']}>
          {/* 2. Barra Superior con imagotipo oficial */}
          <View style={welcomeStyles.topBar}>
            <View style={welcomeStyles.brandPill}>
              <BrandLogo variant="hands" height={20} width={20} />
              <BrandLogo variant="wordmark" height={20} />
            </View>

            <View style={welcomeStyles.topActions}>
              <TouchableOpacity
                style={welcomeStyles.circleControlBtn}
                onPress={toggleSound}
                activeOpacity={0.7}
                accessibilityLabel={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                <Text style={welcomeStyles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={welcomeStyles.circleControlBtn}
                onPress={togglePlay}
                activeOpacity={0.7}
                accessibilityLabel={isPlaying ? 'Pausar video' : 'Reproducir'}
              >
                <Text style={welcomeStyles.controlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Área Central de Video 100% Despejada */}
          <View style={welcomeStyles.videoCenterArea} />

          {/* 4. Indicador de Swipe Up (Flecha + Texto animándose juntos) */}
          <View style={welcomeStyles.bottomSection}>
            <TouchableOpacity
              style={welcomeStyles.swipePrompt}
              onPress={triggerSwipeUpNavigation}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Desliza para comenzar"
            >
              <Animated.View
                style={[
                  welcomeStyles.swipeRow,
                  { transform: [{ translateY: bounceAnim }] },
                ]}
              >
                <Text style={welcomeStyles.swipeArrow}>▲</Text>
                <Text style={welcomeStyles.swipeText}>Desliza para comenzar</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  rootBackground: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1712',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(20, 15, 10, 0.35)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 115,
    backgroundColor: 'rgba(20, 15, 10, 0.45)',
  },
  safeContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 246, 238, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    ...Shadows.subtle,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 15, 10, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 14,
  },
  videoCenterArea: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 14 : 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipePrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  swipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  swipeArrow: {
    fontSize: 16,
    color: '#FBF6EE',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  swipeText: {
    fontSize: 14,
    color: '#FBF6EE',
    fontWeight: '800',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
