import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';
import { VentanillaModal } from '../components/VentanillaModal';
import { TRAMITES_CATEGORIES } from '../services/tramitesData';
import { TramiteCategory, TramiteSituation } from '../types';
import { styles } from '../styles/tramites.styles';

export function QuickMessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  // Estados de Navegación Jerárquica (Categorías -> Detalle de Categoría -> Situación)
  const [selectedCategory, setSelectedCategory] = useState<TramiteCategory | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<TramiteSituation | null>(null);

  // Estados de Modales
  const [ventanillaText, setVentanillaText] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  // Sincronizar si viene un parámetro category desde Home
  useEffect(() => {
    if (params.category) {
      const found = TRAMITES_CATEGORIES.find(
        (c) => c.id.toLowerCase() === params.category?.toLowerCase()
      );
      if (found) {
        setSelectedCategory(found);
        setSelectedSituation(null);
      }
    }
  }, [params.category]);

  // Manejadores de interacción
  const handleSelectCategory = (cat: TramiteCategory) => {
    haptics.light();
    setSelectedCategory(cat);
    setSelectedSituation(null);
  };

  const handleSelectSituation = (sit: TramiteSituation) => {
    haptics.light();
    setSelectedSituation(sit);
  };

  const handleBackToCategories = () => {
    haptics.light();
    setSelectedCategory(null);
    setSelectedSituation(null);
  };

  const handleBackToCategoryDetail = () => {
    haptics.light();
    setSelectedSituation(null);
  };

  const handleSpeak = (text: string) => {
    haptics.medium();
    speechService.speak(text);
  };

  const handleOpenVentanilla = (text: string) => {
    haptics.medium();
    setVentanillaText(text);
  };

  const handleOpenLescoVideo = (title: string, gloss: string) => {
    haptics.light();
    setActiveVideo({
      title,
      category: selectedCategory?.name || 'LESCO',
      glossText: gloss,
    });
  };

  const handleGoToTranslator = (mode: 'speech_to_sign' | 'sign_to_speech') => {
    haptics.light();
    router.push('/(tabs)/traductor');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================= */}
        {/* VISTA 1: GRID PRINCIPAL DE CATEGORÍAS TIERRA           */}
        {/* ======================================================= */}
        {!selectedCategory && (
          <View>
            <View style={styles.headerNavRow}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>Volver a Inicio</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.screenTitle, { color: '#2B241C' }]}>
              Trámites y frases rápidas
            </Text>
            <Text style={styles.screenSubtitle}>
              Asistente presencial para ventanillas e instituciones
            </Text>

            <View style={styles.categoriesList}>
              {TRAMITES_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    { borderColor: cat.borderColor },
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryCardLeft}>
                    <View
                      style={[
                        styles.categoryIconBox,
                        { backgroundColor: cat.bgColor, borderColor: cat.borderColor },
                      ]}
                    >
                      <Text style={styles.categoryIconEmoji}>{cat.icon}</Text>
                    </View>
                    <View style={styles.categoryTextColumn}>
                      <Text style={[styles.categoryCardTitle, { color: cat.themeColor }]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryCardSubtitle}>{cat.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.categoryCardRight}>
                    <TouchableOpacity
                      style={[
                        styles.categorySignBtn,
                        { backgroundColor: cat.bgColor, borderColor: cat.borderColor },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenLescoVideo(
                          `Mensajes Rápidos - ${cat.name}`,
                          cat.rompehielo.gloss
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categorySignIcon}>📹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.categoryArrow, { color: cat.themeColor }]}>
                      →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ======================================================= */}
        {/* VISTA 2: DETALLE DE CATEGORÍA Y TARJETA ROMPEHIELO     */}
        {/* ======================================================= */}
        {selectedCategory && !selectedSituation && (
          <View>
            <View style={styles.headerNavRow}>
              <TouchableOpacity
                onPress={handleBackToCategories}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>Volver a categorías</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: selectedCategory.bgColor,
                    borderColor: selectedCategory.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: selectedCategory.themeColor },
                  ]}
                >
                  {selectedCategory.badge}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.screenTitle,
                { color: selectedCategory.themeColor },
              ]}
            >
              {selectedCategory.name}
            </Text>
            <Text style={styles.screenSubtitle}>
              {selectedCategory.subtitle}
            </Text>

            {/* Tarjeta Rompehielo (Presentación en ventanilla) */}
            <View
              style={[
                styles.rompehieloCard,
                { borderColor: selectedCategory.borderColor },
              ]}
            >
              <View style={styles.rompehieloHeaderRow}>
                <View style={styles.rompehieloTagRow}>
                  <Text style={styles.rompehieloTagEmoji}>{selectedCategory.icon}</Text>
                  <Text
                    style={[
                      styles.rompehieloTagText,
                      { color: selectedCategory.themeColor },
                    ]}
                  >
                    Presentación en ventanilla
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.lescoPillBtn,
                    { borderColor: selectedCategory.borderColor },
                  ]}
                  onPress={() =>
                    handleOpenLescoVideo(
                      selectedCategory.rompehielo.phrase,
                      selectedCategory.rompehielo.gloss
                    )
                  }
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 11 }}>📹</Text>
                  <Text
                    style={[
                      styles.lescoPillText,
                      { color: selectedCategory.themeColor },
                    ]}
                  >
                    Ver seña
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.rompehieloQuote}>
                "{selectedCategory.rompehielo.phrase}"
              </Text>

              <View style={styles.actionDualGrid}>
                <TouchableOpacity
                  style={[
                    styles.actionShowBtn,
                    { backgroundColor: selectedCategory.themeColor },
                  ]}
                  onPress={() =>
                    handleOpenVentanilla(selectedCategory.rompehielo.phrase)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 13 }}>📱</Text>
                  <Text style={styles.actionShowBtnText}>Mostrar en grande</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionSpeakBtn,
                    { borderColor: selectedCategory.borderColor },
                  ]}
                  onPress={() => handleSpeak(selectedCategory.rompehielo.phrase)}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 13 }}>🔊</Text>
                  <Text
                    style={[
                      styles.actionSpeakBtnText,
                      { color: selectedCategory.themeColor },
                    ]}
                  >
                    Hablar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de Situaciones Específicas */}
            <Text style={styles.sectionHeaderLabel}>Selecciona tu trámite:</Text>
            <View style={styles.situationsList}>
              {selectedCategory.situations.map((sit) => (
                <TouchableOpacity
                  key={sit.id}
                  style={[
                    styles.situationCard,
                    { borderColor: selectedCategory.borderColor },
                  ]}
                  onPress={() => handleSelectSituation(sit)}
                  activeOpacity={0.8}
                >
                  <View style={styles.situationCardLeft}>
                    <View
                      style={[
                        styles.situationIconBox,
                        {
                          backgroundColor: selectedCategory.bgColor,
                          borderColor: selectedCategory.borderColor,
                        },
                      ]}
                    >
                      <Text style={styles.situationIconEmoji}>{sit.icon}</Text>
                    </View>
                    <View style={styles.situationTextColumn}>
                      <Text style={styles.situationTitle}>{sit.title}</Text>
                      <Text style={styles.situationDesc}>{sit.description}</Text>
                    </View>
                  </View>

                  <View style={styles.categoryCardRight}>
                    <TouchableOpacity
                      style={[
                        styles.categorySignBtn,
                        {
                          backgroundColor: selectedCategory.bgColor,
                          borderColor: selectedCategory.borderColor,
                        },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenLescoVideo(sit.title, sit.phrases[0]?.gloss || 'LESCO');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categorySignIcon}>📹</Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.categoryArrow,
                        { color: selectedCategory.themeColor },
                      ]}
                    >
                      →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ======================================================= */}
        {/* VISTA 3: DETALLE DE SITUACIÓN Y LISTA DE FRASES        */}
        {/* ======================================================= */}
        {selectedCategory && selectedSituation && (
          <View>
            <View style={styles.headerNavRow}>
              <TouchableOpacity
                onPress={handleBackToCategoryDetail}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonArrow}>←</Text>
                <Text style={styles.backButtonText}>
                  Volver a {selectedCategory.name}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: selectedCategory.bgColor,
                    borderColor: selectedCategory.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: selectedCategory.themeColor },
                  ]}
                >
                  {selectedSituation.icon} Situación {selectedSituation.situationNum}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.screenTitle,
                { color: selectedCategory.themeColor },
              ]}
            >
              {selectedSituation.title}
            </Text>
            <Text style={styles.screenSubtitle}>
              {selectedSituation.description}
            </Text>

            {/* Lista de Frases de la Situación */}
            {selectedSituation.phrases.map((phraseItem, idx) => (
              <View
                key={idx}
                style={[
                  styles.phraseCard,
                  { borderColor: selectedCategory.borderColor },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.watchLescoBannerBtn,
                    {
                      backgroundColor: selectedCategory.bgColor,
                      borderColor: selectedCategory.borderColor,
                    },
                  ]}
                  onPress={() =>
                    handleOpenLescoVideo(phraseItem.phrase, phraseItem.gloss)
                  }
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 12 }}>📹</Text>
                  <Text
                    style={[
                      styles.watchLescoBannerText,
                      { color: selectedCategory.themeColor },
                    ]}
                  >
                    Ver cómo se dice en señas LESCO primero
                  </Text>
                </TouchableOpacity>

                <Text style={styles.phraseText}>"{phraseItem.phrase}"</Text>

                <View style={styles.actionDualGrid}>
                  <TouchableOpacity
                    style={[
                      styles.actionShowBtn,
                      { backgroundColor: selectedCategory.themeColor },
                    ]}
                    onPress={() => handleOpenVentanilla(phraseItem.phrase)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 13 }}>📱</Text>
                    <Text style={styles.actionShowBtnText}>Mostrar en grande</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionSpeakBtn,
                      { borderColor: selectedCategory.borderColor },
                    ]}
                    onPress={() => handleSpeak(phraseItem.phrase)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 13 }}>🔊</Text>
                    <Text
                      style={[
                        styles.actionSpeakBtnText,
                        { color: selectedCategory.themeColor },
                      ]}
                    >
                      Hablar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Escape al Traductor */}
            <View style={styles.escapeCard}>
              <Text style={styles.escapeLabel}>¿Necesitas decir algo más?</Text>
              <View style={styles.escapeButtonsRow}>
                <TouchableOpacity
                  style={styles.escapeBtn}
                  onPress={() => handleGoToTranslator('speech_to_sign')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.escapeBtnEmoji}>🎙️</Text>
                  <Text style={styles.escapeBtnText}>Escuchar voz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.escapeBtn}
                  onPress={() => handleGoToTranslator('sign_to_speech')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.escapeBtnEmoji}>📷</Text>
                  <Text style={styles.escapeBtnText}>Responder en señas</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Pantalla Gigante para Ventanilla */}
      <VentanillaModal
        visible={Boolean(ventanillaText)}
        text={ventanillaText || ''}
        categoryThemeColor={selectedCategory?.themeColor}
        onSpeak={(txt) => handleSpeak(txt)}
        onWatchLesco={(txt) => {
          setVentanillaText(null);
          handleOpenLescoVideo(txt, 'LESCO');
        }}
        onClose={() => setVentanillaText(null)}
      />

      {/* Modal Reproductor de Video LESCO */}
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
