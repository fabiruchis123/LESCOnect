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
          <Text style={styles.bentoHeaderTitle}>Trámites Rápidos</Text>
        </View>

        <TouchableOpacity
          style={styles.bentoViewAllBtn}
          onPress={onPressViewAll}
          activeOpacity={0.7}
          accessibilityLabel="Ver todos los trámites rápidos"
        >
          <Text style={styles.bentoViewAllText}>Ver todos →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bentoGrid}>
        {CATEGORIES.map((cat) => {
          const catColors = Colors.categories[cat.themeKey];
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.bentoGridItem}
              onPress={() => onPressCategory?.(cat.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cat.title}
            >
              <View
                style={[
                  styles.bentoItemIconBox,
                  { backgroundColor: catColors.surface, borderColor: catColors.border },
                ]}
              >
                <Text style={styles.bentoItemEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.bentoItemTitle} numberOfLines={1}>
                {cat.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
