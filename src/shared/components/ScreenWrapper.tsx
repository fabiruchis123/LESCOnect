import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  showBottomInset?: boolean;
}

/**
 * ScreenWrapper - Contenedor base para pantallas móviles en LESCOnect.
 * Garantiza áreas seguras (SafeAreaView), fondo unificado #FBF6EE y márgenes táctiles
 * para dispositivos físicos y APKs.
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  backgroundColor = colors.background,
  headerSlot,
  footerSlot,
  showBottomInset = true,
}) => {
  const insets = useSafeAreaInsets();

  const containerPaddingTop = { paddingTop: insets.top };
  const containerPaddingBottom = showBottomInset
    ? { paddingBottom: Math.max(insets.bottom, 16) }
    : { paddingBottom: 0 };

  return (
    <View style={[styles.outerContainer, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

      {/* Header fijo opcional (Sticky AppHeader) */}
      {headerSlot ? (
        <View style={containerPaddingTop}>{headerSlot}</View>
      ) : null}

      {/* Cuerpo principal (Scrollable o Estático) */}
      {scrollable ? (
        <ScrollView
          style={[styles.scrollView, style]}
          contentContainerStyle={[
            styles.scrollContent,
            !headerSlot && containerPaddingTop,
            containerPaddingBottom,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.staticContent,
            !headerSlot && containerPaddingTop,
            containerPaddingBottom,
            style,
          ]}>
          {children}
        </View>
      )}

      {/* Footer / Barra inferior opcional */}
      {footerSlot ? (
        <View style={containerPaddingBottom}>{footerSlot}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});
