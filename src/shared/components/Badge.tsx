import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

export type BadgeVariant = 'salvia' | 'terracota' | 'emergency' | 'neutral' | 'dark';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'salvia',
  showDot = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'salvia':
        return {
          container: styles.salviaBg,
          text: styles.salviaText,
          dot: styles.salviaDot,
        };
      case 'terracota':
        return {
          container: styles.terracotaBg,
          text: styles.terracotaText,
          dot: styles.terracotaDot,
        };
      case 'emergency':
        return {
          container: styles.emergencyBg,
          text: styles.emergencyText,
          dot: styles.emergencyDot,
        };
      case 'dark':
        return {
          container: styles.darkBg,
          text: styles.darkText,
          dot: styles.darkDot,
        };
      case 'neutral':
      default:
        return {
          container: styles.neutralBg,
          text: styles.neutralText,
          dot: styles.neutralDot,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.container, vStyles.container, style]}>
      {showDot && <View style={[styles.dot, vStyles.dot]} />}
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[styles.text, vStyles.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Salvia Variant (Verde LESCO activo)
  salviaBg: {
    backgroundColor: '#EBF2EB',
    borderColor: '#C8DAC8',
  },
  salviaText: {
    color: '#5C7A5C',
  },
  salviaDot: {
    backgroundColor: '#5C7A5C',
  },

  // Terracota Variant (Naranja Cálido)
  terracotaBg: {
    backgroundColor: '#F3EADA',
    borderColor: '#EAE0D0',
  },
  terracotaText: {
    color: '#B5551A',
  },
  terracotaDot: {
    backgroundColor: '#B5551A',
  },

  // Emergency Variant (Rojo Socorro)
  emergencyBg: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
  },
  emergencyText: {
    color: '#C0392B',
  },
  emergencyDot: {
    backgroundColor: '#C0392B',
  },

  // Neutral Variant
  neutralBg: {
    backgroundColor: '#F3EADA',
    borderColor: '#EAE0D0',
  },
  neutralText: {
    color: '#7A6E5C',
  },
  neutralDot: {
    backgroundColor: '#7A6E5C',
  },

  // Dark Translucent Variant
  darkBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  darkText: {
    color: '#F3EADA',
  },
  darkDot: {
    backgroundColor: '#FFD700',
  },
});
