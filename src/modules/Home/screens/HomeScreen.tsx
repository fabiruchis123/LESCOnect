import React, { useState } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { haptics } from '@/shared/utils/haptics';
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
  const userName = user?.nombre || user?.name || 'Génesis';

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
        {/* 1. Header con Saludo, Perfil y Video LESCO de Bienvenida */}
        <HomeHeader
          userName={userName}
          onPressProfile={handleProfile}
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Bienvenida a LESCOnect',
              category: 'Introducción General',
              glossText: 'HOLA BIENVENIDO / LESCOnect APLICACIÓN COMUNICAR / SEÑAS VOZ',
            })
          }
        />

        {/* 2. Prioridad 1: Hero Card Traductor LESCO (Terracota) */}
        <TranslatorHeroCard
          onPressSignsToText={handleSignsToText}
          onPressTextToSigns={handleTextToSigns}
          onPressSignsTutorial={() =>
            handleOpenTutorial({
              title: 'Señas a Voz',
              category: 'Traductor LESCO',
              glossText: 'CÁMARA APUNTAR MANOS / HACER SEÑAS LESCO / APLICACIÓN TRADUCIR VOZ TEXTO HABLAR',
            })
          }
          onPressTextTutorial={() =>
            handleOpenTutorial({
              title: 'Voz a Señas',
              category: 'Traductor LESCO',
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
              glossText: 'HISTORIAL MENSAJES ANTES / BUSCAR COPIAR BORRAR CONVERSACIONES GUARDADAS',
            })
          }
          onPressHelpTutorial={() =>
            handleOpenTutorial({
              title: 'Ayuda y Recursos LESCO',
              category: 'Ayuda LESCO',
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
