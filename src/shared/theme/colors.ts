/**
 * LESCOnect - Paleta Tierra (Design System)
 * Diseñado para alto contraste y visibilidad bajo la luz solar directa.
 */
export const Colors = {
  primary: {
    main: '#B5551A',
    dark: '#9C4410',
    light: '#D46B28',
    surface: '#F3EADA',
    border: '#E6B08A',
  },
  secondary: {
    main: '#5C7A5C',
    dark: '#455E45',
    light: '#7A9A7A',
    surface: '#EBF2EB',
    border: '#C8DAC8',
  },
  background: {
    main: '#FBF6EE',
    card: '#FFFFFF',
    surface: '#F3EADA',
    surfaceMuted: '#EAE0D0',
  },
  text: {
    primary: '#2B241C',
    secondary: '#7A6E5C',
    muted: '#9E9280',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: '#EAE0D0',
    strong: '#D5C7B2',
    primary: '#B5551A',
    secondary: '#C8DAC8',
  },
  emergency: {
    main: '#C0392B',
    dark: '#A93226',
    surface: '#FDEDEC',
    border: '#F5B7B1',
    text: '#922B21',
  },
  categories: {
    hospital: {
      main: '#C0392B',
      surface: '#FDEDEC',
      border: '#F5B7B1',
    },
    policia: {
      main: '#2471A3',
      surface: '#EAF2F8',
      border: '#AED6F1',
    },
    banco: {
      main: '#B7950B',
      surface: '#FEF9E7',
      border: '#F9E79F',
    },
    general: {
      main: '#5C7A5C',
      surface: '#EBF2EB',
      border: '#C8DAC8',
    },
  },
  status: {
    success: '#2E7D32',
    warning: '#F39C12',
    error: '#C0392B',
    info: '#2980B9',
  },
} as const;

export type ColorTokens = typeof Colors;
