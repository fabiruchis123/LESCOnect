export const fontFamily = {
  displayExtraBold: 'Lexend_800ExtraBold',
  displaySemiBold: 'Lexend_600SemiBold',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
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

export const lineHeight = {
  tight: 1.2,
  body: 1.5,
  relaxed: 1.6,
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

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 26,
    hero: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export type TypographyTokens = typeof Typography;
