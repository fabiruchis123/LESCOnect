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
import { BrandLogo } from '@/shared/components/BrandLogo';
import { haptics } from '@/shared/utils/haptics';
import { videoUrl } from '@/lib/supabase';
import { videoCacheService } from '@/shared/services/videoCacheService';
import { videoSubtitlesService } from '@/shared/services/videoSubtitlesService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const WELCOME_R2_KEY = 'lesco/v1/m1/1_1.mp4';
const INITIAL_WELCOME_URI = videoUrl(WELCOME_R2_KEY, 'vertical');

export function WelcomeScreen() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [overrideDuration, setOverrideDuration] = useState<number | undefined>(undefined);

  const isNavigating = useRef(false);
  const isMounted = useRef(true);
  const currentUriRef = useRef<string>(INITIAL_WELCOME_URI);
  const isMutedRef = useRef(true);
  const isPlayingRef = useRef(true);

  // Animación física de salida / arrastre interactivo hacia arriba (Swipe Up)
  const slideY = useRef(new Animated.Value(0)).current;
  const dragProgress = slideY.interpolate({
    inputRange: [-180, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animaciones escalonadas de onda para los chevrons de Swipe Up y pulso del botón
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;

    const createWave = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

    const w1 = createWave(waveAnim1, 0);
    const w2 = createWave(waveAnim2, 180);
    const w3 = createWave(waveAnim3, 360);

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    w1.start();
    w2.start();
    w3.start();
    glowLoop.start();

    return () => {
      isMounted.current = false;
      w1.stop();
      w2.stop();
      w3.stop();
      glowLoop.stop();
    };
  }, [waveAnim1, waveAnim2, waveAnim3, glowAnim]);

  // Inicializar VideoPlayer con fuente estática para no liberar ni recrear el SharedObject nativo
  const player = useVideoPlayer(INITIAL_WELCOME_URI, (p) => {
    try {
      p.loop = true;
      p.muted = true;
      p.play();
    } catch {}
  });

  // Si existe o se descarga copia local offline, reemplazar fuente de forma segura sin destruir el player
  useEffect(() => {
    let active = true;
    videoCacheService
      .getPlayableUri(WELCOME_R2_KEY, 1, 'vertical')
      .then(async (res) => {
        if (!active || !isMounted.current || isNavigating.current) return;
        setIsOfflineReady(res.isLocal);
        if (res.isLocal && res.uri && res.uri !== currentUriRef.current && player) {
          currentUriRef.current = res.uri;
          try {
            await player.replaceAsync(res.uri);
            if (active && isMounted.current && !isNavigating.current) {
              player.loop = true;
              player.muted = isMutedRef.current;
              if (isPlayingRef.current) {
                player.play();
              } else {
                player.pause();
              }
            }
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [player]);

  // Sincronización en tiempo real de subtítulos con el reloj del video (cada 200ms)
  useEffect(() => {
    if (!isPlaying || !player) return;

    const timer = setInterval(() => {
      if (!isMounted.current || isNavigating.current) return;
      try {
        const t = player.currentTime;
        if (typeof t === 'number' && Number.isFinite(t)) {
          setCurrentTime(t);
        }
        const d = player.duration;
        if (typeof d === 'number' && Number.isFinite(d) && d > 1) {
          setOverrideDuration(d);
        }
      } catch {}
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, [isPlaying, player]);

  const welcomeCues = videoSubtitlesService.getCuesForVideo(WELCOME_R2_KEY, overrideDuration);
  const activeWelcomeCue = videoSubtitlesService.getActiveCue(welcomeCues, currentTime);
  const totalWelcomeDuration = videoSubtitlesService.getVideoDuration(
    WELCOME_R2_KEY,
    overrideDuration
  );
  const safeWelcomeTime =
    totalWelcomeDuration > 0
      ? currentTime > totalWelcomeDuration + 0.25
        ? currentTime % totalWelcomeDuration
        : Math.min(totalWelcomeDuration, Math.max(0, currentTime))
      : 0;
  const welcomeProgressPercent =
    totalWelcomeDuration > 0
      ? Math.min(100, Math.max(0, (safeWelcomeTime / totalWelcomeDuration) * 100))
      : 0;

  const safePausePlayer = () => {
    if (!player) return;
    try {
      player.pause();
    } catch {
      // Ignorar si el SharedObject nativo ya fue liberado al desmontar
    }
  };

  const toggleSound = () => {
    haptics.light();
    if (!player || isNavigating.current) return;
    const nextMuted = !isMuted;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    try {
      player.muted = nextMuted;
    } catch {}
  };

  const togglePlay = () => {
    haptics.light();
    if (!player || isNavigating.current) return;
    try {
      if (isPlaying) {
        player.pause();
        isPlayingRef.current = false;
        setIsPlaying(false);
      } else {
        player.play();
        isPlayingRef.current = true;
        setIsPlaying(true);
      }
    } catch {}
  };

  const toggleCaptions = () => {
    haptics.light();
    setShowCaptions((prev) => !prev);
  };

  // Navegar al registro haciendo que el video suba físicamente y se reemplace la pantalla
  const triggerSwipeUpNavigation = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    haptics.success();

    // Pausar sincrónicamente mientras el componente sigue montado (evita error de SharedObject liberado)
    safePausePlayer();

    Animated.timing(slideY, {
      toValue: -SCREEN_HEIGHT,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isMounted.current) {
        router.replace('/(auth)/signup');
      }
    });
  };

  // Gesto táctil interactivo PanResponder en toda la pantalla con arrastre en vivo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isNavigating.current &&
          gestureState.dy < -8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (isNavigating.current) return;
        if (gestureState.dy < 0) {
          slideY.setValue(Math.max(gestureState.dy, -SCREEN_HEIGHT * 0.65));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isNavigating.current) return;
        if (gestureState.dy < -55 || gestureState.vy < -0.35) {
          triggerSwipeUpNavigation();
        } else {
          Animated.spring(slideY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (isNavigating.current) return;
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
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

        {/* 1. Video en Señas LESCO a Pantalla Completa (100% nítido sin sombras superpuestas) */}
        <View style={StyleSheet.absoluteFill}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        </View>

        <SafeAreaView style={welcomeStyles.safeContent} edges={['top', 'bottom', 'left', 'right']}>
          {/* Área Central Despejada para las señas del intérprete */}
          <View style={welcomeStyles.videoCenterArea} />

          {/* Subtítulos LESCO Limpios al Fondo de la Pantalla (Sin recuadros ni dock inferior) */}
          <View style={welcomeStyles.bottomSection}>
            {showCaptions && activeWelcomeCue ? (
              <View style={welcomeStyles.captionCard}>
                <Text style={welcomeStyles.captionText}>“{activeWelcomeCue.text}”</Text>
                <View style={welcomeStyles.captionProgressTrack}>
                  <View
                    style={[
                      welcomeStyles.captionProgressFill,
                      { width: `${welcomeProgressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Indicador táctil y de arrastre minimalista sin recuadro ni dock */}
            <TouchableOpacity
              style={welcomeStyles.subtleSwipeHint}
              onPress={triggerSwipeUpNavigation}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Desliza hacia arriba para comenzar"
            >
              <Text style={welcomeStyles.subtleSwipeText}>▲ Desliza hacia arriba para comenzar ▲</Text>
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
  safeContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 246, 238, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    ...Shadows.subtle,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 15, 10, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBF6EE',
    letterSpacing: 0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  circleControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 15, 10, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleControlBtnActive: {
    backgroundColor: Colors.primary.main,
    borderColor: '#FBF6EE',
  },
  ccText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  controlIcon: {
    fontSize: 14,
  },
  videoCenterArea: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 10 : 14,
    gap: 10,
  },
  captionCard: {
    backgroundColor: 'rgba(24, 19, 14, 0.86)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 176, 65, 0.34)',
  },
  captionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  captionGlossBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F5B041',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  captionCueCounter: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(251, 246, 238, 0.78)',
  },
  captionText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#FBF6EE',
    fontWeight: '600',
    marginBottom: 7,
  },
  captionProgressTrack: {
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(251, 246, 238, 0.18)',
    overflow: 'hidden',
  },
  captionProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F5B041',
  },
  subtleSwipeHint: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  subtleSwipeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBF6EE',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  swipeDockCard: {
    backgroundColor: 'rgba(251, 246, 238, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    ...Shadows.card,
  },
  dragHandlePill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5C7B2',
    alignSelf: 'center',
    marginBottom: 8,
  },
  swipeInteractiveArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#EFE6D5',
    gap: 12,
  },
  chevronOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  chevronStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    fontSize: 9,
    lineHeight: 9,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  swipeTextColumn: {
    flex: 1,
  },
  swipeTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: Colors.text.primary,
  },
  swipeSubtitle: {
    fontSize: 11.5,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  goArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBF3E8',
    borderWidth: 1,
    borderColor: '#F0D9C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goArrowText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary.main,
  },
  featurePillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
  },
  featureChip: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E5D8C1',
  },
  featureChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5C4F3D',
  },
});
