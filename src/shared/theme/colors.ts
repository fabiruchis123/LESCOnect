// Paleta "Tierra" — LesConecte, Guía Visual
//
// Regla de contraste (aplicar en cada pantalla):
// - Mínimo AA (4.5:1) en todo texto.
// - AAA (7:1) obligatorio en texto crítico (alertas, errores).
// - NUNCA usar gris medio para texto secundario: usar inkDim (#7A6E5C) como mínimo
//   sobre fondo claro — es el tono más bajo de contraste permitido en este sistema.

export const colors = {
  background: '#FBF6EE',
  surface: '#FFFFFF',
  surface2: '#F3EADA',
  line: '#EAE0D0',

  ink: '#2B241C',      // texto principal
  inkDim: '#7A6E5C',   // texto secundario — piso mínimo de contraste, no bajar de aquí

  terracota: '#B5551A', // acento principal — acción, alerta
  salvia: '#5C7A5C',    // confirmación, subtítulos/CC activo
  coral: '#C0392B',     // errores, alertas críticas — usar con AAA (7:1)

  white: '#FFFFFF',
} as const;

// Modo exterior — variante de alto contraste para uso bajo sol directo
// Fondo claro reforzado, bordes duros de 2px, colores más saturados
export const colorsOutdoorMode = {
  ...colors,
  line: '#000000',        // bordes reforzados (2px en spacing.ts → border.outdoor)
  terracota: '#8F3D0F',   // más saturado
  salvia: '#3D5A3D',
  coral: '#9E2A1D',
} as const;

export type ColorToken = keyof typeof colors;
