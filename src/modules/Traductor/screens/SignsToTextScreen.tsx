import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import { CameraView, CameraType, useCameraPermissions } from '../components/CameraWrapper';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { speechService } from '@/shared/utils/speech';
import { recognizeLescoSignFromBase64, recognizeDynamicLescoSign } from '../services/translatorService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =========================================================================
// 1. DICCIONARIO Y VOCABULARIO LESCO (COSTA RICA)
// =========================================================================
export interface LescoSignItem {
  id: string;
  letter: string;
  name: string;
  description: string;
  tip: string;
  difficulty: 'Fácil' | 'Media' | 'Avanzada';
  icon: string;
  category: 'alfabeto' | 'palabra';
}

export const LESCO_DICTIONARY: LescoSignItem[] = [
  // --- ABECEDARIO ---
  {
    id: 'A',
    letter: 'A',
    name: 'Letra A',
    description: 'Puño cerrado con el pulgar erguido a un lado del dedo índice.',
    tip: 'Mantén los 4 dedos flexionados y el pulgar erguido al lateral.',
    difficulty: 'Fácil',
    icon: '✊',
    category: 'alfabeto',
  },
  {
    id: 'B',
    letter: 'B',
    name: 'Letra B',
    description: 'Cuatro dedos estirados juntos hacia arriba y el pulgar doblado sobre la palma.',
    tip: 'Junta los cuatro dedos sin separarlos y dobla el pulgar al centro.',
    difficulty: 'Fácil',
    icon: '✋',
    category: 'alfabeto',
  },
  {
    id: 'C',
    letter: 'C',
    name: 'Letra C',
    description: 'Mano curvada en semicírculo formando la silueta de una letra C.',
    tip: 'Curva todos los dedos de forma uniforme hacia el pulgar.',
    difficulty: 'Fácil',
    icon: '🤏',
    category: 'alfabeto',
  },
  {
    id: 'CH',
    letter: 'CH',
    name: 'Letra CH',
    description: 'Dedos índice y medio extendidos juntos horizontalmente señalando hacia el lateral.',
    tip: 'Dedos juntos apuntando hacia un lado, pulgar sosteniendo anular y meñique.',
    difficulty: 'Media',
    icon: '👉',
    category: 'alfabeto',
  },
  {
    id: 'D',
    letter: 'D',
    name: 'Letra D',
    description: 'Dedo índice apuntando hacia arriba; los demás dedos tocan el pulgar formando un círculo.',
    tip: 'Solo el dedo índice debe estar completamente estirado verticalmente.',
    difficulty: 'Media',
    icon: '☝️',
    category: 'alfabeto',
  },
  {
    id: 'E',
    letter: 'E',
    name: 'Letra E',
    description: 'Dedos doblados hacia abajo con las yemas apoyadas sobre el pulgar doblado.',
    tip: 'Las yemas de los 4 dedos descansan sobre el borde horizontal del pulgar.',
    difficulty: 'Media',
    icon: '✊',
    category: 'alfabeto',
  },
  {
    id: 'F',
    letter: 'F',
    name: 'Letra F',
    description: 'Dedo índice y pulgar unidos por las yemas formando un círculo; los otros tres dedos estirados hacia arriba.',
    tip: 'Mantén medio, anular y meñique bien rectos hacia arriba.',
    difficulty: 'Media',
    icon: '👌',
    category: 'alfabeto',
  },
  {
    id: 'G',
    letter: 'G',
    name: 'Letra G',
    description: 'Dedo índice extendido horizontalmente hacia el lado y pulgar paralelo.',
    tip: 'Apunta el índice hacia el lado con el pulgar extendido en la misma dirección.',
    difficulty: 'Media',
    icon: '👉',
    category: 'alfabeto',
  },
  {
    id: 'H',
    letter: 'H',
    name: 'Letra H',
    description: 'Dedos índice y medio extendidos juntos horizontalmente hacia el lado.',
    tip: 'Dos dedos estirados y pegados apuntando en dirección horizontal.',
    difficulty: 'Media',
    icon: '👉',
    category: 'alfabeto',
  },
  {
    id: 'I',
    letter: 'I',
    name: 'Letra I',
    description: 'Dedo meñique estirado hacia arriba; los demás dedos cerrados en puño con el pulgar encima.',
    tip: 'Solo el dedo más pequeño queda levantado bien recto.',
    difficulty: 'Fácil',
    icon: '🤙',
    category: 'alfabeto',
  },
  {
    id: 'J',
    letter: 'J',
    name: 'Letra J',
    description: 'Dedo meñique estirado hacia arriba dibujando un trazo de J en el aire.',
    tip: 'Mueve el meñique trazando una curva hacia adentro como un anzuelo.',
    difficulty: 'Media',
    icon: '🤙',
    category: 'alfabeto',
  },
  {
    id: 'K',
    letter: 'K',
    name: 'Letra K',
    description: 'Dedos índice y medio en V con el pulgar apoyado entre ambos en el centro.',
    tip: 'Índice y medio separados hacia arriba con el pulgar asomando en medio.',
    difficulty: 'Media',
    icon: '✌️',
    category: 'alfabeto',
  },
  {
    id: 'L',
    letter: 'L',
    name: 'Letra L',
    description: 'Dedo índice apuntando arriba y pulgar abierto formando un ángulo recto en "L".',
    tip: 'Extiende bien el pulgar hacia el lado e índice hacia arriba en ángulo de 90°.',
    difficulty: 'Fácil',
    icon: '👆',
    category: 'alfabeto',
  },
  {
    id: 'LL',
    letter: 'LL',
    name: 'Letra LL',
    description: 'Forma de la L (índice y pulgar a 90°) desplazándose horizontalmente.',
    tip: 'Haz la seña de la L y deslízala suavemente hacia un lado.',
    difficulty: 'Media',
    icon: '👆',
    category: 'alfabeto',
  },
  {
    id: 'M',
    letter: 'M',
    name: 'Letra M',
    description: 'Tres dedos (índice, medio, anular) doblados hacia abajo sobre el pulgar.',
    tip: 'Tres dedos cuelgan hacia abajo cubriendo el pulgar.',
    difficulty: 'Media',
    icon: '👇',
    category: 'alfabeto',
  },
  {
    id: 'N',
    letter: 'N',
    name: 'Letra N',
    description: 'Dos dedos (índice y medio) doblados hacia abajo sobre el pulgar.',
    tip: 'Dos dedos cuelgan hacia abajo cubriendo el pulgar.',
    difficulty: 'Media',
    icon: '👇',
    category: 'alfabeto',
  },
  {
    id: 'Ñ',
    letter: 'Ñ',
    name: 'Letra Ñ',
    description: 'Misma postura de la N (dos dedos hacia abajo) con movimiento oscilante.',
    tip: 'Haz la N y balancea la mano levemente de izquierda a derecha.',
    difficulty: 'Media',
    icon: '👇',
    category: 'alfabeto',
  },
  {
    id: 'O',
    letter: 'O',
    name: 'Letra O',
    description: 'Todos los dedos unidos por las puntas con el pulgar formando un círculo cerrado.',
    tip: 'Las yemas de los dedos tocan la yema del pulgar cerrando el círculo.',
    difficulty: 'Fácil',
    icon: '👌',
    category: 'alfabeto',
  },
  {
    id: 'P',
    letter: 'P',
    name: 'Letra P',
    description: 'Índice horizontal y dedo medio apuntando verticalmente hacia abajo (K invertida).',
    tip: 'Apunta la mano hacia abajo formando la postura de K orientada al suelo.',
    difficulty: 'Avanzada',
    icon: '👇',
    category: 'alfabeto',
  },
  {
    id: 'Q',
    letter: 'Q',
    name: 'Letra Q',
    description: 'Dedo índice y pulgar apuntando hacia abajo en forma de pinza o gancho.',
    tip: 'Índice y pulgar hacia abajo como si sostuvieras algo hacia el piso.',
    difficulty: 'Media',
    icon: '👇',
    category: 'alfabeto',
  },
  {
    id: 'R',
    letter: 'R',
    name: 'Letra R',
    description: 'Dedos índice y medio estirados hacia arriba y cruzados entre sí.',
    tip: 'Cruza el dedo índice sobre el medio (gesto de buena suerte).',
    difficulty: 'Media',
    icon: '🤞',
    category: 'alfabeto',
  },
  {
    id: 'RR',
    letter: 'RR',
    name: 'Letra RR',
    description: 'Dedos cruzados de la R desplazándose suavemente hacia un lado.',
    tip: 'Mantén la R y desliza la mano horizontalmente.',
    difficulty: 'Media',
    icon: '🤞',
    category: 'alfabeto',
  },
  {
    id: 'S',
    letter: 'S',
    name: 'Letra S',
    description: 'Puño cerrado completo con el pulgar cruzado por el frente de los dedos.',
    tip: 'Cierra los cuatro dedos y envuélvelos con el pulgar por el frente.',
    difficulty: 'Fácil',
    icon: '✊',
    category: 'alfabeto',
  },
  {
    id: 'T',
    letter: 'T',
    name: 'Letra T',
    description: 'Dedos índice y medio extendidos juntos hacia arriba con el pulgar al lado.',
    tip: 'Índice y medio juntos verticales hacia el cielo.',
    difficulty: 'Fácil',
    icon: '✌️',
    category: 'alfabeto',
  },
  {
    id: 'U',
    letter: 'U',
    name: 'Letra U',
    description: 'Dedos índice y medio estirados juntos hacia arriba; pulgar sobre los otros dedos.',
    tip: 'Mantén índice y medio pegados sin separarlos.',
    difficulty: 'Fácil',
    icon: '✌️',
    category: 'alfabeto',
  },
  {
    id: 'V',
    letter: 'V',
    name: 'Letra V',
    description: 'Dedos índice y medio estirados y separados en forma de "V".',
    tip: 'Separa el índice y medio como la señal de paz (V de victoria).',
    difficulty: 'Fácil',
    icon: '✌️',
    category: 'alfabeto',
  },
  {
    id: 'W',
    letter: 'W',
    name: 'Letra W',
    description: 'Dedos índice, medio y anular estirados y separados hacia arriba.',
    tip: 'Forma la letra W con tres dedos hacia arriba y el pulgar sujetando el meñique.',
    difficulty: 'Fácil',
    icon: '🖐️',
    category: 'alfabeto',
  },
  {
    id: 'X',
    letter: 'X',
    name: 'Letra X',
    description: 'Dedo índice doblado en forma de gancho hacia arriba o al frente.',
    tip: 'Flexiona el dedo índice como un garfio con los demás dedos en puño.',
    difficulty: 'Media',
    icon: '☝️',
    category: 'alfabeto',
  },
  {
    id: 'Y',
    letter: 'Y',
    name: 'Letra Y',
    description: 'Dedo pulgar y meñique completamente extendidos; los otros tres dedos cerrados.',
    tip: 'Gesto estilo "shaka" con pulgar y meñique bien abiertos.',
    difficulty: 'Fácil',
    icon: '🤙',
    category: 'alfabeto',
  },
  {
    id: 'Z',
    letter: 'Z',
    name: 'Letra Z',
    description: 'Dedo índice extendido trazando una "Z" en el aire en movimiento de zigzag.',
    tip: 'Dibuja la forma de la Z en el aire con tu dedo índice.',
    difficulty: 'Media',
    icon: '👉',
    category: 'alfabeto',
  },

  // --- PALABRAS FRECUENTES ---
  {
    id: 'HOLA',
    letter: 'HOLA',
    name: '¡Hola!',
    description: 'Palma abierta mirando al frente a la altura de la sien con suave saludo oscilante.',
    tip: 'Muestra la palma abierta y realiza un ligero movimiento de saludo.',
    difficulty: 'Fácil',
    icon: '✋',
    category: 'palabra',
  },
  {
    id: 'GRACIAS',
    letter: 'GRACIAS',
    name: 'Gracias',
    description: 'Mano abierta con yemas tocando el mentón y extendiéndose suavemente hacia el frente.',
    tip: 'Inicia en el mentón y abre la mano hacia la persona.',
    difficulty: 'Fácil',
    icon: '🙏',
    category: 'palabra',
  },
  {
    id: 'POR FAVOR',
    letter: 'POR FAVOR',
    name: 'Por Favor',
    description: 'Palma plana apoyada suavemente sobre el pecho realizando un círculo lento.',
    tip: 'Gesto circular suave y cordial sobre el pecho.',
    difficulty: 'Fácil',
    icon: '🤲',
    category: 'palabra',
  },
  {
    id: 'SI',
    letter: 'SÍ',
    name: 'Sí (Afirmación)',
    description: 'Puño cerrado con movimiento vertical de asentimiento arriba y abajo.',
    tip: 'Mueve el puño arriba y abajo como si asintieras con la cabeza.',
    difficulty: 'Fácil',
    icon: '👍',
    category: 'palabra',
  },
  {
    id: 'NO',
    letter: 'NO',
    name: 'No (Negación)',
    description: 'Dedos índice y medio se unen con el pulgar en movimiento de pinza repetido.',
    tip: 'Junta y separa índice y medio contra el pulgar.',
    difficulty: 'Fácil',
    icon: '👎',
    category: 'palabra',
  },
  {
    id: 'AYUDA',
    letter: 'AYUDA',
    name: 'Ayuda',
    description: 'Puño cerrado con pulgar erguido apoyado sobre la palma abierta subiendo levemente.',
    tip: 'Una mano sostiene a la otra y la eleva suavemente.',
    difficulty: 'Media',
    icon: '🆘',
    category: 'palabra',
  },
];

