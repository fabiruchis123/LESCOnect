export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  card: 14,
  cardLarge: 16,
  pill: 100,
  full: 9999,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 9999,
} as const;

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;

export const border = {
  standard: 1,
  outdoor: 2,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const Shadows = {
  subtle: {
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryGlow: {
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  emergencyGlow: {
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
