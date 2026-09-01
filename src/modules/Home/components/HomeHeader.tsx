import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/home.styles';

interface HomeHeaderProps {
  userName?: string;
  onPressProfile?: () => void;
  onPressTutorial?: () => void;
}

export function HomeHeader({ userName = 'Pamela', onPressProfile, onPressTutorial }: HomeHeaderProps) {
  const initial = (userName[0] || 'P').toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View style={styles.badgeSalvia}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>LESCO Activo</Text>
          </View>

          {/* Botón LESCO para quienes no leen español */}
          <TouchableOpacity
            onPress={onPressTutorial}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F3EADA',
              borderColor: '#EAE0D0',
              borderWidth: 1,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
            }}
            accessibilityLabel="Ver explicación de la app en señas LESCO"
          >
            <Text style={{ fontSize: 11, marginRight: 3 }}>📹</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#B5551A' }}>LESCO</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greetingTitle}>¡Hola, {userName}! 👋</Text>
        <Text style={styles.greetingSubtitle}>Comunícate sin barreras</Text>
      </View>

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onPressProfile}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir al perfil de usuario"
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </TouchableOpacity>
    </View>
  );
}
