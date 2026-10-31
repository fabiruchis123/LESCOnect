import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSettingsStore } from '@/shared/stores/useSettingsStore';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { FALLBACK_VIDEO_CATALOG } from '@/shared/services/videoCacheService';
import { HomeHeader } from '../components/HomeHeader';
import { TranslatorHeroCard } from '../components/TranslatorHeroCard';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { QuickMessagesBento } from '../components/QuickMessagesBento';
import { SecondaryActionsGrid } from '../components/SecondaryActionsGrid';
import { LescoVideoModal, type LescoVideoInfo } from '../components/LescoVideoModal';
import { styles } from '../styles/home.styles';
import { HomeScreenProps } from '../types';
import { HistoryScreen } from '@/modules/Historial';
import { HelpScreen } from '@/modules/Ayuda';

export function HomeScreen({
  onNavigateToTranslator,
  onNavigateToEmergencies,
  onNavigateToTramites,
  onNavigateToHistory,
  onNavigateToHelp,
  onNavigateToProfile,
}: HomeScreenProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fontScale = useSettingsStore((state) => state.fontScale);
  const vibrationEnabled = useSettingsStore((state) => state.vibrationEnabled);
  const userName = user?.nombre || user?.name || 'Génesis';

  const scaleFont = (size: number) => Math.round(size * fontScale);
  const totalCatalogVideos = FALLBACK_VIDEO_CATALOG.length;

  // Estado para el modal de video LESCO
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);
  const [subView, setSubView] = useState<'home' | 'history' | 'help'>('home');

  if (subView === 'history') {
    return <HistoryScreen onBackPress={() => setSubView('home')} />;
  }

  if (subView === 'help') {
    return <HelpScreen onBackPress={() => setSubView('home')} />;
  }

  const handleOpenTutorial = (info: LescoVideoInfo) => {
    haptics.medium();
    setActiveVideo(info);
  };

  const handleOpenControlsTutorial = () => {
    haptics.light();
    setActiveVideo({
      title: 'Controles de Video LESCO (0.5x y CC)',
      category: 'Navegación y Aprendizaje Visual',
      r2Key: 'lesco/v1/m2/2_4.mp4',
      glossText:
        'CONTROLES VIDEO DEBAJO / PAUSAR REPETIR SEÑA / VELOCIDAD LENTA 0.5X / SUBTÍTULOS CC APRENDER DETALLE',
    });
  };

  const handleSignsToText = () => {
    haptics.light();
    if (onNavigateToTranslator) {
      onNavigateToTranslator('signs_to_text');
    } else {
      router.push('/(tabs)/traductor');
    }
  };

  const handleTextToSigns = () => {
    haptics.light();
    if (onNavigateToTranslator) {
      onNavigateToTranslator('text_to_signs');
    } else {
      router.push('/(tabs)/traductor');
    }
  };

  const handleEmergencies = () => {
    haptics.emergency();
    if (onNavigateToEmergencies) {
      onNavigateToEmergencies();
    } else {
      router.push('/(tabs)/emergencias');
    }
  };

  const handleTramites = (categoryId?: string) => {
    haptics.light();
    if (onNavigateToTramites) {
      onNavigateToTramites(categoryId);
    } else {
      router.push('/(tabs)/tramites');
    }
  };

  const handleProfile = () => {
    haptics.light();
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      router.push('/(tabs)/perfil');
    }
  };

  const handleHistory = () => {
    haptics.light();
    if (onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      setSubView('history');
    }
  };

  const handleHelp = () => {
    haptics.light();
    if (onNavigateToHelp) {
      onNavigateToHelp();
    } else {
      setSubView('help');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header con Saludo, Perfil y Video LESCO de Bienvenida (2_1.mp4) */}
        <HomeHeader
          userName={userName}
          onPressProfile={handleProfile}
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Bienvenida a LESCOnect',
              category: 'Introducción General',
              r2Key: 'lesco/v1/m2/2_1.mp4',
              glossText: 'HOLA BIENVENIDO / LESCOnect APLICACIÓN COMUNICAR / SEÑAS VOZ',
            })
          }
        />

        {/* 1.5 Barra Deaf-First: Estado del Catálogo Offline + Acceso Rápido al Tutorial de Controles (2_4.mp4) */}
        <View style={localStyles.deafStatusStrip}>
          <TouchableOpacity
            style={localStyles.catalogStatusPill}
            onPress={() =>
              handleOpenTutorial({
                title: 'Bienvenida a LESCOnect',
                category: 'Introducción General',
                r2Key: 'lesco/v1/m2/2_1.mp4',
                glossText: 'CATÁLOGO LESCO LISTO / SUBTÍTULOS CC / MODO SIN INTERNET ACTIVO',
              })
            }
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Catálogo de ${totalCatalogVideos} videos LESCO con subtítulos CC listos para uso offline`}
          >
            <View style={localStyles.statusDot} />
            <Text
              style={[
                localStyles.catalogStatusText,
                { fontSize: scaleFont(11) },
              ]}
              numberOfLines={1}
            >
              {totalCatalogVideos} Videos LESCO • CC Listo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.controlsTutorialChip}
            onPress={handleOpenControlsTutorial}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir tutorial en señas sobre cómo usar los controles de video y cámara lenta 0.5x"
          >
            <Text style={{ fontSize: scaleFont(13) }}>🐢</Text>
            <Text
              style={[
                localStyles.controlsTutorialText,
                { fontSize: scaleFont(11) },
              ]}
            >
              Controles LESCO
            </Text>
          </TouchableOpacity>
        </View>

        {/* Indicador dinámico cuando el usuario personaliza escala visual o háptica */}
        {fontScale !== 1.0 ? (
          <TouchableOpacity
            style={localStyles.a11yScaleBanner}
            onPress={handleProfile}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ajustes de accesibilidad visual activos. Toca para configurar en tu perfil"
          >
            <Text style={[localStyles.a11yScaleText, { fontSize: scaleFont(11) }]}>
              🔍 Escala visual {Math.round(fontScale * 100)}% activa •{' '}
              {vibrationEnabled ? '📳 Háptica ON' : 'Háptica OFF'}
            </Text>
            <Text style={[localStyles.a11yScaleAction, { fontSize: scaleFont(11) }]}>
              Ajustar →
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* 2. Prioridad 1: Hero Card Traductor LESCO (Terracota) */}
        <TranslatorHeroCard
          onPressSignsToText={handleSignsToText}
          onPressTextToSigns={handleTextToSigns}
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Acceso al Traductor LESCO',
              category: 'Pantalla Principal',
              r2Key: 'lesco/v1/m2/2_2.mp4',
              glossText: 'TARJETA TRADUCTOR / MICRÓFONO HABLAR O ESCRIBIR / GENERAR SEÑAS EN VIDEO',
            })
          }
          onPressSignsTutorial={() =>
            handleOpenTutorial({
              title: 'Señas a Voz',
              category: 'Traductor LESCO',
              r2Key: 'lesco/v1/m3/3_2.mp4',
              glossText: 'CÁMARA APUNTAR MANOS / HACER SEÑAS LESCO / APLICACIÓN TRADUCIR VOZ TEXTO HABLAR',
            })
          }
          onPressTextTutorial={() =>
            handleOpenTutorial({
              title: 'Voz a Señas',
              category: 'Traductor LESCO',
              r2Key: 'lesco/v1/m3/3_1.mp4',
              glossText: 'PERSONA HABLAR MICRÓFONO / APLICACIÓN ESCUCHAR / MOSTRAR SEÑAS EN PANTALLA',
            })
          }
        />

        {/* 3. Emergencias (Coral) */}
        <EmergencyBanner
          onPress={handleEmergencies}
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Módulo de Emergencias 911',
              category: 'Emergencias SOS',
              r2Key: 'lesco/v1/m2/2_3.mp4',
              glossText: 'EMERGENCIA 911 SOS / POLICÍA AMBULANCIA BOMBEROS / UBICACIÓN ENVIAR RÁPIDO',
            })
          }
        />

        {/* 4. Trámites Rápidos */}
        <QuickMessagesBento
          onPressViewAll={() => handleTramites()}
          onPressCategory={(id) => handleTramites(id)}
        />

        {/* 5. Prioridad 4 y 5: Historial y Ayuda LESCO */}
        <SecondaryActionsGrid
          onPressHistory={handleHistory}
          onPressHelp={handleHelp}
          onPressHistoryTutorial={() =>
            handleOpenTutorial({
              title: 'Historial de Conversaciones',
              category: 'Historial',
              r2Key: 'lesco/v1/m7/7_1.mp4',
              glossText: 'HISTORIAL MENSAJES ANTES / BUSCAR COPIAR BORRAR CONVERSACIONES GUARDADAS',
            })
          }
          onPressHelpTutorial={() =>
            handleOpenTutorial({
              title: 'Ayuda y Recursos LESCO',
              category: 'Ayuda LESCO',
              r2Key: 'lesco/v1/m7/7_2.mp4',
              glossText: 'AYUDA PREGUNTAS FRECUENTES / APRENDER LESCO CULTURA SORDA CONTACTO SOPORTE',
            })
          }
        />
      </ScrollView>

      {/* Modal Reproductor de Video en LESCO (Carga diferida para inicio instantáneo) */}
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

const localStyles = StyleSheet.create({
  deafStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  catalogStatusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.surface,
    borderColor: Colors.secondary.border,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 7,
    ...Shadows.subtle,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary.main,
  },
  catalogStatusText: {
    color: Colors.secondary.main,
    fontWeight: Typography.weights.bold,
    flexShrink: 1,
  },
  controlsTutorialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.surface,
    borderColor: Colors.primary.light,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 5,
    ...Shadows.subtle,
  },
  controlsTutorialText: {
    color: Colors.primary.main,
    fontWeight: Typography.weights.black,
  },
  a11yScaleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border.subtle,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginTop: -Spacing.sm,
    ...Shadows.subtle,
  },
  a11yScaleText: {
    color: Colors.text.secondary,
    fontWeight: Typography.weights.bold,
    flex: 1,
  },
  a11yScaleAction: {
    color: Colors.primary.main,
    fontWeight: Typography.weights.black,
    marginLeft: Spacing.sm,
  },
});
