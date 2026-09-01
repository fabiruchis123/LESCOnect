import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';

export interface LescoVideoInfo {
  title: string;
  category: string;
  glossText?: string;
  videoUri?: string;
}

interface LescoVideoModalProps {
  visible: boolean;
  videoInfo: LescoVideoInfo | null;
  onClose: () => void;
}

export function LescoVideoModal({ visible, videoInfo, onClose }: LescoVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rate, setRate] = useState(1.0);
  const videoWebRef = useRef<HTMLVideoElement | null>(null);

  // Video local demo_lesco.mp4
  const localVideoAsset = require('../../../../assets/videos/demo_lesco.mp4');

  // Inicializar reproductor de expo-video para Android y iOS
  const player = useVideoPlayer(localVideoAsset, (p) => {
    p.loop = true;
    if (visible) {
      p.play();
    } else {
      p.pause();
    }
  });

  // Pausar y silenciar el video inmediatamente al cerrar o desmontar el modal
  useEffect(() => {
    if (!visible) {
      if (Platform.OS === 'web' && videoWebRef.current) {
        videoWebRef.current.pause();
        videoWebRef.current.currentTime = 0;
      } else if (player) {
        try {
          player.pause();
        } catch {}
      }
      setIsPlaying(false);
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

  const handleClose = () => {
    if (Platform.OS === 'web' && videoWebRef.current) {
      videoWebRef.current.pause();
    } else if (player) {
      try {
        player.pause();
      } catch {}
    }
    setIsPlaying(false);
    onClose();
  };

  if (!videoInfo) return null;

  let videoSourceUri = '';
  try {
    videoSourceUri = typeof localVideoAsset === 'string' ? localVideoAsset : localVideoAsset?.uri || '';
  } catch {
    videoSourceUri = '';
  }

  const handlePlayPause = () => {
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        if (isPlaying) {
          videoWebRef.current.pause();
          setIsPlaying(false);
        } else {
          videoWebRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      if (player) {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
        } else {
          player.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const handleReplay = () => {
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        videoWebRef.current.currentTime = 0;
        videoWebRef.current.play();
        setIsPlaying(true);
      }
    } else {
      if (player) {
        player.replay();
        setIsPlaying(true);
      }
    }
  };

  const handleToggleRate = () => {
    const newRate = rate === 1.0 ? 0.75 : 1.0;
    if (Platform.OS === 'web') {
      if (videoWebRef.current) {
        videoWebRef.current.playbackRate = newRate;
      }
    } else {
      if (player) {
        player.playbackRate = newRate;
      }
    }
    setRate(newRate);
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
          {/* Header del Modal */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.badge}>
              <Text style={modalStyles.badgeText}>🤟 Video en LESCO</Text>
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
          <Text style={modalStyles.titleText}>{videoInfo.title}</Text>
          <Text style={modalStyles.subtitleText}>{videoInfo.category}</Text>

          {/* Contenedor del Reproductor Vertical (9:16 / 4:5) */}
          <View style={modalStyles.videoPlayerBox}>
            <View style={modalStyles.videoWrapper}>
              {Platform.OS === 'web' ? (
                // @ts-ignore - Soporte Web nativo
                <video
                  ref={videoWebRef}
                  src={videoSourceUri}
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000000',
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                // Reproductor Moderno expo-video para Expo Go
                <VideoView
                  style={modalStyles.nativeVideo}
                  player={player}
                  nativeControls={false}
                  contentFit="contain"
                />
              )}
            </View>

            {/* Barra de Controles Táctiles Accesibles */}
            <View style={modalStyles.controlsBar}>
              <TouchableOpacity
                style={modalStyles.controlBtn}
                onPress={handleReplay}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.controlEmoji}>🔁</Text>
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
                  rate === 0.75 && { backgroundColor: Colors.secondary.main },
                ]}
                onPress={handleToggleRate}
                activeOpacity={0.8}
              >
                <Text style={modalStyles.controlEmoji}>🐢</Text>
                <Text style={[modalStyles.controlLabel, rate === 0.75 && { color: '#FFFFFF' }]}>
                  {rate === 1.0 ? '1.0x' : '0.75x'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Glosa / Palabras Clave */}
          {videoInfo.glossText ? (
            <View style={modalStyles.glossBox}>
              <Text style={modalStyles.glossTitle}>SEÑAS EN ESTE VIDEO:</Text>
              <Text style={modalStyles.glossContent}>{videoInfo.glossText}</Text>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    maxHeight: '92%',
    ...Shadows.card,
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
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.black,
    color: Colors.text.primary,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  videoPlayerBox: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  videoWrapper: {
    height: 300,
    width: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0B1120',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
  },
  controlBtnPrimary: {
    backgroundColor: Colors.primary.main,
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
