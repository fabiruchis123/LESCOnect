import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { useSettingsStore } from '@/shared/stores/useSettingsStore';
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';
import {
  LescoVideoModal,
  VentanillaModal,
  type LescoVideoInfo,
} from '@/shared/components';

export interface HistoryItem {
  id: string;
  text: string;
  category: 'Traducción' | 'Trámites' | 'Emergencia';
  date: string;
  icon: string;
  r2Key?: string;
  glossText?: string;
}

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: '1',
    text: 'Necesito ayuda urgente, no puedo escuchar.',
    category: 'Emergencia',
    date: 'Hoy, 10:45 AM',
    icon: '🚨',
    r2Key: 'lesco/v1/m5/emergencia/1_1.mp4',
    glossText: 'AYUDA URGENTE NECESITAR / YO SORDO NO ESCUCHAR',
  },
  {
    id: '2',
    text: 'Hola, soy una persona sorda y vengo a realizar un trámite.',
    category: 'Trámites',
    date: 'Hoy, 09:12 AM',
    icon: '🗣️',
    r2Key: 'lesco/v1/m5/banco/0.mp4',
    glossText: 'HOLA / YO PERSONA SORDA / VENIR HACER TRÁMITE',
  },
  {
    id: '3',
    text: 'Vengo a retirar mis medicamentos de la receta.',
    category: 'Trámites',
    date: 'Ayer, 03:20 PM',
    icon: '🏥',
    r2Key: 'lesco/v1/m5/hospital/2_1.mp4',
    glossText: 'VENIR RETIRAR / MEDICAMENTOS RECETA MÉDICA',
  },
  {
    id: '4',
    text: 'Muchas gracias por su paciencia y ayuda.',
    category: 'Traducción',
    date: 'Ayer, 11:05 AM',
    icon: '🤟',
    r2Key: 'lesco/v1/m5/mensajes/1_2.mp4',
    glossText: 'MUCHAS GRACIAS / PACIENCIA APOYO AYUDA',
  },
];

export interface HistoryScreenProps {
  onBackPress?: () => void;
}

