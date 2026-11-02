import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/shared/theme';
import { styles } from '../styles/home.styles';

interface SecondaryActionsGridProps {
  onPressHistory?: () => void;
  onPressHelp?: () => void;
  onPressHistoryTutorial?: () => void;
  onPressHelpTutorial?: () => void;
}

export function SecondaryActionsGrid({
  onPressHistory,
  onPressHelp,
  onPressHistoryTutorial,
  onPressHelpTutorial,
}: SecondaryActionsGridProps) {
  return (
    <View style={styles.secondaryRow}>
      {/* Historial */}
      <TouchableOpacity
        style={styles.secondaryCard}
        onPress={onPressHistory}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir al Historial de conversaciones"
      >
        <View style={styles.secondaryCardTop}>
          <View
            style={[
              styles.secondaryIconBox,
              { backgroundColor: Colors.primary.surface, borderColor: Colors.border.subtle },
            ]}
          >
            <Text style={styles.secondaryEmoji}>📜</Text>
          </View>

          <View style={styles.secondaryTopRight}>
            <TouchableOpacity
              style={[
                styles.secondaryTutorialBtn,
                { backgroundColor: Colors.primary.surface, borderColor: Colors.border.subtle },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                onPressHistoryTutorial?.();
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Ver tutorial de Historial en LESCO"
            >
              <Text style={styles.secondaryTutorialIcon}>📹</Text>
            </TouchableOpacity>

            <Text style={styles.secondaryArrow}>↗</Text>
          </View>
        </View>

        <View>
          <Text style={styles.secondaryTitle}>Historial</Text>
          <Text style={styles.secondaryDesc}>Tus conversaciones</Text>
        </View>
      </TouchableOpacity>

      {/* Ayuda LESCO */}
      <TouchableOpacity
        style={styles.secondaryCard}
        onPress={onPressHelp}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir a Ayuda LESCO y tutoriales"
      >
        <View style={styles.secondaryCardTop}>
          <View
            style={[
              styles.secondaryIconBox,
              { backgroundColor: Colors.secondary.surface, borderColor: Colors.secondary.border },
            ]}
          >
            <Text style={styles.secondaryEmoji}>💡</Text>
          </View>

          <View style={styles.secondaryTopRight}>
            <TouchableOpacity
              style={[
                styles.secondaryTutorialBtn,
                { backgroundColor: Colors.secondary.surface, borderColor: Colors.secondary.border },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                onPressHelpTutorial?.();
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Ver tutorial de Ayuda LESCO"
            >
              <Text style={styles.secondaryTutorialIcon}>📹</Text>
            </TouchableOpacity>

            <Text style={styles.secondaryArrow}>↗</Text>
          </View>
        </View>

        <View>
          <Text style={styles.secondaryTitle}>Ayuda LESCO</Text>
          <Text style={styles.secondaryDesc}>Videos y tutoriales</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
