import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/home.styles';

interface EmergencyBannerProps {
  onPress?: () => void;
  onPressTutorial?: () => void;
}

export function EmergencyBanner({ onPress, onPressTutorial }: EmergencyBannerProps) {
  return (
    <View style={styles.emergencyBanner}>
      <TouchableOpacity
        style={styles.emergencyLeft}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Módulo de Emergencias SOS 911"
      >
        <View style={styles.emergencyIconBox}>
          <Text style={styles.emergencyEmoji}>🚨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.emergencyTitleRow}>
            <Text style={styles.emergencyTitle}>Emergencias</Text>
            <View style={styles.emergencySosTag}>
              <Text style={styles.emergencySosTagText}>SOS</Text>
            </View>
          </View>
          <Text style={styles.emergencySubtitle}>Policía, Bomberos, Ambulancia</Text>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Botón LESCO para el módulo de emergencias */}
        <TouchableOpacity
          onPress={onPressTutorial}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Ver explicación de emergencias en señas LESCO"
        >
          <Text style={{ fontSize: 14 }}>📹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyArrowCircle}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyArrowText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
