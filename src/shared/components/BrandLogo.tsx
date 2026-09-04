import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export type BrandLogoVariant = 'wordmark' | 'hands';

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  height?: number;
  width?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover';
  accessibilityLabel?: string;
}

// Relación de aspecto natural del wordmark tipográfico recortado (455 x 143 ≈ 3.18)
const WORDMARK_ASPECT_RATIO = 3.18;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'wordmark',
  height,
  width,
  style,
  containerStyle,
  resizeMode = 'contain',
  accessibilityLabel,
}) => {
  const isHands = variant === 'hands';

  // Dimensiones predeterminadas equilibradas para móvil
  const defaultHeight = isHands ? 48 : 28;
  const resolvedHeight = height ?? defaultHeight;
  const resolvedWidth =
    width ?? (isHands ? resolvedHeight : Math.round(resolvedHeight * WORDMARK_ASPECT_RATIO));

  const imageSource = isHands
    ? require('../../../assets/LESCOnect-Logo-manos.png')
    : require('../../../assets/images/LESCOnect-letra-tight.png');

  const defaultLabel = isHands
    ? 'Logotipo de LESCOnect: Manos comunicando en señas'
    : 'LESCOnect';

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={imageSource}
        style={[
          {
            width: resolvedWidth,
            height: resolvedHeight,
          },
          style,
        ]}
        resizeMode={resizeMode}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || defaultLabel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