// Conexiones de 21 landmarks
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// Clasificador Motor 3 LESCO
interface TrajectoryPoint {
  x: number;
  y: number;
  time: number;
}

export function classifyLescoMotor3(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  history: TrajectoryPoint[] = [],
  numHands: number = 1
): { letter: string; confidence: number; isDynamic?: boolean } | null {
  if (!landmarks || landmarks.length < 21) return null;

  // ── Escala de la mano ──────────────────────────────────────────────
  const rawDist = (i: number, j: number) => {
    const dx = landmarks[i].x - landmarks[j].x;
    const dy = landmarks[i].y - landmarks[j].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handScale = rawDist(0, 9);
  if (handScale < 0.03) return null;

  const dist = (i: number, j: number) => rawDist(i, j) / handScale;

  // ── Estado de cada dedo ────────────────────────────────────────────
  const isIndexExt    = dist(8, 0)  > dist(6, 0)  * 1.08 && landmarks[8].y  < landmarks[6].y;
  const isIndexCurled = dist(8, 0)  < dist(6, 0)  * 1.05 || landmarks[8].y  >= landmarks[6].y;
  const isMiddleExt   = dist(12, 0) > dist(10, 0) * 1.08 && landmarks[12].y < landmarks[10].y;
  const isMiddleCurled= dist(12, 0) < dist(10, 0) * 1.05 || landmarks[12].y >= landmarks[10].y;
  const isRingExt     = dist(16, 0) > dist(14, 0) * 1.08 && landmarks[16].y < landmarks[14].y;
  const isRingCurled  = dist(16, 0) < dist(14, 0) * 1.05 || landmarks[16].y >= landmarks[14].y;
  const isPinkyExt    = dist(20, 0) > dist(18, 0) * 1.08 && landmarks[20].y < landmarks[18].y;
  const isPinkyCurled = dist(20, 0) < dist(18, 0) * 1.05 || landmarks[20].y >= landmarks[18].y;

  const isThumbOpenLateral     = dist(4, 5) > 0.46;
  const isThumbUprightAlongIndex = dist(4, 5) < 0.52 && landmarks[4].y < landmarks[5].y;
  const isThumbTuckedPalm      = dist(4, 9) < 0.46 || dist(4, 13) < 0.48;

  const dThumbIndex  = dist(4, 8);
  const dThumbMiddle = dist(4, 12);
  const dIndexMiddle = dist(8, 12);

  // ── Detección de trayectoria ───────────────────────────────────────
  // Necesitamos suficiente historial y tiempo para señas dinámicas
  const hasTraj = history.length >= 5;

  if (hasTraj) {
    const pts = history;
    const n   = pts.length;
    const start = pts[0];
    const end   = pts[n - 1];
    const mid   = pts[Math.floor(n / 2)];

    const deltaX   = end.x - start.x;
    const deltaY   = end.y - start.y;
    const totalDist= Math.hypot(deltaX, deltaY);

    // Velocidad (distancia / tiempo)
    const dt = (pts[n - 1].time - pts[0].time) || 1;
    const speed = totalDist / (dt / 1000); // unidades/segundo

    // Cuánto ocupa el movimiento en X vs Y
    const horizRatio = Math.abs(deltaX) / (totalDist + 0.001);
    const vertRatio  = Math.abs(deltaY) / (totalDist + 0.001);

    // Detección de zigzag (para Z, Ñ): cambios de dirección en X
    let dirChangesX = 0;
    for (let i = 2; i < n; i++) {
      const prevDx = pts[i - 1].x - pts[i - 2].x;
      const currDx = pts[i].x - pts[i - 1].x;
      if (prevDx * currDx < 0 && Math.abs(currDx) > 0.005) dirChangesX++;
    }

    // Detección de círculo (para POR FAVOR): curvatura sostenida
    const dx1 = mid.x - start.x;
    const dy1 = mid.y - start.y;
    const dx2 = end.x - mid.x;
    const dy2 = end.y - mid.y;
    const cross = dx1 * dy2 - dy1 * dx2; // positivo = giro sentido horario
    const isCircular = Math.abs(cross) > 0.002 && totalDist < 0.08 && n >= 8;

    // ── SEÑAS DINÁMICAS — en orden de especificidad ──────────────────

    // GRACIAS: mano abierta (≥3 dedos) moviéndose hacia abajo/frente desde mentón
    // La cámara captura el movimiento hacia el observador como desplazamiento hacia abajo en Y
    if (isIndexExt && isMiddleExt && isRingExt && speed > 0.04 && deltaY > 0.05) {
      return { letter: 'GRACIAS', confidence: 97, isDynamic: true };
    }

    // HOLA: palma abierta (4 dedos) con cualquier movimiento lateral notable
    if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt && totalDist > 0.07 && horizRatio > 0.4) {
      return { letter: 'HOLA', confidence: 97, isDynamic: true };
    }

    // SÍ: puño cerrado con movimiento vertical (arriba-abajo)
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled
        && speed > 0.05 && vertRatio > 0.6 && totalDist > 0.06) {
      return { letter: 'SÍ', confidence: 96, isDynamic: true };
    }

    // NO: pinza (índice + medio contra pulgar) con movimiento horizontal repetido
    if (!isIndexExt && !isMiddleExt && dThumbIndex < 0.35
        && speed > 0.04 && horizRatio > 0.6 && totalDist > 0.05) {
      return { letter: 'NO', confidence: 95, isDynamic: true };
    }

    // Z: solo índice extendido + zigzag en X (≥2 cambios de dirección)
    if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled
        && dirChangesX >= 2 && totalDist > 0.07) {
      return { letter: 'Z', confidence: 97, isDynamic: true };
    }

    // J: solo meñique extendido + movimiento curvo hacia abajo
    if (isPinkyExt && isIndexCurled && isMiddleCurled && isRingCurled
        && totalDist > 0.07 && deltaY > 0.04) {
      return { letter: 'J', confidence: 95, isDynamic: true };
    }

    // LL: L (índice + pulgar) moviéndose horizontalmente
    if (isIndexExt && isThumbOpenLateral && isMiddleCurled
        && horizRatio > 0.55 && totalDist > 0.07) {
      return { letter: 'LL', confidence: 97, isDynamic: true };
    }

    // RR: R (índice+medio juntos cruzados) moviéndose lateralmente
    if (isIndexExt && isMiddleExt && dIndexMiddle < 0.22
        && horizRatio > 0.5 && totalDist > 0.07) {
      return { letter: 'RR', confidence: 96, isDynamic: true };
    }

    // Ñ: puño cerrado con 1-2 sacudidas horizontales (zigzag suave)
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled
        && dirChangesX >= 1 && horizRatio > 0.5 && totalDist > 0.05) {
      return { letter: 'Ñ', confidence: 95, isDynamic: true };
    }

    // POR FAVOR: movimiento circular con palma plana
    if (isCircular && isIndexExt && isMiddleExt && isRingExt && isPinkyExt) {
      return { letter: 'POR FAVOR', confidence: 94, isDynamic: true };
    }

    // DOS MANOS detectadas simultáneamente → GRACIAS como señal de doble mano
    if (numHands >= 2) {
      return { letter: 'GRACIAS', confidence: 99, isDynamic: true };
    }
  }

  // ── SEÑAS ESTÁTICAS ────────────────────────────────────────────────
  // Orden: de más específica a menos específica

  if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbOpenLateral) {
    return { letter: 'L', confidence: 99 };
  }
  if (!isIndexExt && isMiddleCurled && isRingCurled && isPinkyExt && !isThumbOpenLateral) {
    return { letter: 'I', confidence: 98 };
  }
  if (isPinkyExt && isThumbOpenLateral && isIndexCurled && isMiddleCurled && isRingCurled) {
    return { letter: 'Y', confidence: 99 };
  }
  if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled && dIndexMiddle > 0.32) {
    return { letter: 'V', confidence: 99 };
  }
  if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled && dIndexMiddle <= 0.32) {
    return { letter: 'U', confidence: 97 };
  }
  if (isIndexExt && isMiddleExt && isRingExt && isPinkyCurled) {
    return { letter: 'W', confidence: 98 };
  }
  if (dThumbIndex < 0.30 && isMiddleExt && isRingExt && isPinkyExt) {
    return { letter: 'F', confidence: 98 };
  }
  if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt && !isThumbOpenLateral) {
    return { letter: 'B', confidence: 99 };
  }
  if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled && dThumbMiddle < 0.40) {
    return { letter: 'D', confidence: 96 };
  }
  if (isIndexCurled && isMiddleCurled && dThumbIndex < 0.30 && dThumbMiddle < 0.32) {
    return { letter: 'O', confidence: 98 };
  }
  if (!isIndexExt && !isMiddleExt && dThumbIndex >= 0.32 && dThumbIndex <= 0.90) {
    return { letter: 'C', confidence: 96 };
  }
  if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbUprightAlongIndex) {
    return { letter: 'A', confidence: 97 };
  }
  if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dThumbIndex < 0.35) {
    return { letter: 'E', confidence: 95 };
  }
  if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbTuckedPalm) {
    return { letter: 'S', confidence: 96 };
  }
  if (isIndexExt && isMiddleExt && dIndexMiddle < 0.22 && !isRingExt) {
    return { letter: 'R', confidence: 96 };
  }
  if (isIndexExt && isMiddleExt && dThumbMiddle < 0.38) {
    return { letter: 'K', confidence: 95 };
  }
  if (!isIndexExt && !isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
    return { letter: 'X', confidence: 94 };
  }
  if (isIndexCurled && isMiddleCurled && landmarks[8].y > landmarks[5].y) {
    if (isRingCurled && landmarks[16].y > landmarks[13].y) return { letter: 'M', confidence: 94 };
    return { letter: 'N', confidence: 94 };
  }

  return null;
}