export function HistoryScreen({ onBackPress }: HistoryScreenProps = {}) {
  const router = useRouter();
  const fontScale = useSettingsStore((state) => state.fontScale);
  const scaleFont = (size: number) => Math.round(size * fontScale);

  const [historyList, setHistoryList] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [activeFilter, setActiveFilter] = useState<
    'Todos' | 'Traducción' | 'Trámites' | 'Emergencia'
  >('Todos');
  const [ventanillaText, setVentanillaText] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.push('/(tabs)');
    }
  };

  const filteredItems = historyList.filter(
    (item) => activeFilter === 'Todos' || item.category === activeFilter
  );

  const handleSpeak = (text: string) => {
    haptics.light();
    speechService.speak(text);
  };

  const handleShowBig = (text: string) => {
    haptics.light();
    setVentanillaText(text);
  };

  const handleOpenVideo = (item: HistoryItem) => {
    haptics.light();
    setActiveVideo({
      title: item.text,
      category: `Historial • ${item.category}`,
      r2Key: item.r2Key,
      glossText: item.glossText,
    });
  };

  const handleOpenModuleTutorial = () => {
    haptics.light();
    setActiveVideo({
      title: 'Historial de Conversaciones',
      category: 'Módulo 7 • Historial y Soporte',
      r2Key: 'lesco/v1/m7/7_1.mp4',
      glossText:
        'HISTORIAL FRASES TRADUCIDAS ANTES / ALERTAS EMERGENCIA / REPRODUCIR RÁPIDO',
    });
  };

  const handleDeleteItem = (id: string) => {
    haptics.light();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    haptics.light();
    if (historyList.length === 0) return;
    Alert.alert(
      'Vaciar Historial',
      '¿Deseas borrar todo tu historial de conversaciones?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => haptics.light(),
        },
        {
          text: 'Borrar Todo',
          style: 'destructive',
          onPress: () => {
            haptics.medium();
            setHistoryList([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver a Inicio"
          >
            <Text style={[styles.backBtnText, { fontSize: scaleFont(18) }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.backBtnLabel, { fontSize: scaleFont(Typography.sizes.xs) }]}>
            Volver a Inicio
          </Text>

          <TouchableOpacity
            onPress={handleOpenModuleTutorial}
            style={styles.tutorialHeaderBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ver explicación del Historial en señas LESCO"
          >
            <Text style={{ fontSize: scaleFont(13) }}>📹</Text>
            <Text style={[styles.tutorialHeaderBtnText, { fontSize: scaleFont(11) }]}>
              En señas
            </Text>
          </TouchableOpacity>

          {historyList.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.clearBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Vaciar todo el historial"
            >
              <Text style={[styles.clearBtnText, { fontSize: scaleFont(11) }]}>
                Vaciar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.title, { fontSize: scaleFont(30) }]}>Historial</Text>
        <Text style={[styles.subtitle, { fontSize: scaleFont(Typography.sizes.xs) }]}>
          Tus conversaciones, frases de ventanilla y señas recientes
        </Text>

        {/* Filtros de Categoría */}
        <View style={styles.filtersRow}>
          {(['Todos', 'Traducción', 'Trámites', 'Emergencia'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => {
                haptics.light();
                setActiveFilter(filter);
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { fontSize: scaleFont(11) },
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de Elementos */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: scaleFont(36), marginBottom: 8 }}>📜</Text>
            <Text style={[styles.emptyTitle, { fontSize: scaleFont(Typography.sizes.md) }]}>
              No hay registros recientes
            </Text>
            <Text style={[styles.emptySub, { fontSize: scaleFont(Typography.sizes.xs) }]}>
              Las frases traducidas o mostradas en ventanilla aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={{ fontSize: scaleFont(13), marginRight: 4 }}>
                      {item.icon}
                    </Text>
                    <Text style={[styles.categoryBadgeText, { fontSize: scaleFont(10) }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={[styles.dateText, { fontSize: scaleFont(10) }]}>
                    {item.date}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.phraseText,
                    {
                      fontSize: scaleFont(Typography.sizes.sm),
                      lineHeight: scaleFont(21),
                    },
                  ]}
                >
                  “{item.text}”
                </Text>

                <View style={styles.actionsRow}>
                  {/* Acción Primaria 1: Mostrar en grande (Ventanilla) */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => handleShowBig(item.text)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Mostrar en pantalla grande de ventanilla: ${item.text}`}
                  >
                    <Text style={{ fontSize: scaleFont(12) }}>📱</Text>
                    <Text
                      style={[
                        styles.actionBtnText,
                        styles.actionBtnTextPrimary,
                        { fontSize: scaleFont(11) },
                      ]}
                    >
                      Ventanilla
                    </Text>
                  </TouchableOpacity>

                  {/* Acción Primaria 2: Ver en señas LESCO */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnLesco]}
                    onPress={() => handleOpenVideo(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver en señas LESCO: ${item.text}`}
                  >
                    <Text style={{ fontSize: scaleFont(12) }}>🤟</Text>
                    <Text
                      style={[
                        styles.actionBtnText,
                        styles.actionBtnTextLesco,
                        { fontSize: scaleFont(11) },
                      ]}
                    >
                      Señas
                    </Text>
                  </TouchableOpacity>

                  {/* Acción 3: Reproducir voz (TTS) */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSpeak(item.text)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Pronunciar en voz alta: ${item.text}`}
                  >
                    <Text style={{ fontSize: scaleFont(12) }}>🔊</Text>
                    <Text style={[styles.actionBtnText, { fontSize: scaleFont(11) }]}>
                      Hablar
                    </Text>
                  </TouchableOpacity>

                  {/* Acción 4: Eliminar registro */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar frase del historial"
                  >
                    <Text style={[styles.deleteBtnText, { fontSize: scaleFont(11) }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Pantalla Gigante para Ventanilla */}
      <VentanillaModal
        visible={Boolean(ventanillaText)}
        text={ventanillaText || ''}
        onSpeak={(txt) => handleSpeak(txt)}
        onClose={() => {
          haptics.light();
          setVentanillaText(null);
        }}
      />

      {/* Modal de Video en Señas LESCO */}
      {activeVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => {
            haptics.light();
            setActiveVideo(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl * 2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
  },
  tutorialHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.secondary.surface,
    borderWidth: 1,
    borderColor: Colors.secondary.border,
    gap: 4,
  },
  tutorialHeaderBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#FDEDEC',
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#C0392B',
  },
  title: {
    fontSize: 30,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  filterChipActive: {
    backgroundColor: '#B5551A',
    borderColor: '#B5551A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 10,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
  },
  phraseText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    gap: 4,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary.surface,
    borderColor: Colors.primary.light,
  },
  actionBtnLesco: {
    backgroundColor: Colors.secondary.surface,
    borderColor: Colors.secondary.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  actionBtnTextPrimary: {
    color: Colors.primary.main,
  },
  actionBtnTextLesco: {
    color: Colors.secondary.main,
  },
  deleteBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    textAlign: 'center',
    maxWidth: 240,
  },
});
