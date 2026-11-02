import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/shared/theme';
import { styles } from '../styles/home.styles';

interface TranslatorHeroCardProps {
  onPressSignsToText?: () => void;
  onPressTextToSigns?: () => void;
  onPressTutorial?: () => void;
  onPressSignsTutorial?: () => void;
  onPressTextTutorial?: () => void;
}

export function TranslatorHeroCard({
  onPressSignsToText,
  onPressTextToSigns,
  onPressTutorial,
  onPressSignsTutorial,
  onPressTextTutorial,
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

          <View style={styles.heroActionRight}>
            <TouchableOpacity
              style={[
                styles.heroTutorialBtn,
                { backgroundColor: Colors.primary.surface, borderColor: Colors.border.subtle },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                if (onPressSignsTutorial) {
                  onPressSignsTutorial();
                } else if (onPressTutorial) {
                  onPressTutorial();
                }
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Ver tutorial de Señas a Voz en LESCO"
            >
              <Text style={styles.heroTutorialIcon}>📹</Text>
            </TouchableOpacity>

            <View style={[styles.heroActionArrow, { backgroundColor: Colors.primary.surface }]}>
              <Text style={[styles.heroActionArrowText, { color: Colors.primary.main }]}>→</Text>
            </View>
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

          <View style={styles.heroActionRight}>
            <TouchableOpacity
              style={[
                styles.heroTutorialBtn,
                { backgroundColor: Colors.secondary.surface, borderColor: Colors.secondary.border },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                if (onPressTextTutorial) {
                  onPressTextTutorial();
                } else if (onPressTutorial) {
                  onPressTutorial();
                }
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Ver tutorial de Voz a Señas en LESCO"
            >
              <Text style={styles.heroTutorialIcon}>📹</Text>
            </TouchableOpacity>

            <View style={[styles.heroActionArrow, { backgroundColor: Colors.secondary.surface }]}>
              <Text style={[styles.heroActionArrowText, { color: Colors.secondary.main }]}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
