// Set de íconos — LesConecte, Guía Visual (Paleta Tierra)
// Comunicación visual accesible sin dependencias pesadas de empaquetado

export const ICON_STROKE_WIDTH = 2.2;

// Set base de comunicación visual
export const baseIconSet = {
  subtitulos: '💬',
  lenguaDeSenas: '🤟',
  alertaVisual: '⚠️',
  vibracion: '📳',
  videollamada: '📹',
  interpreteEnLinea: '🧑‍💼',
  comunidad: '👥',
  historialLlamadas: '📜',
} as const;

// Reemplazos explícitos de metáforas auditivas
export const auditoryReplacements = {
  altavoz: 'subtitulos',
  notificacionSonora: 'vibracion',
} as const;

// Ilustraciones del prototipo original
export const illustrations = {
  icono1: require('../../../assets/icons/Icono1.png'),
  icono2: require('../../../assets/icons/Icono2.png'),
  growth: require('../../../assets/icons/growth.png'),
  grua: require('../../../assets/icons/grua.png'),
  hospital: require('../../../assets/icons/hospital.png'),
  palm: require('../../../assets/icons/palm.png'),
  question: require('../../../assets/icons/question.png'),
  shield: require('../../../assets/icons/shield.png'),
} as const;
