// Set de íconos — LesConecte, Guía Visual
//
// Reglas de la guía:
// - Estilo lineal, trazo 2–2.4px, esquinas redondeadas, consistente en todo el set.
// - SIEMPRE acompañado de texto — nunca ícono aislado.
// - Reemplazar metáforas auditivas por visuales (ver mapeo abajo).
//
// Instalar: npx expo install lucide-react-native react-native-svg
//
// lucide-react-native no expone strokeWidth por token global — pasar
// strokeWidth={2.2} en cada <Icon /> para cumplir la guía (2–2.4px).

import {
  Captions,
  Hand,
  AlertTriangle,
  Vibrate,
  Video,
  UserCheck,
  Users,
  PhoneCall,
} from 'lucide-react-native';

export const ICON_STROKE_WIDTH = 2.2; // dentro del rango 2–2.4px de la guía

// Set base sugerido por la guía — comunicación visual, sin depender de audio
export const baseIconSet = {
  subtitulos: Captions,        // "Altavoz" → subtítulos (CC)
  lenguaDeSenas: Hand,
  alertaVisual: AlertTriangle, // "Notificación sonora" → alerta visual / pulso de luz
  vibracion: Vibrate,
  videollamada: Video,
  interpreteEnLinea: UserCheck,
  comunidad: Users,
  historialLlamadas: PhoneCall,
} as const;

// Reemplazos explícitos de metáforas auditivas (documentado en la guía)
export const auditoryReplacements = {
  altavoz: 'subtitulos',        // usar baseIconSet.subtitulos en vez de un ícono de altavoz
  notificacionSonora: 'vibracion', // o alertaVisual, según el contexto (vibración vs pulso de luz)
} as const;

// Elemento de firma del sistema: "pulso de anillos expandiéndose"
// (traducción visual de una onda de sonido — llamadas entrantes, notificaciones)
// NO es un ícono estático de lucide: requiere un componente animado propio.
// Sugerencia: crear src/shared/components/SignalPulse.tsx con react-native-reanimated,
// 2-3 círculos concéntricos con opacity/scale en loop, color = colors.terracota o coral
// según urgencia. Usar en cualquier punto que reemplace una señal auditiva
// (llamada entrante, notificación push visual).

// Ilustraciones del prototipo original — copiar los .png a assets/icons/
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
