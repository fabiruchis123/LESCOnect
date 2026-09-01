import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type CategoryTheme = 'hospital' | 'policia' | 'banco' | 'emergencia' | 'general';

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  countBadge?: string;
  theme?: CategoryTheme;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  subtitle,
  icon,
  countBadge,
  theme = 'general',
  onPress,
}) => {
  const getThemeStyles = () => {
    switch (theme) {
      case 'hospital':
        return {
          container: styles.hospitalBg,
          borderColor: '#A3E4D7',
          iconBg: '#E8F8F5',
        };
      case 'policia':
        return {
          container: styles.policiaBg,
          borderColor: '#AED6F1',
          iconBg: '#EAF2F8',
        };
      case 'banco':
        return {
          container: styles.bancoBg,
          borderColor: '#F9E79F',
          iconBg: '#FEF9E7',
        };
      case 'emergencia':
        return {
          container: styles.emergenciaBg,
          borderColor: '#F5B7B1',
          iconBg: '#FDEDEC',
        };
      case 'general':
      default:
        return {
          container: styles.generalBg,
          borderColor: '#EAE0D0',
          iconBg: '#F3EADA',
        };
    }
  };

  const tStyles = getThemeStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        tStyles.container,
        { borderColor: tStyles.borderColor },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconBox, { backgroundColor: tStyles.iconBg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{title}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
      </View>

      {countBadge ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{countBadge}</Text>
        </View>
      ) : (
        <View style={styles.arrowBox}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 12,
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B5551A',
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  arrowText: {
    fontSize: 16,
    color: '#B5551A',
    fontWeight: '700',
  },

  // Themes
  hospitalBg: {
    backgroundColor: '#FFFFFF',
  },
  policiaBg: {
    backgroundColor: '#FFFFFF',
  },
  bancoBg: {
    backgroundColor: '#FFFFFF',
  },
  emergenciaBg: {
    backgroundColor: '#FFFFFF',
  },
  generalBg: {
    backgroundColor: '#FFFFFF',
  },
});