// Plantillas de visualización
export function getLescoLandmarkTemplate(sign: string): Array<{ x: number; y: number }> {
  const cx = 0.5;
  const cy = 0.55;
  const l = (sign || 'L').toUpperCase();

  const w = { x: cx, y: cy + 0.28 };
  const cmc = { x: cx - 0.12, y: cy + 0.18 };
  const mcp2 = { x: cx - 0.08, y: cy + 0.06 };
  const mcp3 = { x: cx - 0.01, y: cy + 0.04 };
  const mcp4 = { x: cx + 0.06, y: cy + 0.06 };
  const mcp5 = { x: cx + 0.12, y: cy + 0.10 };

  let th_ip = { x: cx - 0.18, y: cy + 0.10 };
  let th_tip = { x: cx - 0.24, y: cy + 0.05 };

  let ix_pip = { x: cx - 0.08, y: cy - 0.06 };
  let ix_dip = { x: cx - 0.08, y: cy - 0.16 };
  let ix_tip = { x: cx - 0.08, y: cy - 0.26 };

  let md_pip = { x: cx - 0.01, y: cy - 0.08 };
  let md_dip = { x: cx - 0.01, y: cy - 0.18 };
  let md_tip = { x: cx - 0.01, y: cy - 0.28 };

  let rg_pip = { x: cx + 0.06, y: cy - 0.06 };
  let rg_dip = { x: cx + 0.06, y: cy - 0.16 };
  let rg_tip = { x: cx + 0.06, y: cy - 0.26 };

  let pk_pip = { x: cx + 0.12, y: cy - 0.02 };
  let pk_dip = { x: cx + 0.12, y: cy - 0.10 };
  let pk_tip = { x: cx + 0.12, y: cy - 0.18 };

  const curlIndex = () => {
    ix_pip = { x: cx - 0.07, y: cy + 0.02 };
    ix_dip = { x: cx - 0.05, y: cy + 0.08 };
    ix_tip = { x: cx - 0.05, y: cy + 0.12 };
  };
  const curlMiddle = () => {
    md_pip = { x: cx - 0.01, y: cy + 0.00 };
    md_dip = { x: cx - 0.01, y: cy + 0.07 };
    md_tip = { x: cx - 0.01, y: cy + 0.11 };
  };
  const curlRing = () => {
    rg_pip = { x: cx + 0.05, y: cy + 0.02 };
    rg_dip = { x: cx + 0.05, y: cy + 0.08 };
    rg_tip = { x: cx + 0.05, y: cy + 0.12 };
  };
  const curlPinky = () => {
    pk_pip = { x: cx + 0.10, y: cy + 0.05 };
    pk_dip = { x: cx + 0.10, y: cy + 0.10 };
    pk_tip = { x: cx + 0.10, y: cy + 0.13 };
  };

  switch (l) {
    case 'A':
      curlIndex(); curlMiddle(); curlRing(); curlPinky();
      th_ip = { x: cx - 0.10, y: cy + 0.04 };
      th_tip = { x: cx - 0.09, y: cy - 0.04 };
      break;

    case 'B':
    case 'HOLA':
    case 'GRACIAS':
      th_ip = { x: cx - 0.04, y: cy + 0.12 };
      th_tip = { x: cx + 0.01, y: cy + 0.10 };
      break;

    case 'C':
      th_ip = { x: cx - 0.16, y: cy + 0.12 };
      th_tip = { x: cx - 0.12, y: cy + 0.04 };
      ix_pip = { x: cx - 0.06, y: cy - 0.12 };
      ix_dip = { x: cx - 0.01, y: cy - 0.18 };
      ix_tip = { x: cx + 0.04, y: cy - 0.16 };
      md_pip = { x: cx + 0.00, y: cy - 0.13 };
      md_dip = { x: cx + 0.05, y: cy - 0.19 };
      md_tip = { x: cx + 0.10, y: cy - 0.17 };
      curlRing(); curlPinky();
      break;

    case 'L':
    case 'LL':
      curlMiddle(); curlRing(); curlPinky();
      th_ip = { x: cx - 0.16, y: cy + 0.16 };
      th_tip = { x: cx - 0.26, y: cy + 0.16 };
      break;

    case 'V':
      curlRing(); curlPinky();
      ix_tip = { x: cx - 0.10, y: cy - 0.26 };
      md_tip = { x: cx + 0.08, y: cy - 0.26 };
      th_ip = { x: cx - 0.06, y: cy + 0.10 }; th_tip = { x: cx - 0.01, y: cy + 0.08 };
      break;

    case 'Y':
      curlIndex(); curlMiddle(); curlRing();
      th_ip = { x: cx - 0.16, y: cy + 0.12 };
      th_tip = { x: cx - 0.28, y: cy + 0.08 };
      pk_pip = { x: cx + 0.16, y: cy + 0.02 };
      pk_dip = { x: cx + 0.24, y: cy - 0.06 };
      pk_tip = { x: cx + 0.30, y: cy - 0.14 };
      break;

    default:
      curlMiddle(); curlRing(); curlPinky();
      th_tip = { x: cx - 0.24, y: cy + 0.16 };
      break;
  }

  return [
    w, cmc, { x: (cmc.x + th_ip.x) / 2, y: (cmc.y + th_ip.y) / 2 }, th_ip, th_tip,
    mcp2, ix_pip, ix_dip, ix_tip,
    mcp3, md_pip, md_dip, md_tip,
    mcp4, rg_pip, rg_dip, rg_tip,
    mcp5, pk_pip, pk_dip, pk_tip,
  ];
}

