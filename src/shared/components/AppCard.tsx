import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../theme/colors';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  elevation?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  backgroundColor = '#FFFFFF',
  borderColor = '#EAE0D0',
  borderWidth = 1.5,
  padding = 16,
  borderRadius = 20,
  style,
  elevation = 2,
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderWidth,
    padding,
    borderRadius,
  };

  if (!onPress) {
    return (
      <View style={[styles.card, cardStyle, elevation > 0 && styles.shadow, style]}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        cardStyle,
        elevation > 0 && styles.shadow,
        pressed && styles.pressed,
        style,
      ]}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
});
