import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import {
  ScreenWrapper,
  AppHeader,
  AppButton,
  Badge,
  AppCard,
  CategoryCard,
} from '@/shared/components';
import { colors } from '@/shared/theme/colors';

type CategoryFilter = 'todos' | 'hospital' | 'policia' | 'banco' | 'generales';

interface MessageTemplate {
  id: string;
  category: CategoryFilter;
  title: string;
  text: string;
  icon: string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'h1',
    category: 'hospital',
    title: 'Solicitud de Cita Médica / Recepción',
    text: 'Hola, soy una persona Sorda. Vengo a mi cita médica programada. Aquí está mi identificación.',
    icon: '🏥',
  },
  {
    id: 'h2',
    category: 'hospital',
    title: 'Ventanilla de Farmacia y Medicamentos',
    text: 'Hola, necesito retirar las medicinas de mi receta. ¿Me indica cuánto debo esperar?',
    icon: '💊',
  },
  {
    id: 'p1',
    category: 'policia',
    title: 'Identificación y Control Policial',
    text: 'Buenas. Soy una persona Sorda y me comunico por LESCOnect. Aquí está mi cédula.',
    icon: '👮',
  },
  {
    id: 'p2',
    category: 'policia',
    title: 'Reporte de Extravío o Robo',
    text: 'Deseo presentar un reporte formal por extravío de documentos personales.',
    icon: '📜',
  },
  {
    id: 'b1',
    category: 'banco',
    title: 'Atención en Caja / Retiros',
    text: 'Hola. Vengo a realizar una transacción bancaria en caja. Por favor comuníquese por escrito.',
    icon: '🏦',
  },
  {
    id: 'g1',
    category: 'generales',
    title: 'Dirección o Consulta en Calle',
    text: 'Hola, disculpe la molestia. ¿Podría indicarme dónde se encuentra la parada de buses más cercana?',
    icon: '📍',
  },
];

export function QuickMessagesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('todos');
  const [activeTemplate, setActiveTemplate] = useState<MessageTemplate | null>(null);

  const filteredTemplates =
    selectedCategory === 'todos'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleShowFullMessage = (template: MessageTemplate) => {
    setActiveTemplate(template);
    Alert.alert(
      `📱 Muestra esta pantalla en ventanilla`,
      `"${template.text}"`,
      [{ text: 'Cerrar', onPress: () => setActiveTemplate(null) }]
    );
  };

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <AppHeader
        title="Trámites Rápidos"
        subtitle="Comunicación visual instantánea en ventanillas"
        showUserBadge={false}
      />

      <View style={styles.content}>
        {/* Chips Filtros por Categoría */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setSelectedCategory('todos')}
            style={[
              styles.filterChip,
              selectedCategory === 'todos' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'todos' && styles.filterChipTextActive,
              ]}>
              Todos
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('hospital')}
            style={[
              styles.filterChip,
              selectedCategory === 'hospital' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'hospital' && styles.filterChipTextActive,
              ]}>
              🏥 Salud
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('policia')}
            style={[
              styles.filterChip,
              selectedCategory === 'policia' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'policia' && styles.filterChipTextActive,
              ]}>
              👮 Policía
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('banco')}
            style={[
              styles.filterChip,
              selectedCategory === 'banco' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'banco' && styles.filterChipTextActive,
              ]}>
              🏦 Banco
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedCategory('generales')}
            style={[
              styles.filterChip,
              selectedCategory === 'generales' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'generales' && styles.filterChipTextActive,
              ]}>
              💬 General
            </Text>
          </Pressable>
        </View>

        {/* Banner Informativo Ventanilla */}
        <AppCard style={styles.infoBanner}>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>💡</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
              <Text style={styles.infoSub}>
                Selecciona la tarjeta del trámite y muéstrala en grande al funcionario o cajero.
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Lista de Tarjetas de Trámites */}
        <View style={styles.templatesList}>
          {filteredTemplates.map((item) => (
            <AppCard
              key={item.id}
              style={styles.templateCard}
              onPress={() => handleShowFullMessage(item)}>
              <View style={styles.templateHeader}>
                <Text style={styles.templateIcon}>{item.icon}</Text>
                <View style={styles.templateTextFlex}>
                  <Text style={styles.templateTitle}>{item.title}</Text>
                  <Text style={styles.templateBody} numberOfLines={2}>
                    "{item.text}"
                  </Text>
                </View>
              </View>

              <View style={styles.templateFooter}>
                <Badge label="Toca para pantalla completa" variant="terracota" />
                <Text style={styles.fullscreenIcon}>⛶</Text>
              </View>
            </AppCard>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  filterChipActive: {
    backgroundColor: '#B5551A',
    borderColor: '#B5551A',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  infoBanner: {
    backgroundColor: '#F3EADA',
    borderColor: '#EAE0D0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
  },
  infoSub: {
    fontSize: 12,
    color: '#7A6E5C',
    marginTop: 2,
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  templateTextFlex: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 4,
  },
  templateBody: {
    fontSize: 13,
    color: '#7A6E5C',
    lineHeight: 18,
    fontWeight: '500',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FBF6EE',
  },
  fullscreenIcon: {
    fontSize: 16,
    color: '#B5551A',
  },
});
