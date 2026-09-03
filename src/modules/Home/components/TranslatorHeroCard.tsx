import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/shared/theme';
import { styles } from '../styles/home.styles';

interface TranslatorHeroCardProps {
  onPressSignsToText?: () => void;
  onPressTextToSigns?: () => void;
  onPressTutorial?: () => void;
}

export function TranslatorHeroCard({
  onPressSignsToText,
  onPressTextToSigns,
  onPressTutorial,
}: TranslatorHeroCardProps) {
  return (
    <View style={styles.heroCard}>
      {/* Título Central */}
      <View style={styles.heroTitleRow}>
        <View style={styles.heroIconCircle}>
          <Text style={styles.heroIconEmoji}>🤟</Text>
        </View>
        <Text style={styles.heroTitleText}>Traductor LESCO</Text>
      </View>

      {/* Botones Apilados Verticalmente */}
      <View style={styles.heroActionsContainer}>
        {/* 1. Señas a Voz */}
        <TouchableOpacity
          style={styles.heroActionButton}
          onPress={onPressSignsToText}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Traducción de Señas a Voz con cámara"
        >
          <View style={styles.heroActionLeft}>
            <View style={[styles.heroActionIconBox, { backgroundColor: Colors.primary.surface }]}>
              <Text style={styles.heroActionEmoji}>📷</Text>
            </View>
            <Text style={styles.heroActionTitle}>Señas a Voz</Text>
          </View>
          <View style={[styles.heroActionArrow, { backgroundColor: Colors.primary.surface }]}>
            <Text style={[styles.heroActionArrowText, { color: Colors.primary.main }]}>→</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Voz a Señas */}
        <TouchableOpacity
          style={styles.heroActionButton}
          onPress={onPressTextToSigns}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Traducción de Voz a Señas con dictado"
        >
          <View style={styles.heroActionLeft}>
            <View style={[styles.heroActionIconBox, { backgroundColor: Colors.secondary.surface }]}>
              <Text style={styles.heroActionEmoji}>🎙️</Text>
            </View>
            <Text style={styles.heroActionTitle}>Voz a Señas</Text>
          </View>
          <View style={[styles.heroActionArrow, { backgroundColor: Colors.secondary.surface }]}>
            <Text style={[styles.heroActionArrowText, { color: Colors.secondary.main }]}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
