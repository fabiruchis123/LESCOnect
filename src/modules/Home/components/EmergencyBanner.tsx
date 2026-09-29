import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/home.styles';

interface EmergencyBannerProps {
  onPress?: () => void;
  onPressTutorial?: () => void;
}

export function EmergencyBanner({ onPress, onPressTutorial }: EmergencyBannerProps) {
  return (
    <TouchableOpacity
      style={styles.emergencyBanner}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Módulo de Emergencias SOS 911"
    >
      <View style={styles.emergencyIconBox}>
        <Text style={styles.emergencyEmoji}>🚨</Text>
      </View>

      <View style={styles.emergencyTextBox}>
        <Text style={styles.emergencyTitle}>Emergencias</Text>
      </View>

      <View style={styles.emergencyRightActions}>
        <TouchableOpacity
          style={styles.emergencyVideoButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onPressTutorial?.();
          }}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Ver tutorial de Emergencias en LESCO"
        >
          <Text style={styles.emergencyVideoIcon}>📹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyArrowCircle}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ir a Emergencias"
        >
          <Text style={styles.emergencyArrowText}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
