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
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Traductor LESCO',
              category: 'Señas ↔ Voz y Texto',
              glossText: 'CÁMARA VER TÚ HACER SEÑAS / CONVERTIR VOZ TEXTO / OTRA PERSONA HABLAR TÚ VER SEÑAS',
            })
          }
        />

        {/* 3. Prioridad 2: Emergencias 9-1-1 SOS (Coral Urgente) */}
        <EmergencyBanner
          onPress={handleEmergencies}
          onPressTutorial={() =>
            handleOpenTutorial({
              title: 'Emergencias 9-1-1 SOS',
              category: 'Auxilio y Seguridad',
              glossText: 'EMERGENCIA AUXILIO 9-1-1 / TOCAR BOTÓN / BOMBEROS POLICÍA AMBULANCIA LLEGAR GPS',
            })
          }
        />

        {/* 4. Prioridad 3: Mensajes Rápidos Bento Grid */}
        <QuickMessagesBento
          onPressViewAll={() => handleTramites()}
          onPressCategory={(id) => handleTramites(id)}
          onPressTutorial={(id) =>
            handleOpenTutorial({
              title: `Trámites - ${id.toUpperCase()}`,
              category: 'Frases y Asistencia Presencial',
              glossText: `TOCAR MOSTRAR PANTALLA GIGANTE / FUNCIONARIO LEER AYUDAR ${id.toUpperCase()}`,
            })
          }
        />

        {/* 5. Prioridad 4 y 5: Historial y Ayuda LESCO */}
        <SecondaryActionsGrid
          onPressHistory={handleHistory}
          onPressHelp={handleHelp}
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
