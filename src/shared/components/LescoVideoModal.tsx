import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { videoUrl } from '@/lib/supabase';
import { videoCacheService } from '@/shared/services/videoCacheService';
import { videoSubtitlesService } from '@/shared/services/videoSubtitlesService';

export interface LescoVideoInfo {
  title: string;
  category: string;
  glossText?: string;
  videoUri?: string;
  r2Key?: string;
}

export interface LescoVideoModalProps {
  visible: boolean;
  videoInfo?: LescoVideoInfo | null;
  videoTitle?: string;
  onClose: () => void;
}

const DEFAULT_MODAL_VIDEO_URI = videoUrl('lesco/v1/m2/2_1.mp4', 'vertical');

export function LescoVideoModal({
  visible,
  videoInfo,
  videoTitle,
  onClose,
}: LescoVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rate, setRate] = useState(1.0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [overrideDuration, setOverrideDuration] = useState<number | undefined>(undefined);
  const [resolvedR2Key, setResolvedR2Key] = useState<string>('lesco/v1/m2/2_1.mp4');
  const [resolvedUri, setResolvedUri] = useState<string>(DEFAULT_MODAL_VIDEO_URI);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [isOfflineCopy, setIsOfflineCopy] = useState<boolean>(false);

  const videoWebRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentPlayerUriRef = useRef<string>(DEFAULT_MODAL_VIDEO_URI);
  const rateRef = useRef<number>(1.0);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const effectiveInfo: LescoVideoInfo | null =
    videoInfo ||
    (videoTitle
      ? {
          title: videoTitle,
          category: 'Emergencias SOS',
        }
      : null);

  // Inicializar reproductor de expo-video una sola vez con fuente base estática
  // para evitar liberar el SharedObject nativo mientras el componente sigue montado
  const player = useVideoPlayer(DEFAULT_MODAL_VIDEO_URI, (p) => {
    try {
      p.loop = true;
      if (visible) {
        p.play();
      } else {
        p.pause();
      }
    } catch {}
  });

  // Resolver r2_key en el catálogo de 54 videos y reemplazar la fuente en el player de forma segura
  useEffect(() => {
    let active = true;
    if (!visible || !effectiveInfo) {
      return;
    }

    const applySourceToPlayer = async (targetUri: string, isLocal: boolean) => {
      if (!active || !isMountedRef.current) return;
      setResolvedUri(targetUri);
      setIsOfflineCopy(isLocal);

      if (Platform.OS !== 'web' && player && targetUri) {
        try {
          if (currentPlayerUriRef.current !== targetUri) {
            currentPlayerUriRef.current = targetUri;
            await player.replaceAsync(targetUri);
          }
          if (!active || !isMountedRef.current) return;
          if (visible) {
            player.loop = true;
            player.playbackRate = rateRef.current;
            player.play();
            setIsPlaying(true);
          }
        } catch {}
      }
    };

    if (effectiveInfo.videoUri) {
      applySourceToPlayer(effectiveInfo.videoUri, false);
      return;
    }

    const { r2Key, version } = videoCacheService.resolveR2Key({
      r2Key: effectiveInfo.r2Key,
      title: effectiveInfo.title,
      category: effectiveInfo.category,
    });

    setResolvedR2Key(r2Key);
    setCurrentTime(0);
    setOverrideDuration(undefined);

    const initialRemote = videoUrl(r2Key, 'vertical');
    setResolvedUri(initialRemote);
    setIsLoadingVideo(true);

    videoCacheService
      .getPlayableUri(r2Key, version, 'vertical')
      .then(async (res) => {
        if (!active || !isMountedRef.current) return;
        setIsLoadingVideo(false);
        await applySourceToPlayer(res.uri, res.isLocal);
      })
      .catch(async () => {
        if (!active || !isMountedRef.current) return;
        setIsLoadingVideo(false);
        await applySourceToPlayer(initialRemote, false);
      });

    return () => {
      active = false;
    };
  }, [
    visible,
    effectiveInfo?.r2Key,
    effectiveInfo?.title,
    effectiveInfo?.category,
    effectiveInfo?.videoUri,
    player,
  ]);

  // Pausar o reproducir cuando cambia la visibilidad del modal
  useEffect(() => {
    if (!visible) {
      if (Platform.OS === 'web' && videoWebRef.current) {
        try {
          videoWebRef.current.pause();
          videoWebRef.current.currentTime = 0;
        } catch {}
      } else if (player) {
        try {
          player.pause();
        } catch {}
      }
      setIsPlaying(false);
      setCurrentTime(0);
    } else {
      if (Platform.OS === 'web' && videoWebRef.current) {
        videoWebRef.current.play().catch(() => {});
      } else if (player) {
        try {
          player.play();
        } catch {}
      }
      setIsPlaying(true);
    }
  }, [visible, player]);

  // Sincronización en tiempo real en Nativo (expo-video) cada 200ms (respeta automáticamente playbackRate)
  useEffect(() => {
    if (Platform.OS === 'web' || !visible || !isPlaying || !player) {
      return;
    }

    const timer = setInterval(() => {
      if (!isMountedRef.current) return;
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
  }, [visible, isPlaying, player]);

  const handleClose = () => {
    if (Platform.OS === 'web' && videoWebRef.current) {
      try {
        videoWebRef.current.pause();
      } catch {}
    } else if (player) {
      try {
        player.pause();
      } catch {}
    }
    setIsPlaying(false);
    onClose();
  };

  if (!effectiveInfo) return null;

  const cues = videoSubtitlesService.getCuesForVideo(resolvedR2Key, overrideDuration);
  const activeCue = videoSubtitlesService.getActiveCue(cues, currentTime);
  const totalDuration = videoSubtitlesService.getVideoDuration(resolvedR2Key, overrideDuration);
  const safeProgressTime =
    totalDuration > 0
      ? currentTime > totalDuration + 0.25
        ? currentTime % totalDuration
        : Math.min(totalDuration, Math.max(0, currentTime))
      : 0;
  const progressPercent =
    totalDuration > 0 ? Math.min(100, Math.max(0, (safeProgressTime / totalDuration) * 100)) : 0;

  const handlePlayPause = () => {
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        if (isPlaying) {
          videoWebRef.current.pause();
          setIsPlaying(false);
        } else {
          videoWebRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    } else if (player) {
      try {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
        } else {
          player.play();
          setIsPlaying(true);
        }
      } catch {}
    }
  };

  const handleReplay = () => {
    setCurrentTime(0);
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        videoWebRef.current.currentTime = 0;
        videoWebRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else if (player) {
      try {
        player.replay();
        setIsPlaying(true);
      } catch {}
    }
  };

  const handleToggleRate = () => {
    const newRate = rate === 1.0 ? 0.75 : rate === 0.75 ? 0.5 : 1.0;
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        videoWebRef.current.playbackRate = newRate;
      }
    } else if (player) {
      try {
        player.playbackRate = newRate;
      } catch {}
    }
    setRate(newRate);
  };

  const handleToggleCaptions = () => {
    setShowCaptions((prev) => !prev);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={modalStyles.scrollContent}
          >
            {/* Header del Modal */}
            <View style={modalStyles.headerRow}>
              <View style={modalStyles.badge}>
                <Text style={modalStyles.badgeText}>
                  🤟 Video en LESCO {isOfflineCopy ? '• Offline' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityLabel="Cerrar video de señas"
              >
                <Text style={modalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Título de la Función */}
            <Text style={modalStyles.titleText}>{effectiveInfo.title}</Text>
            <Text style={modalStyles.subtitleText}>{effectiveInfo.category}</Text>

            {/* Contenedor del Reproductor Vertical Centrado (9:16 exacto) */}
            <View style={modalStyles.videoCenterContainer}>
              <View style={modalStyles.videoPlayerBox}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore - Soporte Web nativo
                  <video
                    ref={videoWebRef}
                    src={resolvedUri}
                    autoPlay
                    loop
                    playsInline
                    controls={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000000',
                    }}
                    onLoadedMetadata={(e: any) => {
                      if (e?.currentTarget) {
                        e.currentTarget.playbackRate = rate;
                        const dur = e.currentTarget.duration;
                        if (typeof dur === 'number' && Number.isFinite(dur) && dur > 1) {
                          setOverrideDuration(dur);
                        }
                      }
                    }}
                    onTimeUpdate={(e: any) => {
                      const t = e?.currentTarget?.currentTime;
                      if (typeof t === 'number' && Number.isFinite(t)) {
                        setCurrentTime(t);
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <VideoView
                    style={modalStyles.nativeVideo}
                    player={player}
                    nativeControls={false}
                    contentFit="cover"
                  />
                )}
                {isLoadingVideo && Platform.OS !== 'web' ? (
                  <View style={modalStyles.loadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
            </View>

            {/* Tarjeta de Subtítulo Sincronizado en Vivo (Deaf-First High Contrast) */}
            {showCaptions && activeCue ? (
              <View style={modalStyles.timedCaptionCard}>
                <View style={modalStyles.timedCaptionHeader}>
                  <View style={modalStyles.timedCaptionBadgeRow}>
                    <View style={modalStyles.timedLiveDot} />
                    <Text style={modalStyles.timedCaptionBadgeText}>
                      CC EN VIVO • {activeCue.index}/{activeCue.total}
                    </Text>
                  </View>
                  <Text style={modalStyles.timedClockText}>
                    {videoSubtitlesService.formatTime(safeProgressTime)} /{' '}
                    {videoSubtitlesService.formatTime(totalDuration)}
                  </Text>
                </View>

                <Text style={modalStyles.timedCaptionBody}>“{activeCue.text}”</Text>

                {/* Barra de progreso temporal sincronizada con el intérprete */}
                <View style={modalStyles.timedProgressTrack}>
                  <View
                    style={[
                      modalStyles.timedProgressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {/* Barra de Controles Táctiles Debajo del Video */}
            <View style={modalStyles.controlsBar}>
              <TouchableOpacity
                style={modalStyles.controlBtn}
                onPress={handleReplay}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.controlEmoji}>🔄</Text>
                <Text style={modalStyles.controlLabel}>Repetir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.controlBtn, modalStyles.controlBtnPrimary]}
                onPress={handlePlayPause}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.controlEmoji}>{isPlaying ? '⏸️' : '▶️'}</Text>
                <Text style={[modalStyles.controlLabel, { color: '#FFFFFF' }]}>
                  {isPlaying ? 'Pausar' : 'Reproducir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.controlBtn,
                  rate !== 1.0 && { backgroundColor: Colors.secondary.main },
                ]}
                onPress={handleToggleRate}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.controlEmoji}>🐢</Text>
                <Text style={[modalStyles.controlLabel, rate !== 1.0 && { color: '#FFFFFF' }]}>
                  {rate === 1.0 ? '1.0x' : `${rate}x`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.controlBtn,
                  showCaptions && modalStyles.controlBtnCcActive,
                ]}
                onPress={handleToggleCaptions}
                activeOpacity={0.8}
                accessibilityLabel={showCaptions ? 'Ocultar subtítulos sincronizados' : 'Mostrar subtítulos sincronizados'}
              >
                <Text
                  style={[
                    modalStyles.controlLabel,
                    showCaptions && { color: '#18130E' },
                  ]}
                >
                  CC
                </Text>
              </TouchableOpacity>
            </View>

            {/* Glosa / Palabras Clave */}
            {effectiveInfo.glossText ? (
              <View style={modalStyles.glossBox}>
                <Text style={modalStyles.glossTitle}>SEÑAS EN ESTE VIDEO:</Text>
                <Text style={modalStyles.glossContent}>{effectiveInfo.glossText}</Text>
              </View>
            ) : null}

            {/* Botón Entendido / Cerrar */}
            <TouchableOpacity
              style={modalStyles.confirmButton}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.confirmButtonText}>✓ Entendido / Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 36, 28, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.background.main,
    borderTopLeftRadius: Radius.xl * 1.2,
    borderTopRightRadius: Radius.xl * 1.2,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    maxHeight: '88%',
    ...Shadows.card,
  },
  scrollContent: {
    paddingBottom: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.secondary.surface,
    borderColor: Colors.secondary.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  titleText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.black,
    color: Colors.text.primary,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  videoCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  videoPlayerBox: {
    width: 176,
    height: 312, // 9:16 vertical nativo exacto
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    ...Shadows.card,
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 12,
    padding: 4,
  },
  timedCaptionCard: {
    backgroundColor: 'rgba(24, 19, 14, 0.88)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    marginTop: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 176, 65, 0.36)',
  },
  timedCaptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timedCaptionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timedLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5B041',
  },
  timedCaptionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F5B041',
    letterSpacing: 0.5,
  },
  timedClockText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(251, 246, 238, 0.72)',
  },
  timedCaptionBody: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#FBF6EE',
    fontWeight: '600',
    marginBottom: 7,
  },
  timedProgressTrack: {
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(251, 246, 238, 0.18)',
    overflow: 'hidden',
  },
  timedProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F5B041',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  controlBtnPrimary: {
    backgroundColor: Colors.primary.main,
  },
  controlBtnCcActive: {
    backgroundColor: '#F5B041',
  },
  controlEmoji: {
    fontSize: 13,
  },
  controlLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#F8FAFC',
  },
  glossBox: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  glossTitle: {
    fontSize: 10,
    fontWeight: Typography.weights.black,
    color: Colors.primary.main,
    letterSpacing: 0.5,
  },
  glossContent: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primaryGlow,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
