// Espaciado, radios y zonas táctiles — LesConecte, Guía Visual

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const radius = {
  card: 14,     // tarjetas: 12–16px según la guía, 14 como punto medio
  cardLarge: 16, // tarjetas grandes / contenedores
  pill: 100,    // etiquetas de estado (badges) — forma píldora
  full: 9999,   // avatares, botones circulares
} as const;

// Zona táctil mínima obligatoria para botones y elementos interactivos
export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;

// Bordes — 1px estándar, 2px reforzado en modo exterior
export const border = {
  standard: 1,   // sobre color line (#EAE0D0) en fondo claro
  outdoor: 2,    // modo exterior, alto contraste bajo sol directo
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

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
