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
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';
import { VentanillaModal } from '@/modules/TramitesRapidos';

export interface HistoryItem {
  id: string;
  text: string;
  category: 'Traducción' | 'Trámites' | 'Emergencia';
  date: string;
  icon: string;
}

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: '1',
    text: 'Necesito ayuda urgente en mi ubicación',
    category: 'Emergencia',
    date: 'Hoy, 10:45 AM',
    icon: '🚨',
  },
  {
    id: '2',
    text: 'Hola, soy una persona sorda y necesito asistencia para este trámite.',
    category: 'Trámites',
    date: 'Hoy, 09:12 AM',
    icon: '🗣️',
  },
  {
    id: '3',
    text: '¿Dónde puedo retirar mi receta médica y medicamentos?',
    category: 'Trámites',
    date: 'Ayer, 03:20 PM',
    icon: '🏥',
  },
  {
    id: '4',
    text: 'Muchas gracias por su paciencia y apoyo.',
    category: 'Traducción',
    date: 'Ayer, 11:05 AM',
    icon: '🤟',
  },
];

export interface HistoryScreenProps {
  onBackPress?: () => void;
}

export function HistoryScreen({ onBackPress }: HistoryScreenProps = {}) {
  const router = useRouter();
  const [historyList, setHistoryList] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Traducción' | 'Trámites' | 'Emergencia'>('Todos');
  const [ventanillaText, setVentanillaText] = useState<string | null>(null);

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
    haptics.medium();
    setVentanillaText(text);
  };

  const handleDeleteItem = (id: string) => {
    haptics.light();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (historyList.length === 0) return;
    Alert.alert(
      'Vaciar Historial',
      '¿Deseas borrar todo tu historial de conversaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver a Inicio</Text>

          {historyList.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Vaciar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Tus conversaciones y traducciones recientes</Text>

        {/* Filtros de Categoría */}
        <View style={styles.filtersRow}>
          {(['Todos', 'Traducción', 'Trámites', 'Emergencia'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => {
                haptics.light();
                setActiveFilter(filter);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
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
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📜</Text>
            <Text style={styles.emptyTitle}>No hay registros recientes</Text>
            <Text style={styles.emptySub}>
              Las frases traducidas o mostradas en ventanilla aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={{ fontSize: 13, marginRight: 4 }}>{item.icon}</Text>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.phraseText}>"{item.text}"</Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShowBig(item.text)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 12 }}>📱</Text>
                    <Text style={styles.actionBtnText}>Mostrar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSpeak(item.text)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 12 }}>🔊</Text>
                    <Text style={styles.actionBtnText}>Hablar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
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
        onClose={() => setVentanillaText(null)}
      />
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
    flex: 1,
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
    paddingVertical: 6,
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
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  deleteBtn: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 8,
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
