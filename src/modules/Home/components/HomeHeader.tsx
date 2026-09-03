import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BrandLogo } from '@/shared/components';
import { styles } from '../styles/home.styles';

interface HomeHeaderProps {
  userName?: string;
  onPressProfile?: () => void;
  onPressTutorial?: () => void;
}

export function HomeHeader({ userName = 'Génesis', onPressProfile, onPressTutorial }: HomeHeaderProps) {
  const firstName = userName.trim().split(/\s+/)[0] || 'Génesis';
  const initial = (firstName[0] || 'G').toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <BrandLogo
          variant="wordmark"
          height={26}
          containerStyle={styles.headerBrandBox}
        />
        <Text style={styles.greetingTitle} numberOfLines={1}>¡Hola, {firstName}! 👋</Text>
      </View>

      <View style={styles.headerRight}>
        {/* Botón Video LESCO junto al botón de perfil */}
        <TouchableOpacity
          style={styles.headerVideoButton}
          onPress={onPressTutorial}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Ver explicación de la app en señas LESCO"
        >
          <Text style={styles.headerVideoIcon}>📹</Text>
        </TouchableOpacity>

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
    </View>
  );
}
