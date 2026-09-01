// Tipografía — LesConecte, Guía Visual (Paleta Tierra)
//
// Requiere instalar (fuentes de Google Fonts vía Expo):
//   npx expo install expo-font \
//     @expo-google-fonts/lexend \
//     @expo-google-fonts/atkinson-hyperlegible \
//     @expo-google-fonts/inter
//
// Cargar en el layout raíz con useFonts() antes de renderizar la app:
//   Lexend_600SemiBold, Lexend_800ExtraBold,
//   AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold,
//   Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold

export const fontFamily = {
  // Titulares — Lexend 800 ExtraBold
  displayExtraBold: 'Lexend_800ExtraBold',
  // Subtítulos — Lexend 600 SemiBold
  displaySemiBold: 'Lexend_600SemiBold',
  // Cuerpo de texto — Atkinson Hyperlegible (máxima distinción entre caracteres)
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
  // Interfaz / datos (timestamps, etiquetas, metadatos) — Inter
  utility: 'Inter_400Regular',
  utilityMedium: 'Inter_500Medium',
  utilitySemiBold: 'Inter_600SemiBold',
  utilityBold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

// Interlineado de cuerpo: 1.4–1.6 según la guía
export const lineHeight = {
  tight: 1.2,   // titulares
  body: 1.5,    // cuerpo de texto — punto medio del rango 1.4-1.6
  relaxed: 1.6, // párrafos largos
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
  h2: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  h3: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.body,
  },
  bodyBold: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.body,
  },
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.body,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.body,
  },
  utility: {
    fontFamily: fontFamily.utility,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.body,
  },
} as const;

export type TypographyToken = keyof typeof typography;
