import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/shared/components';
import { videoUrl } from '@/lib/supabase';
import { videoCacheService } from '@/shared/services/videoCacheService';
import { videoSubtitlesService } from '@/shared/services/videoSubtitlesService';
import {
  LescoAvatar3DInterpreter,
  type AvatarGender,
} from '../components/LescoAvatar3DInterpreter';
import { translateTextToLescoGloss } from '../services/translatorService';

interface TextToSignsScreenProps {
  onBackPress?: () => void;
}

type OutputVisualMode = 'avatar_3d' | 'real_video';

const QUICK_CHIPS = [
  'Hola, buenos días',
  'Muchas gracias por su ayuda',
  '¿Podría escribir las indicaciones por favor?',
  '¿Dónde queda la parada de buses?',
  'Necesito ayuda urgente, no puedo escuchar',
  'Aquí está mi cédula de identidad',
  'Tengo dolor fuerte en esta parte del cuerpo',
];

const DEFAULT_R2_KEY = 'lesco/v1/m5/mensajes/1_1.mp4';
const DEFAULT_VIDEO_URI = videoUrl(DEFAULT_R2_KEY, 'vertical');

export function TextToSignsScreen({ onBackPress }: TextToSignsScreenProps) {
  const router = useRouter();
  const [inputText, setInputText] = useState('Hola, soy una persona sorda y necesito hacer una consulta.');
  const [translatedText, setTranslatedText] = useState(
    'Hola, soy una persona sorda y necesito hacer una consulta.'
  );
  const [visualMode, setVisualMode] = useState<OutputVisualMode>('avatar_3d');
  const [avatarGender, setAvatarGender] = useState<AvatarGender>('senorita');
  const [speed, setSpeed] = useState<'0.5x' | '0.75x' | '1x'>('1x');
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  // Estado del reproductor en línea para el modo "🎬 Video Real LESCO" (Cloudflare R2 / Caché Offline)
  const [resolvedR2Key, setResolvedR2Key] = useState<string>('lesco/v1/m5/mensajes/0.mp4');
  const [resolvedVideoUri, setResolvedVideoUri] = useState<string>(
    videoUrl('lesco/v1/m5/mensajes/0.mp4', 'vertical')
  );
  const [isOfflineCopy, setIsOfflineCopy] = useState<boolean>(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [overrideDuration, setOverrideDuration] = useState<number | undefined>(undefined);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  const videoWebRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentPlayerUriRef = useRef<string>(DEFAULT_VIDEO_URI);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const numericRate: 0.5 | 0.75 | 1.0 =
    speed === '0.5x' ? 0.5 : speed === '0.75x' ? 0.75 : 1.0;

  // Traducción morfosintáctica en vivo a Glosa LESCO + vínculo con los 54 videos oficiales
  const translationResult = useMemo(() => {
    const target = (translatedText || inputText || 'Hola').trim();
    return translateTextToLescoGloss(target);
  }, [translatedText, inputText]);

  // Resolver r2Key real desde videoCacheService.resolveR2Key y Cloudflare R2 videoUrl
  const r2Resolution = useMemo(() => {
    const target = (translatedText || inputText || 'Hola').trim();
    return videoCacheService.resolveR2Key({
      r2Key: translationResult.matchedVideo?.r2Key,
      title: target,
      category: translationResult.matchedVideo?.categoryLabel || 'Traducción a Señas',
    });
  }, [translatedText, inputText, translationResult]);

  const player = useVideoPlayer(DEFAULT_VIDEO_URI, (p) => {
    try {
      p.loop = true;
      p.playbackRate = numericRate;
      if (visualMode === 'real_video') {
        p.play();
      } else {
        p.pause();
      }
    } catch {}
  });

  // Cargar URI desde caché local o Cloudflare R2 cuando cambia el r2Key o el modo visual
  useEffect(() => {
    let active = true;
    const targetKey = r2Resolution.r2Key || DEFAULT_R2_KEY;
    const remoteUri = videoUrl(targetKey, 'vertical');

    setResolvedR2Key(targetKey);
    setResolvedVideoUri(remoteUri);
    setCurrentTime(0);
    setOverrideDuration(undefined);

    if (visualMode !== 'real_video') {
      if (Platform.OS === 'web' && videoWebRef.current) {
        try {
          videoWebRef.current.pause();
        } catch {}
      } else if (player) {
        try {
          player.pause();
        } catch {}
      }
      return;
    }

    setIsLoadingVideo(true);
    videoCacheService
      .getPlayableUri(targetKey, r2Resolution.version, 'vertical')
      .then(async (res) => {
        if (!active || !isMountedRef.current) return;
        setIsLoadingVideo(false);
        setResolvedVideoUri(res.uri);
        setIsOfflineCopy(res.isLocal);

        if (Platform.OS !== 'web' && player && res.uri) {
          try {
            if (currentPlayerUriRef.current !== res.uri) {
              currentPlayerUriRef.current = res.uri;
              await player.replaceAsync(res.uri);
            }
            if (!active || !isMountedRef.current) return;
            player.loop = true;
            player.playbackRate = numericRate;
            player.play();
            setIsVideoPlaying(true);
          } catch {}
        }
      })
      .catch(async () => {
        if (!active || !isMountedRef.current) return;
        setIsLoadingVideo(false);
        setResolvedVideoUri(remoteUri);
        setIsOfflineCopy(false);
        if (Platform.OS !== 'web' && player) {
          try {
            if (currentPlayerUriRef.current !== remoteUri) {
              currentPlayerUriRef.current = remoteUri;
              await player.replaceAsync(remoteUri);
            }
            player.loop = true;
            player.playbackRate = numericRate;
            player.play();
            setIsVideoPlaying(true);
          } catch {}
        }
      });

    return () => {
      active = false;
    };
  }, [r2Resolution.r2Key, r2Resolution.version, visualMode, player]);

  // Sincronizar velocidad de reproducción (0.5x, 0.75x, 1x) con el reproductor de video
  useEffect(() => {
    if (Platform.OS === 'web' && videoWebRef.current) {
      try {
        videoWebRef.current.playbackRate = numericRate;
      } catch {}
    } else if (player) {
      try {
        player.playbackRate = numericRate;
      } catch {}
    }
  }, [numericRate, player]);

  // Sincronizar subtítulos temporizados en nativo cada 200ms cuando está en modo Video Real
  useEffect(() => {
    if (Platform.OS === 'web' || visualMode !== 'real_video' || !isVideoPlaying || !player) {
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

    return () => clearInterval(timer);
  }, [visualMode, isVideoPlaying, player]);

  const cues = useMemo(
    () =>
      videoSubtitlesService.getCuesForVideo(
        resolvedR2Key,
        overrideDuration,
        r2Resolution.phraseEs || translationResult.matchedVideo?.phraseEs
      ),
    [resolvedR2Key, overrideDuration, r2Resolution.phraseEs, translationResult.matchedVideo?.phraseEs]
  );
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

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleTranslate = () => {
    const clean = inputText.trim();
    if (!clean) {
      Alert.alert(
        'Escribe una frase',
        'Por favor ingresa cualquier palabra o frase en español para traducirla a señas LESCO.'
      );
      return;
    }
    haptics.success();
    setTranslatedText(clean);
  };

  const handleOpenFullscreenModal = () => {
    const clean = (translatedText || inputText || 'Hola').trim();
    haptics.medium();
    setActiveVideo({
      title: r2Resolution.phraseEs || clean,
      category: translationResult.matchedVideo?.categoryLabel || 'Traducción a Señas LESCO',
      glossText: translationResult.lescoGloss,
      r2Key: r2Resolution.r2Key,
      videoUri: videoUrl(r2Resolution.r2Key, 'vertical'),
    });
  };

  const handleVoiceDictation = () => {
    haptics.medium();
    Alert.alert(
      '🎙️ Dictado por Voz en Español',
      'Selecciona una frase capturada por micrófono para traducirla en tiempo real con el Intérprete 3D o Video Oficial:',
      [
        {
          text: '“Hola, soy una persona sorda y vengo a realizar un trámite”',
          onPress: () => {
            const phrase = 'Hola, soy una persona sorda y vengo a realizar un trámite.';
            setInputText(phrase);
            setTranslatedText(phrase);
          },
        },
        {
          text: '“Soy sordo/a, necesito un intérprete de LESCO si es posible”',
          onPress: () => {
            const phrase = 'Soy sordo/a, necesito un intérprete de LESCO si es posible.';
            setInputText(phrase);
            setTranslatedText(phrase);
          },
        },
        {
          text: '“¡Atención! Soy una persona sorda y necesito auxilio urgente”',
          onPress: () => {
            const phrase = '¡Atención! Soy una persona sorda y necesito auxilio urgente.';
            setInputText(phrase);
            setTranslatedText(phrase);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleToggleRealVideoPlay = () => {
    haptics.light();
    if (Platform.OS === 'web' && videoWebRef.current) {
      if (isVideoPlaying) {
        videoWebRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoWebRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      }
    } else if (player) {
      try {
        if (isVideoPlaying) {
          player.pause();
          setIsVideoPlaying(false);
        } else {
          player.play();
          setIsVideoPlaying(true);
        }
      } catch {}
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación Superior */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver al Traductor</Text>
        </View>

        <Text style={styles.title}>Texto / Voz → Señas LESCO</Text>
        <Text style={styles.subtitle}>
          Intérprete Avatar 3D en tiempo real (Señor y Señorita) + Catálogo de 54 Videos Oficiales
        </Text>

        {/* Selector de Modo Visual: 🧊 Intérprete 3D (Señor / Señorita) vs 🎬 Video Real LESCO */}
        <View style={styles.modeSelectorCard}>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                visualMode === 'avatar_3d' && styles.modeBtnActiveTerracotta,
              ]}
              onPress={() => {
                haptics.light();
                setVisualMode('avatar_3d');
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  visualMode === 'avatar_3d' && styles.modeBtnTextActive,
                ]}
              >
                🧊 Intérprete 3D (Señor / Señorita)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                visualMode === 'real_video' && styles.modeBtnActiveSage,
              ]}
              onPress={() => {
                haptics.light();
                setVisualMode('real_video');
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  visualMode === 'real_video' && styles.modeBtnTextActive,
                ]}
              >
                🎬 Video Real LESCO
              </Text>
            </TouchableOpacity>
          </View>

          {/* Barra de Velocidad + Glosa Activa */}
          <View style={styles.speedAndGlossBar}>
            <View style={styles.glossBadgeBox}>
              <Text style={styles.glossBadgeLabel}>GLOSA LESCO:</Text>
              <Text style={styles.glossBadgeValue} numberOfLines={1}>
                {translationResult.lescoGloss}
              </Text>
            </View>

            <View style={styles.speedRow}>
              {(['0.5x', '0.75x', '1x'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedChip, speed === s && styles.speedChipActive]}
                  onPress={() => {
                    haptics.light();
                    setSpeed(s);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.speedChipText,
                      speed === s && styles.speedChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* SALIDA HÍBRIDA: AVATAR 3D INTERACTIVO O VIDEO REAL DE CLOUDFLARE R2 */}
        {visualMode === 'avatar_3d' ? (
          <View style={styles.avatarContainer}>
            <LescoAvatar3DInterpreter
              avatarGender={avatarGender}
              onChangeGender={setAvatarGender}
              inputText={translatedText || inputText}
              glossText={translationResult.lescoGloss}
              playbackRate={numericRate}
              isPlaying={true}
              onSwitchToRealVideo={() => setVisualMode('real_video')}
              matchedVideoTitle={r2Resolution.phraseEs}
            />
          </View>
        ) : (
          <View style={styles.realVideoCard}>
            <View style={styles.realVideoHeaderRow}>
              <View style={styles.r2StatusBadge}>
                <View style={styles.r2LiveDot} />
                <Text style={styles.r2StatusText}>
                  🎬 Video Oficial LESCO ({r2Resolution.r2Key.replace('lesco/v1/', '')}){' '}
                  {isOfflineCopy ? '• Offline' : '• Cloudflare R2'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.fullscreenPill}
                onPress={handleOpenFullscreenModal}
                activeOpacity={0.8}
              >
                <Text style={styles.fullscreenPillText}>⛶ Ampliar</Text>
              </TouchableOpacity>
            </View>

            {/* Contenedor 9:16 del Video Oficial de Cloudflare R2 */}
            <View style={styles.videoViewportCenter}>
              <View style={styles.videoFrame9x16}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore - Etiqueta de video nativa en Web conectada a Cloudflare R2
                  <video
                    ref={videoWebRef}
                    src={resolvedVideoUri}
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
                        e.currentTarget.playbackRate = numericRate;
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
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                ) : (
                  <VideoView
                    style={styles.nativeVideoView}
                    player={player}
                    nativeControls={false}
                    contentFit="cover"
                  />
                )}

                {isLoadingVideo && (
                  <View style={styles.videoLoadingBadge} pointerEvents="none">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>

            {/* Subtítulos Sincronizados (Timed Captions Deaf-First) */}
            {showCaptions && activeCue && (
              <View style={styles.timedCaptionBox}>
                <View style={styles.timedCaptionTopRow}>
                  <Text style={styles.timedCaptionBadge}>
                    CC SINCRONIZADO • {activeCue.index}/{activeCue.total}
                  </Text>
                  <Text style={styles.timedCaptionClock}>
                    {videoSubtitlesService.formatTime(safeProgressTime)} /{' '}
                    {videoSubtitlesService.formatTime(totalDuration)}
                  </Text>
                </View>
                <Text style={styles.timedCaptionText}>“{activeCue.text}”</Text>
                <View style={styles.timedProgressTrack}>
                  <View
                    style={[
                      styles.timedProgressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Controles Rápidos del Reproductor Oficial */}
            <View style={styles.realVideoControlsRow}>
              <TouchableOpacity
                style={styles.videoCtrlBtn}
                onPress={handleToggleRealVideoPlay}
                activeOpacity={0.8}
              >
                <Text style={styles.videoCtrlBtnText}>
                  {isVideoPlaying ? '⏸ Pausar' : '▶ Reproducir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.videoCtrlBtn,
                  showCaptions && styles.videoCtrlBtnActiveCc,
                ]}
                onPress={() => {
                  haptics.light();
                  setShowCaptions((prev) => !prev);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.videoCtrlBtnText,
                    showCaptions && { color: '#18130E' },
                  ]}
                >
                  CC Subtítulos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.videoCtrlBtn, styles.videoCtrlBtnAvatarSwitch]}
                onPress={() => {
                  haptics.light();
                  setVisualMode('avatar_3d');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.videoCtrlBtnText}>🧊 Ver en Avatar 3D</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chips de Frases Rápidas del Catálogo Oficial */}
        <Text style={styles.sectionLabel}>FRASES FRECUENTES EN LESCO (1 TOQUE):</Text>
        <View style={styles.quickChipsRow}>
          {QUICK_CHIPS.map((chip) => {
            const isSelected = inputText.trim().toLowerCase() === chip.toLowerCase();
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  haptics.light();
                  setInputText(chip);
                  setTranslatedText(chip);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Entrada de Texto Libre */}
        <TextInput
          style={styles.textArea}
          placeholder="Escribe aquí cualquier texto o frase para que el Señor o la Señorita lo interprete en LESCO..."
          placeholderTextColor="#7A6E5C"
          multiline
          numberOfLines={3}
          value={inputText}
          onChangeText={(val) => {
            setInputText(val);
            if (val.trim().length > 0) {
              setTranslatedText(val);
            }
          }}
        />

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.translateBtn}
            onPress={handleTranslate}
            activeOpacity={0.85}
          >
            <Text style={styles.translateBtnText}>
              Interpretar en Señas LESCO ({avatarGender === 'senor' ? 'Señor 3D' : 'Señorita 3D'})
            </Text>
            <Text style={{ fontSize: 18 }}>🤟</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={[styles.dictationBtn, { flex: 1 }]}
              onPress={handleVoiceDictation}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>🎤</Text>
              <Text style={styles.dictationBtnText}>Dictado por voz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dictationBtn, styles.modalVideoBtn, { flex: 1 }]}
              onPress={handleOpenFullscreenModal}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>🎬</Text>
              <Text style={[styles.dictationBtnText, { color: Colors.primary.main }]}>
                Modal Video R2
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal Video LESCO en Pantalla Completa */}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl * 2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
  },
  title: {
    fontSize: 26,
    fontWeight: Typography.weights.black,
    color: '#5C7A5C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
  },
  modeSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    padding: 8,
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActiveTerracotta: {
    backgroundColor: '#B5551A',
  },
  modeBtnActiveSage: {
    backgroundColor: '#5C7A5C',
  },
  modeBtnText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    textAlign: 'center',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.black,
  },
  speedAndGlossBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF6EE',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    gap: 8,
  },
  glossBadgeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  glossBadgeLabel: {
    fontSize: 9.5,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
  },
  glossBadgeValue: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  speedRow: {
    flexDirection: 'row',
    backgroundColor: '#EAE0D0',
    borderRadius: Radius.pill,
    padding: 2,
    gap: 2,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
  },
  speedChipActive: {
    backgroundColor: '#5C7A5C',
  },
  speedChipText: {
    color: '#7A6E5C',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  speedChipTextActive: {
    color: '#FFFFFF',
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  realVideoCard: {
    backgroundColor: '#1E1914',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#33291F',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  realVideoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  r2StatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(92, 122, 92, 0.24)',
    borderWidth: 1,
    borderColor: '#5C7A5C',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 5,
    flex: 1,
  },
  r2LiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  r2StatusText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#EBF2EB',
  },
  fullscreenPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  fullscreenPillText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#FBF6EE',
  },
  videoViewportCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  videoFrame9x16: {
    width: 168,
    height: 298,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  nativeVideoView: {
    width: '100%',
    height: '100%',
  },
  videoLoadingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    padding: 4,
  },
  timedCaptionBox: {
    backgroundColor: 'rgba(24, 19, 14, 0.92)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 176, 65, 0.38)',
  },
  timedCaptionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  timedCaptionBadge: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#F5B041',
  },
  timedCaptionClock: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(251, 246, 238, 0.72)',
  },
  timedCaptionText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FBF6EE',
    fontWeight: '600',
    marginBottom: 6,
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
  realVideoControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  videoCtrlBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCtrlBtnActiveCc: {
    backgroundColor: '#F5B041',
  },
  videoCtrlBtnAvatarSwitch: {
    backgroundColor: '#B5551A',
  },
  videoCtrlBtnText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#FBF6EE',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.black,
    color: '#7A6E5C',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipSelected: {
    backgroundColor: '#EBF2EB',
    borderColor: '#5C7A5C',
  },
  chipText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  chipTextSelected: {
    color: '#5C7A5C',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    padding: Spacing.md,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: '#2B241C',
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  actionButtons: {
    gap: Spacing.sm,
  },
  translateBtn: {
    width: '100%',
    backgroundColor: '#B5551A',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  translateBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dictationBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    paddingVertical: 12,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  modalVideoBtn: {
    borderColor: '#E6B08A',
    backgroundColor: '#FBF6EE',
  },
  dictationBtnText: {
    color: '#2B241C',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
});
