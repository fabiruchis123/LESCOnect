import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'emergency' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryBg,
          text: styles.secondaryText,
        };
      case 'emergency':
        return {
          container: styles.emergencyBg,
          text: styles.emergencyText,
        };
      case 'ghost':
        return {
          container: styles.ghostBg,
          text: styles.ghostText,
        };
      case 'outline':
        return {
          container: styles.outlineBg,
          text: styles.outlineText,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryBg,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: styles.smContainer,
          text: styles.smText,
        };
      case 'lg':
        return {
          container: styles.lgContainer,
          text: styles.lgText,
        };
      case 'md':
      default:
        return {
          container: styles.mdContainer,
          text: styles.mdText,
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.baseButton,
        vStyles.container,
        sStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.terracota : '#FFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
          <Text style={[styles.baseText, vStyles.text, sStyles.text, textStyle]}>
            {title}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  smContainer: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  smText: {
    fontSize: 13,
  },
  mdContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  mdText: {
    fontSize: 15,
  },
  lgContainer: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  lgText: {
    fontSize: 17,
  },

  // Primary
  primaryBg: {
    backgroundColor: '#B5551A',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    color: '#FFFFFF',
  },

  // Secondary
  secondaryBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
  },
  secondaryText: {
    color: '#2B241C',
  },

  // Emergency
  emergencyBg: {
    backgroundColor: '#C0392B',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyText: {
    color: '#FFFFFF',
  },

  // Ghost
  ghostBg: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#B5551A',
  },

  // Outline
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#B5551A',
  },
  outlineText: {
    color: '#B5551A',
  },
});
