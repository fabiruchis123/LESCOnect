import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/shared/theme';
import { styles } from '../styles/home.styles';
import { QuickMessageCategory } from '../types';

const CATEGORIES: QuickMessageCategory[] = [
  { id: 'hospital', title: 'Hospital', subtitle: 'Salud y dolor', icon: '🏥', themeKey: 'hospital' },
  { id: 'policia', title: 'Policía', subtitle: 'Ayuda y trámite', icon: '👮', themeKey: 'policia' },
  { id: 'banco', title: 'Banco', subtitle: 'Cuentas y pagos', icon: '🏦', themeKey: 'banco' },
  { id: 'general', title: 'General', subtitle: 'Saludos y gracias', icon: '🗣️', themeKey: 'general' },
];

interface QuickMessagesBentoProps {
  onPressViewAll?: () => void;
  onPressCategory?: (categoryId: string) => void;
  onPressTutorial?: (categoryId: string) => void;
}

export function QuickMessagesBento({
  onPressViewAll,
  onPressCategory,
  onPressTutorial,
}: QuickMessagesBentoProps) {
  return (
    <View style={styles.bentoCard}>
      {/* Header */}
      <View style={styles.bentoHeader}>
        <View style={styles.bentoHeaderLeft}>
          <View style={styles.bentoHeaderIconBox}>
            <Text style={styles.bentoHeaderEmoji}>💬</Text>
          </View>
          <View>
            <Text style={styles.bentoHeaderTitle}>Mensajes Rápidos</Text>
            <Text style={styles.bentoHeaderSubtitle}>Frases directas por situación</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bentoViewAllBtn}
          onPress={onPressViewAll}
          activeOpacity={0.7}
          accessibilityLabel="Ver todos los mensajes rápidos"
        >
          <Text style={styles.bentoViewAllText}>Ver todos →</Text>
        </TouchableOpacity>
      </View>

      {/* Grid 2x2 */}
      <View style={styles.bentoGrid}>
        {CATEGORIES.map((cat) => {
          const catColors = Colors.categories[cat.themeKey];
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.bentoGridItem}
              onPress={() => onPressCategory?.(cat.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.bentoItemIconBox,
                  { backgroundColor: catColors.surface, borderColor: catColors.border },
                ]}
              >
                <Text style={styles.bentoItemEmoji}>{cat.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.bentoItemTitle} numberOfLines={1}>
                  {cat.title}
                </Text>
                <Text style={styles.bentoItemSubtitle} numberOfLines={1}>
                  {cat.subtitle}
                </Text>
              </View>

              {/* Botón LESCO individual */}
              <TouchableOpacity
                onPress={() => onPressTutorial?.(cat.id)}
                style={{
                  padding: 4,
                  borderRadius: 6,
                  backgroundColor: 'rgba(0,0,0,0.04)',
                }}
                accessibilityLabel={`Ver señas de ${cat.title}`}
              >
                <Text style={{ fontSize: 12 }}>📹</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