export function SignsToTextScreen({ onBackPress }: { onBackPress?: () => void }) {
  const router = useRouter();

  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const lastAddedSignRef = useRef<string>('');
  const noHandCounterRef = useRef<number>(0);

  const trajectoryBufferRef = useRef<TrajectoryPoint[]>([]);

  const [activeTab, setActiveTab] = useState<'detector' | 'dictionary'>('detector');
  const [dictFilter, setDictFilter] = useState<'todos' | 'alfabeto' | 'palabra'>('todos');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraStatus, setCameraStatus] = useState<string>('⚡ Traductor LESCO Activo — Haz tu seña');
  const [detectedSign, setDetectedSign] = useState<string>('—');
  const [confidence, setConfidence] = useState<number>(0);
  const [isHandPresent, setIsHandPresent] = useState<boolean>(false);
  const [realLandmarks, setRealLandmarks] = useState<Array<{ x: number; y: number }>>([]);
  const [wordBuffer, setWordBuffer] = useState<string>('');
  const [modalSign, setModalSign] = useState<LescoSignItem | null>(null);
  const [autoAddEnabled, setAutoAddEnabled] = useState<boolean>(true);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraContainerRef = useRef<any>(null);
  const mediaPipeHandsRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const voteBufferRef = useRef<string[]>([]);
  const holdCounterRef = useRef<number>(0);
  const smoothedLandmarksRef = useRef<Array<{ x: number; y: number }>>([]);

  // Loop de reconocimiento automático en móvil (Expo Go)
  // Usa cooldown por TIEMPO (2 s) en vez de bloquear la misma letra
  const lastAddedTimeRef = useRef<number>(0);
  // Buffer de fotos para señas dinámicas (últimas 3 fotos)
  const frameBufferRef = useRef<string[]>([]);
  // Cuántas fotos seguidas no se detectó seña → trigger burst dinámico
  const noSignCountRef = useRef<number>(0);

  useEffect(() => {
    if (Platform.OS === 'web' || !isCameraActive || !permission?.granted) return;

    let isMounted = true;

    // ── LOOP ESTÁTICO (cadencia optimizada a 1.8s para máxima precisión y cuota estable) ──
    const staticLoop = async () => {
      await new Promise((r) => setTimeout(r, 600));

      while (isMounted) {
        if (!isProcessingRef.current && cameraRef.current && isCameraActive) {
          try {
            isProcessingRef.current = true;
            setIsScanning(true);

            const photo = await cameraRef.current.takePictureAsync({
              base64: true,
              quality: 0.45,
              shutterSound: false,
              skipProcessing: true,
            });

            if (photo?.base64 && isMounted) {
              setCameraStatus('🔍 Analizando postura LESCO...');

              const result = await recognizeLescoSignFromBase64(photo.base64);

              if (result.detected && result.letter && isMounted) {
                noHandCounterRef.current = 0;
                setIsHandPresent(true);
                setDetectedSign(result.letter);
                setConfidence(result.confidence || 95);
                setRealLandmarks(getLescoLandmarkTemplate(result.letter));

                const now = Date.now();
                if ((now - lastAddedTimeRef.current) >= 1800) {
                  haptics.success();
                  if (autoAddEnabled) {
                    setWordBuffer((prev) => {
                      const needsSpace = prev.length > 0 && !prev.endsWith(' ') && result.letter.length > 1;
                      return needsSpace ? prev + ' ' + result.letter : prev + result.letter;
                    });
                    setCameraStatus(`✅ ¡Letra '${result.letter}' escrita! (${result.confidence}%)`);
                  } else {
                    setCameraStatus(`✅ Detectada '${result.letter}' (${result.confidence}%)`);
                  }
                  lastAddedTimeRef.current = now;
                  lastAddedSignRef.current = result.letter;
                } else {
                  const remaining = Math.ceil((1800 - (now - lastAddedTimeRef.current)) / 1000);
                  setCameraStatus(`👁 '${result.letter}' lista — espera ${remaining}s`);
                }
              } else if (isMounted) {
                setIsHandPresent(false);
                setDetectedSign('—');
                setConfidence(0);
                setRealLandmarks([]);
                setCameraStatus('Muestra tu mano claramente frente a la cámara');
              }
            }
          } catch (err: any) {
            if (isMounted) setCameraStatus(`⚠️ ${err?.message ?? 'Verificando cámara...'}`);
          } finally {
            if (isMounted) {
              setIsScanning(false);
              isProcessingRef.current = false;
            }
          }
        }
        await new Promise((r) => setTimeout(r, 1800));
      }
    };

    staticLoop();

    return () => {
      isMounted = false;
      isProcessingRef.current = false;
    };
  }, [isCameraActive, permission?.granted, autoAddEnabled]);

  // Cargar MediaPipe Hands en Web Browser
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isMounted = true;

    const loadMediaPipeScripts = async () => {
      try {
        if (!(window as any).Hands) {
          setCameraStatus('Cargando Motor de Visión LESCO...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar MediaPipe'));
            document.body.appendChild(script);
          });
        }

        if (!isMounted) return;

        const hands = new (window as any).Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        hands.onResults((results: any) => {
          if (!isMounted) return;

          const multiHands = results.multiHandLandmarks || [];
          if (multiHands.length > 0) {
            const rawLandmarks = multiHands[0];
            setIsHandPresent(true);

            if (smoothedLandmarksRef.current.length === 21) {
              const alpha = 0.70;
              const smoothed = rawLandmarks.map((lm: any, idx: number) => ({
                x: lm.x * alpha + smoothedLandmarksRef.current[idx].x * (1 - alpha),
                y: lm.y * alpha + smoothedLandmarksRef.current[idx].y * (1 - alpha),
              }));
              smoothedLandmarksRef.current = smoothed;
              setRealLandmarks(smoothed);
            } else {
              smoothedLandmarksRef.current = rawLandmarks;
              setRealLandmarks(rawLandmarks);
            }

            const wrist = rawLandmarks[0];
            const now = Date.now();
            trajectoryBufferRef.current.push({ x: wrist.x, y: wrist.y, time: now });
            if (trajectoryBufferRef.current.length > 12) trajectoryBufferRef.current.shift();

            const classification = classifyLescoMotor3(rawLandmarks, trajectoryBufferRef.current, multiHands.length);
            if (classification) {
              voteBufferRef.current.push(classification.letter);
              if (voteBufferRef.current.length > 4) voteBufferRef.current.shift();

              const counts: Record<string, number> = {};
              let maxSign = classification.letter;
              let maxCount = 0;
              voteBufferRef.current.forEach((sign) => {
                counts[sign] = (counts[sign] || 0) + 1;
                if (counts[sign] > maxCount) {
                  maxCount = counts[sign];
                  maxSign = sign;
                }
              });

              // Mostrar la seña detectada INMEDIATAMENTE (sin esperar a escribir)
              setDetectedSign(maxSign);
              setConfidence(classification.confidence);

              // Acumulador reducido: solo 3 frames (+1 por frame) para ser más responsivo
              if (voteBufferRef.current[voteBufferRef.current.length - 1] === maxSign) {
                holdCounterRef.current = Math.min(6, holdCounterRef.current + 1);
              } else {
                holdCounterRef.current = Math.max(0, holdCounterRef.current - 1);
              }
              const THRESHOLD = 3;
              const progress = Math.min(100, Math.round((holdCounterRef.current / THRESHOLD) * 100));
              setHoldProgress(progress);
              setCameraStatus(`✨ Seña: ${maxSign} (${classification.confidence}%) — ${holdCounterRef.current}/${THRESHOLD} frames`);

              if (holdCounterRef.current >= THRESHOLD && autoAddEnabled) {
                const nowW = Date.now();
                const cooldownOkW = (nowW - lastAddedTimeRef.current) >= 2000;
                if (cooldownOkW) {
                  haptics.success();
                  setWordBuffer((prev) => {
                    const needsSpace = prev.length > 0 && !prev.endsWith(' ') && maxSign.length > 1;
                    return needsSpace ? prev + ' ' + maxSign : prev + maxSign;
                  });
                  setCameraStatus(`✅ ¡'${maxSign}' escrita!`);
                  lastAddedTimeRef.current = nowW;
                  lastAddedSignRef.current = maxSign;
                }
                holdCounterRef.current = 0;
                setHoldProgress(0);
                voteBufferRef.current = [];
              }
            } else {
              setCameraStatus('Mano detectada — ajusta la postura LESCO');
              holdCounterRef.current = Math.max(0, holdCounterRef.current - 1);
              setHoldProgress(Math.min(100, Math.round((holdCounterRef.current / 3) * 100)));
            }
          } else {
            setIsHandPresent(false);
            setRealLandmarks([]);
            smoothedLandmarksRef.current = [];
            voteBufferRef.current = [];
            trajectoryBufferRef.current = [];
            holdCounterRef.current = Math.max(0, holdCounterRef.current - 2);
            setHoldProgress(Math.min(100, Math.round((holdCounterRef.current / 3) * 100)));
            setCameraStatus('Muestra tu mano frente a la cámara');
          }
        });

        mediaPipeHandsRef.current = hands;
        setCameraStatus('Motor LESCO listo. Iniciando cámara...');
        startWebcam(hands);
      } catch (err: any) {
        console.warn('Error iniciando MediaPipe:', err);
        setCameraStatus('Modo visual interactivo activo');
      }
    };

    loadMediaPipeScripts();

    return () => {
      isMounted = false;
      stopWebcam();
    };
  }, [autoAddEnabled]);

  const startWebcam = async (handsInstance?: any) => {
    if (Platform.OS !== 'web' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      cameraStreamRef.current = stream;

      let videoEl = document.getElementById('lesco-live-webcam') as HTMLVideoElement;
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.id = 'lesco-live-webcam';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = true;
        videoEl.style.position = 'absolute';
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.style.transform = 'scaleX(-1)';
        videoEl.style.borderRadius = '24px';
        videoEl.style.zIndex = '1';

        const container = document.getElementById('camera-box-container');
        if (container) {
          container.prepend(videoEl);
        }
      }

      videoEl.srcObject = stream;
      await videoEl.play();
      setIsCameraActive(true);
      setCameraStatus('Cámara y Motor LESCO Activos');

      const targetHands = handsInstance || mediaPipeHandsRef.current;
      let animationFrameId: number;

      const processFrame = async () => {
        if (targetHands && videoEl && videoEl.readyState >= 2 && !videoEl.paused) {
          try {
            await targetHands.send({ image: videoEl });
          } catch (e) {}
        }
        animationFrameId = requestAnimationFrame(processFrame);
      };

      animationFrameId = requestAnimationFrame(processFrame);
    } catch (err: any) {
      console.warn('Permiso de cámara denegado:', err);
      setCameraStatus('Permite el acceso a la cámara para traducir en vivo');
      setIsCameraActive(false);
    }
  };

  const stopWebcam = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    const videoEl = document.getElementById('lesco-live-webcam');
    if (videoEl && videoEl.parentNode) {
      videoEl.parentNode.removeChild(videoEl);
    }
    setIsCameraActive(false);
  };

  const handleToggleCamera = () => {
    haptics.light();
    if (isCameraActive) {
      if (Platform.OS === 'web') {
        stopWebcam();
      }
      setIsCameraActive(false);
      setCameraStatus('Cámara pausada');
    } else {
      if (Platform.OS === 'web') {
        startWebcam();
      }
      setIsCameraActive(true);
      setCameraStatus(
        Platform.OS === 'web'
          ? 'Iniciando cámara...'
          : facing === 'front'
          ? 'Cámara frontal activa'
          : 'Cámara trasera activa'
      );
    }
  };

  const toggleCameraFacing = () => {
    haptics.light();
    const nextFacing: CameraType = facing === 'front' ? 'back' : 'front';
    setFacing(nextFacing);
    setCameraStatus(nextFacing === 'front' ? 'Cámara frontal activa' : 'Cámara trasera activa');
  };

  const handleBack = () => {
    haptics.light();
    stopWebcam();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleAddSign = (text: string) => {
    haptics.medium();
    setWordBuffer((prev) => (prev.length > 0 && !prev.endsWith(' ') && text.length > 1 ? prev + ' ' + text : prev + text));
  };

  const handleAddSpace = () => {
    haptics.light();
    setWordBuffer((prev) => prev + ' ');
  };

  const handleDelete = () => {
    haptics.light();
    setWordBuffer((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    haptics.medium();
    setWordBuffer('');
  };

  const handleSpeak = () => {
    haptics.light();
    if (wordBuffer.trim().length > 0) {
      speechService.speak(wordBuffer);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const filteredDictionary = LESCO_DICTIONARY.filter((item) => {
    if (dictFilter === 'todos') return true;
    return item.category === dictFilter;
  });

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Header Condicional (solo si no está embebido o tiene onBackPress) */}
      {onBackPress ? (
        <View style={styles.header}>
          <View style={styles.topNavRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Traductor LESCO</Text>
              <Text style={styles.headerSub}>Reconocimiento en Tiempo Real</Text>
            </View>
            <TouchableOpacity
              style={[styles.camToggleBtn, isCameraActive ? styles.camToggleBtnActive : null]}
              onPress={handleToggleCamera}
              activeOpacity={0.7}
            >
              <Text style={styles.camToggleText}>{isCameraActive ? '⏸ Pausar' : '▶ Activar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Sub-Pestañas Limpias: Cámara vs Diccionario */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[styles.modeTabBtn, activeTab === 'detector' && styles.modeTabBtnActive]}
          onPress={() => {
            haptics.light();
            setActiveTab('detector');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, activeTab === 'detector' && styles.modeTabTextActive]}>
            📷 Cámara en Vivo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, activeTab === 'dictionary' && styles.modeTabBtnActive]}
          onPress={() => {
            haptics.light();
            setActiveTab('dictionary');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, activeTab === 'dictionary' && styles.modeTabTextActive]}>
            📖 Abecedario LESCO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.camControlPill, isCameraActive ? styles.camControlPillActive : null]}
          onPress={handleToggleCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.camControlPillText}>{isCameraActive ? '⏸ Pausar' : '▶ Activar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'detector' ? (
          <>
            {/* 2. Viewport de Cámara Limpio y Despejado */}
            <View
              // @ts-ignore
              id="camera-box-container"
              ref={cameraContainerRef}
              style={styles.cameraBox}
            >
              {Platform.OS !== 'web' ? (
                permission?.granted ? (
                  isCameraActive ? (
                    <CameraView
                      ref={cameraRef}
                      style={StyleSheet.absoluteFill}
                      facing={facing}
                      mirror={facing === 'front'}
                    />
                  ) : (
                    <View style={styles.camPausedContainer}>
                      <Text style={styles.camPausedText}>Cámara pausada</Text>
                      <TouchableOpacity
                        style={styles.resumeCamBtn}
                        onPress={() => setIsCameraActive(true)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.resumeCamBtnText}>▶ Reanudar cámara</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <View style={styles.permissionContainer}>
                    <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
                    <Text style={styles.permissionDesc}>
                      Habilita la cámara para traducir señas LESCO en tiempo real.
                    </Text>
                    <TouchableOpacity
                      style={styles.permissionBtn}
                      onPress={requestPermission}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.permissionBtnText}>Habilitar Cámara</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : null}

              {/* Botón Girar Cámara Flotante Sutil */}
              {Platform.OS !== 'web' && permission?.granted && isCameraActive ? (
                <TouchableOpacity
                  style={styles.flipCamBtn}
                  onPress={toggleCameraFacing}
                  activeOpacity={0.8}
                >
                  <Text style={styles.flipCamBtnText}>🔄 {facing === 'front' ? 'Trasera' : 'Frontal'}</Text>
                </TouchableOpacity>
              ) : null}

              {/* Indicador de Estado Visual y Discreto */}
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isScanning
                        ? '#3498DB'
                        : isHandPresent
                        ? '#2ECC71'
                        : isCameraActive
                        ? '#2ECC71'
                        : '#E74C3C',
                    },
                  ]}
                />
                <Text style={styles.statusBadgeText}>
                  {isScanning ? 'Analizando' : isHandPresent ? 'Detectando' : 'En vivo'}
                </Text>
              </View>
            </View>

            {/* 3. Barra de Detección Activa (Accesible para personas sordas: visual y sin textos largos) */}
            <View style={styles.activeDetectionBar}>
              {isHandPresent && detectedSign !== '—' ? (
                <View style={styles.detectedSignRow}>
                  <View style={styles.detectedBadgeCircle}>
                    <Text style={styles.detectedBadgeLetter}>{detectedSign}</Text>
                  </View>
                  <View style={styles.detectedSignInfo}>
                    <Text style={styles.detectedSignTitle}>Seña {detectedSign}</Text>
                    <Text style={styles.detectedSignSub}>{confidence}% certeza</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.quickAddBtn}
                    onPress={() => handleAddSign(detectedSign)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickAddBtnText}>+ Escribir</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.waitingSignRow}>
                  <Text style={{ fontSize: 18 }}>🖐️</Text>
                  <View style={styles.waitingDot} />
                  <Text style={styles.waitingSignText}>
                    {isScanning ? 'Analizando...' : 'Esperando seña'}
                  </Text>
                </View>
              )}
            </View>

            {/* 4. Panel de Texto Traducido */}
            <View style={styles.wordBuilderCard}>
              <View style={styles.builderHeader}>
                <Text style={styles.builderLabel}>Texto traducido</Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setAutoAddEnabled(!autoAddEnabled);
                  }}
                  style={[styles.autoAddBadge, autoAddEnabled && styles.autoAddBadgeActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.autoAddText, autoAddEnabled && styles.autoAddTextActive]}>
                    {autoAddEnabled ? '⚡ Auto-escritura: SÍ' : '⚡ Auto-escritura: NO'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.textBox}>
                <Text style={styles.transcribedText}>
                  {wordBuffer.length > 0 ? wordBuffer : 'El texto traducido aparecerá aquí...'}
                  <Text style={styles.cursor}>|</Text>
                </Text>
              </View>

              {/* Controles de edición centrados y equilibrados */}
              <View style={styles.keyboardControlsRow}>
                <TouchableOpacity
                  style={[styles.keyActionBtn, { flex: 2 }]}
                  onPress={handleAddSpace}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyActionText}>Espacio ␣</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyActionBtn, { flex: 1.2, backgroundColor: '#EDE3D2' }]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyActionText, { color: '#C0392B' }]}>⌫ Borrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyActionBtn, { flex: 1.5, backgroundColor: '#5C7A5C' }]}
                  onPress={() => {
                    haptics.success();
                    handleSpeak();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.keyActionText, { color: '#FFFFFF' }]}>🔊 Escuchar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keyActionBtn, { width: 44, backgroundColor: '#EDE3D2' }]}
                  onPress={handleClear}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyActionText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Guía del Abecedario LESCO (Carrusel Rápido - SIN EMOJIS CONFUSOS) */}
            <View style={styles.abecedarioSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Abecedario LESCO</Text>
                  <Text style={styles.sectionSubtitle}>Toca para escribir • Mantén para ver postura</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('dictionary')}>
                  <Text style={styles.seeAllText}>Ver todas →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              >
                {LESCO_DICTIONARY.filter(item => item.category === 'alfabeto').map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.letterCard,
                      detectedSign === item.letter && styles.letterCardActive,
                    ]}
                    onPress={() => handleAddSign(item.letter)}
                    onLongPress={() => {
                      haptics.light();
                      setModalSign(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.letterBadgeCircle,
                      detectedSign === item.letter && styles.letterBadgeCircleActive,
                    ]}>
                      <Text style={[
                        styles.letterBadgeText,
                        detectedSign === item.letter && styles.letterBadgeTextActive,
                      ]}>
                        {item.letter}
                      </Text>
                    </View>
                    <Text style={styles.letterCardName}>{item.name}</Text>
                    <Text style={styles.letterCardDiff}>{item.difficulty}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Palabras Frecuentes extendidas horizontalmente sin círculos */}
              <View style={styles.frequentWordsHeaderRow}>
                <Text style={styles.frequentWordsSubtitle}>Palabras Frecuentes LESCO</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.frequentWordsContainer}
              >
                {LESCO_DICTIONARY.filter(item => item.category === 'palabra').map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.frequentWordCard}
                    onPress={() => handleAddSign(item.letter)}
                    onLongPress={() => {
                      haptics.light();
                      setModalSign(item);
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Escribir ${item.name}`}
                  >
                    <Text style={styles.frequentWordCardText}>{item.letter}</Text>
                    <Text style={styles.frequentWordCardSub}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        ) : (
          /* PESTAÑA 2: DICCIONARIO COMPLETO (SIN EMOJIS) */
          <View style={styles.alphabetGrid}>
            <Text style={styles.alphabetIntro}>
              Guía oficial de señas LESCO de Costa Rica basada en Hands-On LESCO y CENAREC. Toca cualquier seña para ver su descripción anatómica.
            </Text>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, dictFilter === 'todos' && styles.filterChipActive]}
                onPress={() => setDictFilter('todos')}
              >
                <Text style={[styles.filterText, dictFilter === 'todos' && styles.filterTextActive]}>
                  Todas ({LESCO_DICTIONARY.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dictFilter === 'alfabeto' && styles.filterChipActive]}
                onPress={() => setDictFilter('alfabeto')}
              >
                <Text style={[styles.filterText, dictFilter === 'alfabeto' && styles.filterTextActive]}>
                  Abecedario (A-Z)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dictFilter === 'palabra' && styles.filterChipActive]}
                onPress={() => setDictFilter('palabra')}
              >
                <Text style={[styles.filterText, dictFilter === 'palabra' && styles.filterTextActive]}>
                  Palabras Frecuentes
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {filteredDictionary.map((item) => {
                const isWord = item.category === 'palabra';

                if (isWord) {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.wordCardHorizontal}
                      onPress={() => {
                        haptics.medium();
                        setModalSign(item);
                      }}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}. ${item.description}`}
                    >
                      <View style={styles.wordCardHeaderRow}>
                        <Text style={styles.wordTextHorizontal}>{item.letter}</Text>
                        <View style={styles.wordRightPills}>
                          <Text style={styles.gridDiffBadge}>{item.difficulty}</Text>
                          <Text style={styles.gridCardAction}>Ver postura oficial →</Text>
                        </View>
                      </View>
                      <Text style={styles.wordCardTitle}>{item.name}</Text>
                      <Text style={styles.wordCardDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridCard}
                    onPress={() => {
                      haptics.medium();
                      setModalSign(item);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gridCardTop}>
                      <View style={styles.gridBadgeCircle}>
                        <Text style={styles.gridBadgeText}>{item.letter}</Text>
                      </View>
                      <Text style={styles.gridDiffBadge}>{item.difficulty}</Text>
                    </View>
                    <Text style={styles.gridCardTitle}>{item.name}</Text>
                    <Text style={styles.gridCardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.gridCardAction}>Ver postura oficial →</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalle Anatómico Oficial */}
      {modalSign ? (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setModalSign(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                {modalSign.category === 'palabra' ? (
                  <View style={styles.modalWordBadge}>
                    <Text style={styles.modalWordBadgeText}>{modalSign.letter}</Text>
                  </View>
                ) : (
                  <View style={styles.modalLetterCircle}>
                    <Text style={styles.modalLetterBig}>{modalSign.letter}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalTitle}>{modalSign.name}</Text>
                  <Text style={styles.modalDiff}>Dificultad: {modalSign.difficulty}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalSign(null)}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>🖐️ Postura Oficial de la Mano:</Text>
                <Text style={styles.modalDesc}>{modalSign.description}</Text>
              </View>

              <View style={[styles.modalSection, styles.tipBox]}>
                <Text style={styles.tipTitle}>💡 Consejo para la Cámara:</Text>
                <Text style={styles.tipText}>{modalSign.tip}</Text>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#B5551A' }]}
                  onPress={() => {
                    handleAddSign(modalSign.letter);
                    setModalSign(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalBtnText}>Agregar '{modalSign.letter}' al texto</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: '#FBF6EE',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    ...Shadows.subtle,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B241C',
  },
  camToggleBtn: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    ...Shadows.subtle,
  },
  camToggleBtnActive: {
    backgroundColor: '#EDE3D2',
    borderColor: '#B5551A',
  },
  camToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B5551A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
  },
  modeTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE3D2',
    borderRadius: Radius.pill,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    gap: 4,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  modeTabTextActive: {
    color: '#B5551A',
    fontWeight: '800',
  },
  camControlPill: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  camControlPillActive: {
    backgroundColor: '#F3EADA',
    borderColor: '#B5551A',
  },
  camControlPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B5551A',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl * 2,
  },
  cameraBox: {
    width: '100%',
    height: Platform.OS === 'web' ? 280 : Math.round(SCREEN_HEIGHT * 0.42),
    backgroundColor: '#1E1712',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  camPausedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  camPausedText: {
    color: '#FBF6EE',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  resumeCamBtn: {
    backgroundColor: '#B5551A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  resumeCamBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  permissionContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionDesc: {
    color: '#EAE0D0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  permissionBtn: {
    backgroundColor: '#B5551A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  flipCamBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(20, 15, 10, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 30,
  },
  flipCamBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 15, 10, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    color: '#FBF6EE',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  landmarksOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  activeDetectionBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.sm,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  detectedSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  detectedBadgeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  detectedBadgeLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  detectedSignInfo: {
    flex: 1,
  },
  detectedSignTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
  },
  detectedSignSub: {
    fontSize: 11,
    color: '#5C7A5C',
    fontWeight: '700',
  },
  quickAddBtn: {
    backgroundColor: '#B5551A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  waitingSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9E9484',
  },
  waitingSignText: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '600',
  },
  wordBuilderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  builderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  builderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  autoAddBadge: {
    backgroundColor: '#EDE3D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  autoAddBadgeActive: {
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#5C7A5C',
  },
  autoAddText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A6E5C',
  },
  autoAddTextActive: {
    color: '#5C7A5C',
  },
  textBox: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: 14,
    padding: Spacing.md,
    minHeight: 54,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  transcribedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B241C',
  },
  cursor: {
    color: '#B5551A',
    fontWeight: '900',
  },
  keyboardControlsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  keyActionBtn: {
    backgroundColor: '#F3EADA',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  keyActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B241C',
  },
  abecedarioSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#7A6E5C',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B5551A',
  },
  carouselContainer: {
    paddingRight: 20,
    paddingVertical: 6,
  },
  letterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 72,
    ...Shadows.subtle,
  },
  letterCardActive: {
    borderColor: '#B5551A',
    backgroundColor: '#FBF6EE',
  },
  letterBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  letterBadgeCircleActive: {
    backgroundColor: '#B5551A',
  },
  letterBadgeText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#B5551A',
  },
  letterBadgeTextActive: {
    color: '#FFFFFF',
  },
  letterCardName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B241C',
  },
  letterCardDiff: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7A6E5C',
    marginTop: 2,
  },
  frequentWordsHeaderRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  frequentWordsSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  frequentWordsContainer: {
    paddingRight: 20,
    paddingVertical: 6,
    gap: 8,
  },
  frequentWordCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 46,
    justifyContent: 'center',
    marginRight: 6,
    ...Shadows.subtle,
  },
  frequentWordCardText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B5551A',
    letterSpacing: 0.5,
  },
  frequentWordCardSub: {
    fontSize: 10,
    color: '#7A6E5C',
    fontWeight: '600',
    marginTop: 1,
  },
  alphabetGrid: {
    paddingTop: Spacing.xs,
  },
  alphabetIntro: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginBottom: Spacing.md,
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  filterChipActive: {
    backgroundColor: '#B5551A',
    borderColor: '#B5551A',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (SCREEN_WIDTH - 54) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    ...Shadows.subtle,
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
  },
  gridDiffBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A6E5C',
    backgroundColor: '#EDE3D2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 3,
  },
  gridCardDesc: {
    fontSize: 10,
    color: '#7A6E5C',
    lineHeight: 14,
    marginBottom: 6,
  },
  gridCardAction: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B5551A',
  },
  wordCardHorizontal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    marginBottom: 8,
    ...Shadows.subtle,
  },
  wordCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordTextHorizontal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
    letterSpacing: 0.5,
  },
  wordRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 3,
  },
  wordCardDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 10, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalWordBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWordBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalLetterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLetterBig: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
  },
  modalDiff: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE3D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
  },
  modalSection: {
    marginBottom: Spacing.md,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: '#4A3E31',
    lineHeight: 17,
  },
  tipBox: {
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: 12,
    padding: Spacing.sm,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B5551A',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 11,
    color: '#7A6E5C',
    lineHeight: 15,
  },
  modalButtonsRow: {
    marginTop: Spacing.xs,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

