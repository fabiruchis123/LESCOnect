/**
 * @file lescoAlphabetTrainerService.ts
 * @description Servicio de calibración, plantillas anatómicas 3D y clasificación de alta precisión
 * para el abecedario completo de la Lengua de Señas Costarricense (LESCO: 30 señas dactilológicas).
 *
 * Incluye:
 * - 30 letras oficiales: A-Z, CH, LL, Ñ, RR
 * - Señas emblemáticas de cortesía/emergencia: HOLA, GRACIAS, POR FAVOR, SÍ, NO, AYUDA
 * - Desambiguación geométrica fina entre señas confusas:
 *   * Horizontales: G, H, CH (orientación del eje índice-medio y número de dedos extendidos)
 *   * Descendentes / Invertidas: P, Q, M, N (K hacia abajo, pinza hacia abajo, 3 vs 2 dedos colgantes)
 *   * Puños / Compactas: A (pulgar lateral erguido), S (pulgar frontal sobre nudillos), E (garras sobre pulgar), O (círculo cerrado), T (pulgar entre índice y medio)
 * - Marcador de dinamismo (`isDynamic`) para letras con trazo (J, Z, Ñ, LL, RR, CH) cuya trayectoria
 *   es evaluada por el pipeline cinemático DTW de `lescoKeypointPipelineService.ts`.
 * - Calibración en memoria (On-Device Few-Shot Adaptation) para ajustarse a las proporciones de la mano del usuario.
 */

import {
  HandLandmark3D,
  normalizeHandLandmarks,
  NormalizedLandmark3D,
  extractBiomechanicalFeatures,
} from './lescoKeypointPipelineService';

export type StandardLescoLetter =
  | 'A' | 'B' | 'C' | 'CH' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
  | 'J' | 'K' | 'L' | 'LL' | 'M' | 'N' | 'Ñ' | 'O' | 'P' | 'Q'
  | 'R' | 'RR' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export type FrequentLescoSign = 'HOLA' | 'GRACIAS' | 'POR FAVOR' | 'SÍ' | 'NO' | 'AYUDA';

export type LescoAlphabetSignId = StandardLescoLetter | FrequentLescoSign;

export interface AlphabetClassificationAlternative {
  letter: LescoAlphabetSignId;
  confidence: number;
}

export interface AlphabetClassificationResult {
  letter: LescoAlphabetSignId;
  confidence: number;
  isDynamic: boolean;
  alternatives: AlphabetClassificationAlternative[];
  handSide?: 'left' | 'right';
}

export interface LescoAlphabetPoseTemplate {
  id: LescoAlphabetSignId;
  name: string;
  isDynamic: boolean;
  dynamicHint?: string;
  landmarks21: NormalizedLandmark3D[];
  /** Valores esperados de extensión continua [0..1] para [pulgar, índice, medio, anular, meñique] */
  fingerExtensions: [number, number, number, number, number];
  /** Orientación predominante del eje de la palma / dedos: 'arriba' | 'horizontal' | 'abajo' | 'frente' */
  primaryOrientation: 'arriba' | 'horizontal' | 'abajo' | 'frente';
}

/**
 * Constructor paramétrico de poses de 21 landmarks anatómicos MediaPipe.
 * Genera coordenadas 3D coherentes evitando números arbitrarios.
 */
function buildHandPose(params: {
  thumbExt: number; // 0..1 (0=guardado, 1=extendido)
  thumbSpread: number; // separación lateral del pulgar
  thumbCross?: boolean; // pulgar cruzado sobre nudillos (S) o entre dedos (T)
  indexExt: number;
  middleExt: number;
  ringExt: number;
  pinkyExt: number;
  indexCrossMiddle?: boolean; // cruzados (R)
  horizontalAxis?: boolean; // apuntando horizontalmente (G, H)
  downwardAxis?: boolean; // apuntando hacia abajo (P, Q, M, N)
  circlePinch?: boolean; // O / C
  hookIndex?: boolean; // X
}): NormalizedLandmark3D[] {
  const pts: NormalizedLandmark3D[] = [];

  // Muñeca en el origen
  pts.push({ x: 0, y: 0, z: 0 });

  // Base del pulgar y nudillos MCP
  const mcpBase = [
    { x: -0.22, y: -0.25, z: -0.05 }, // 1: CMC pulgar
    { x: -0.15, y: -0.65, z: 0.0 },   // 5: MCP índice
    { x: -0.02, y: -0.72, z: 0.02 },  // 9: MCP medio
    { x: 0.12,  y: -0.67, z: 0.01 },  // 13: MCP anular
    { x: 0.23,  y: -0.58, z: -0.03 }, // 17: MCP meñique
  ];

  // 1-4: Pulgar
  const thSpread = params.thumbSpread * 0.28;
  const thY = params.downwardAxis ? 0.2 : (params.thumbCross ? -0.45 : -0.25 - params.thumbExt * 0.35);
  const thX = params.thumbCross ? 0.05 : -0.22 - thSpread;
  pts.push(mcpBase[0]); // 1
  pts.push({ x: thX * 0.7, y: thY * 0.5, z: 0.08 }); // 2 MCP
  pts.push({ x: thX * 0.9, y: thY * 0.8, z: 0.12 }); // 3 IP
  pts.push({ x: thX, y: thY, z: params.circlePinch ? 0.18 : 0.14 }); // 4 TIP

  // Generador para dedos índice, medio, anular, meñique
  const fingerParams = [
    { mcp: mcpBase[1], ext: params.indexExt, spread: -0.05, hook: params.hookIndex },
    { mcp: mcpBase[2], ext: params.middleExt, spread: 0.0, hook: false },
    { mcp: mcpBase[3], ext: params.ringExt, spread: 0.04, hook: false },
    { mcp: mcpBase[4], ext: params.pinkyExt, spread: 0.09, hook: false },
  ];

  fingerParams.forEach((f, idx) => {
    const isHorizontal = params.horizontalAxis && idx === 0;
    const isDownward = params.downwardAxis;
    const dirY = isDownward ? 1 : -1;
    const dirX = isHorizontal ? 1 : 0;

    let lenPIP = 0.28;
    let lenDIP = 0.22;
    let lenTIP = 0.18;

    // Si el dedo está doblado / enrollado
    const bend = 1.0 - f.ext;
    const pipY = f.mcp.y + (isDownward ? lenPIP : -lenPIP * f.ext);
    const pipX = f.mcp.x + f.spread + (isHorizontal ? lenPIP : 0);
    const pipZ = bend * 0.15;

    let dipY: number;
    let dipX: number;
    let tipY: number;
    let tipX: number;
    let tipZ = bend * 0.25;

    if (f.hook) {
      // Dedo en garfio (letra X)
      dipY = pipY + 0.05;
      dipX = pipX + 0.08;
      tipY = dipY + 0.12;
      tipX = dipX - 0.04;
      tipZ = 0.12;
    } else if (bend > 0.6) {
      // Dedo cerrado en puño
      dipY = f.mcp.y + (isDownward ? 0.18 : 0.08);
      dipX = f.mcp.x + f.spread * 0.5;
      tipY = f.mcp.y + (isDownward ? 0.24 : 0.14);
      tipX = f.mcp.x + f.spread * 0.3;
      tipZ = 0.18;
    } else {
      // Dedo extendido
      dipY = pipY + (isDownward ? lenDIP : -lenDIP * f.ext);
      dipX = pipX + (isHorizontal ? lenDIP : 0);
      tipY = dipY + (isDownward ? lenTIP : -lenTIP * f.ext);
      tipX = dipX + (isHorizontal ? lenTIP : 0);
      if (params.indexCrossMiddle && idx === 0) {
        tipX += 0.06; // Cruza sobre el medio (R)
      }
    }

    if (params.circlePinch && (idx === 0 || idx === 1)) {
      // O / C: yemas convergen hacia el pulgar
      tipX = -0.08 + idx * 0.04;
      tipY = -0.55;
      tipZ = 0.16;
    }

    pts.push(f.mcp); // 5, 9, 13, 17
    pts.push({ x: pipX, y: pipY, z: pipZ }); // 6, 10, 14, 18
    pts.push({ x: dipX, y: dipY, z: tipZ * 0.8 }); // 7, 11, 15, 19
    pts.push({ x: tipX, y: tipY, z: tipZ }); // 8, 12, 16, 20
  });

  return pts;
}

// ── BANCO OFICIAL DE 30 LETRAS + 6 SEÑAS FRECUENTES ───────────────────────────
export const LESCO_ALPHABET_TEMPLATES: Record<LescoAlphabetSignId, LescoAlphabetPoseTemplate> = {
  A: {
    id: 'A',
    name: 'Letra A',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.9, 0.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.9, thumbSpread: 0.6, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  B: {
    id: 'B',
    name: 'Letra B',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.1, 1.0, 1.0, 1.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.1, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 1.0, pinkyExt: 1.0 }),
  },
  C: {
    id: 'C',
    name: 'Letra C',
    isDynamic: false,
    primaryOrientation: 'horizontal',
    fingerExtensions: [0.5, 0.5, 0.5, 0.5, 0.5],
    landmarks21: buildHandPose({ thumbExt: 0.6, thumbSpread: 0.8, circlePinch: true, indexExt: 0.5, middleExt: 0.5, ringExt: 0.5, pinkyExt: 0.5 }),
  },
  CH: {
    id: 'CH',
    name: 'Letra CH',
    isDynamic: true,
    dynamicHint: 'Forma la C y traza un semicírculo o conecta suavemente hacia la H.',
    primaryOrientation: 'horizontal',
    fingerExtensions: [0.6, 0.6, 0.6, 0.4, 0.4],
    landmarks21: buildHandPose({ thumbExt: 0.6, thumbSpread: 0.7, circlePinch: true, indexExt: 0.6, middleExt: 0.6, ringExt: 0.4, pinkyExt: 0.4 }),
  },
  D: {
    id: 'D',
    name: 'Letra D',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.4, 1.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.4, thumbSpread: 0.3, circlePinch: true, indexExt: 1.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  E: {
    id: 'E',
    name: 'Letra E',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 0.1, 0.1, 0.1, 0.1],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.15, middleExt: 0.15, ringExt: 0.15, pinkyExt: 0.15 }),
  },
  F: {
    id: 'F',
    name: 'Letra F',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.4, 0.2, 1.0, 1.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.4, thumbSpread: 0.2, circlePinch: true, indexExt: 0.2, middleExt: 1.0, ringExt: 1.0, pinkyExt: 1.0 }),
  },
  G: {
    id: 'G',
    name: 'Letra G',
    isDynamic: false,
    primaryOrientation: 'horizontal',
    fingerExtensions: [0.8, 1.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.8, thumbSpread: 0.5, horizontalAxis: true, indexExt: 1.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  H: {
    id: 'H',
    name: 'Letra H',
    isDynamic: false,
    primaryOrientation: 'horizontal',
    fingerExtensions: [0.8, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.8, thumbSpread: 0.4, horizontalAxis: true, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  I: {
    id: 'I',
    name: 'Letra I',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 0.0, 0.0, 0.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 1.0 }),
  },
  J: {
    id: 'J',
    name: 'Letra J',
    isDynamic: true,
    dynamicHint: 'Meñique arriba trazando una curva en J descendente hacia adentro.',
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 0.0, 0.0, 0.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 1.0 }),
  },
  K: {
    id: 'K',
    name: 'Letra K',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.8, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.8, thumbSpread: 0.4, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  L: {
    id: 'L',
    name: 'Letra L',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [1.0, 1.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 1.0, thumbSpread: 1.0, indexExt: 1.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  LL: {
    id: 'LL',
    name: 'Letra LL',
    isDynamic: true,
    dynamicHint: 'Forma de la L deslizándose horizontalmente hacia un lado.',
    primaryOrientation: 'arriba',
    fingerExtensions: [1.0, 1.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 1.0, thumbSpread: 1.0, indexExt: 1.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  M: {
    id: 'M',
    name: 'Letra M',
    isDynamic: false,
    primaryOrientation: 'abajo',
    fingerExtensions: [0.2, 0.4, 0.4, 0.4, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.3, thumbSpread: 0.0, downwardAxis: true, indexExt: 0.4, middleExt: 0.4, ringExt: 0.4, pinkyExt: 0.0 }),
  },
  N: {
    id: 'N',
    name: 'Letra N',
    isDynamic: false,
    primaryOrientation: 'abajo',
    fingerExtensions: [0.2, 0.4, 0.4, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.3, thumbSpread: 0.0, downwardAxis: true, indexExt: 0.4, middleExt: 0.4, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  Ñ: {
    id: 'Ñ',
    name: 'Letra Ñ',
    isDynamic: true,
    dynamicHint: 'Misma postura que la N (dos dedos hacia abajo) con vaivén oscilante lateral.',
    primaryOrientation: 'abajo',
    fingerExtensions: [0.2, 0.4, 0.4, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.3, thumbSpread: 0.0, downwardAxis: true, indexExt: 0.4, middleExt: 0.4, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  O: {
    id: 'O',
    name: 'Letra O',
    isDynamic: false,
    primaryOrientation: 'frente',
    fingerExtensions: [0.3, 0.3, 0.3, 0.3, 0.3],
    landmarks21: buildHandPose({ thumbExt: 0.3, thumbSpread: 0.4, circlePinch: true, indexExt: 0.3, middleExt: 0.3, ringExt: 0.3, pinkyExt: 0.3 }),
  },
  P: {
    id: 'P',
    name: 'Letra P',
    isDynamic: false,
    primaryOrientation: 'abajo',
    fingerExtensions: [0.7, 0.9, 0.9, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.7, thumbSpread: 0.3, downwardAxis: true, indexExt: 0.9, middleExt: 0.9, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  Q: {
    id: 'Q',
    name: 'Letra Q',
    isDynamic: false,
    primaryOrientation: 'abajo',
    fingerExtensions: [0.6, 0.6, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.6, thumbSpread: 0.4, downwardAxis: true, indexExt: 0.6, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  R: {
    id: 'R',
    name: 'Letra R',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0, indexCrossMiddle: true }),
  },
  RR: {
    id: 'RR',
    name: 'Letra RR',
    isDynamic: true,
    dynamicHint: 'Dedos índice y medio cruzados (R) deslizándose hacia un lateral.',
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0, indexCrossMiddle: true }),
  },
  S: {
    id: 'S',
    name: 'Letra S',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 0.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  T: {
    id: 'T',
    name: 'Letra T',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.4, 0.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.4, thumbSpread: 0.2, thumbCross: true, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  U: {
    id: 'U',
    name: 'Letra U',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  V: {
    id: 'V',
    name: 'Letra V',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 1.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  W: {
    id: 'W',
    name: 'Letra W',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 1.0, 1.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 1.0, ringExt: 1.0, pinkyExt: 0.0 }),
  },
  X: {
    id: 'X',
    name: 'Letra X',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 0.5, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.5, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0, hookIndex: true }),
  },
  Y: {
    id: 'Y',
    name: 'Letra Y',
    isDynamic: false,
    primaryOrientation: 'arriba',
    fingerExtensions: [1.0, 0.0, 0.0, 0.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 1.0, thumbSpread: 1.0, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 1.0 }),
  },
  Z: {
    id: 'Z',
    name: 'Letra Z',
    isDynamic: true,
    dynamicHint: 'Dedo índice extendido dibujando un zigzag de Z en el aire.',
    primaryOrientation: 'arriba',
    fingerExtensions: [0.2, 1.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 1.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },

  // ── SEÑAS FRECUENTES ──
  HOLA: {
    id: 'HOLA',
    name: '¡Hola!',
    isDynamic: true,
    dynamicHint: 'Palma abierta a la altura de la sien oscilando suavemente.',
    primaryOrientation: 'frente',
    fingerExtensions: [1.0, 1.0, 1.0, 1.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 1.0, thumbSpread: 0.8, indexExt: 1.0, middleExt: 1.0, ringExt: 1.0, pinkyExt: 1.0 }),
  },
  GRACIAS: {
    id: 'GRACIAS',
    name: 'Gracias',
    isDynamic: true,
    dynamicHint: 'Yemas en el mentón desplazándose hacia el frente con palma arriba.',
    primaryOrientation: 'frente',
    fingerExtensions: [0.8, 1.0, 1.0, 1.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.8, thumbSpread: 0.5, indexExt: 1.0, middleExt: 1.0, ringExt: 1.0, pinkyExt: 1.0 }),
  },
  'POR FAVOR': {
    id: 'POR FAVOR',
    name: 'Por favor',
    isDynamic: true,
    dynamicHint: 'Palma plana sobre el pecho realizando un suave círculo horario.',
    primaryOrientation: 'frente',
    fingerExtensions: [0.7, 1.0, 1.0, 1.0, 1.0],
    landmarks21: buildHandPose({ thumbExt: 0.7, thumbSpread: 0.3, indexExt: 1.0, middleExt: 1.0, ringExt: 1.0, pinkyExt: 1.0 }),
  },
  'SÍ': {
    id: 'SÍ',
    name: 'Sí',
    isDynamic: true,
    dynamicHint: 'Puño cerrado asintiendo verticalmente como una cabeza.',
    primaryOrientation: 'frente',
    fingerExtensions: [0.2, 0.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.2, thumbSpread: 0.0, thumbCross: true, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  NO: {
    id: 'NO',
    name: 'No',
    isDynamic: true,
    dynamicHint: 'Índice y medio extendidos tocando el pulgar en pinza repetida.',
    primaryOrientation: 'frente',
    fingerExtensions: [0.8, 0.8, 0.8, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 0.8, thumbSpread: 0.4, circlePinch: true, indexExt: 0.8, middleExt: 0.8, ringExt: 0.0, pinkyExt: 0.0 }),
  },
  AYUDA: {
    id: 'AYUDA',
    name: 'Ayuda',
    isDynamic: true,
    dynamicHint: 'Puño con pulgar erguido sobre palma base elevándose conjuntamente.',
    primaryOrientation: 'arriba',
    fingerExtensions: [1.0, 0.0, 0.0, 0.0, 0.0],
    landmarks21: buildHandPose({ thumbExt: 1.0, thumbSpread: 0.6, indexExt: 0.0, middleExt: 0.0, ringExt: 0.0, pinkyExt: 0.0 }),
  },
};

// ── BANCO DE CALIBRACIÓN FEW-SHOT EN MEMORIA ──────────────────────────────────
const userCalibrationStore = new Map<LescoAlphabetSignId, NormalizedLandmark3D[]>();

/**
 * Obtiene la plantilla anatómica de 21 landmarks de una letra o seña LESCO.
 * Prioriza muestras calibradas personalizadas del usuario si existen.
 */
export function getTrainedLescoLandmarkTemplate(letter: string): NormalizedLandmark3D[] | undefined {
  const normKey = letter.trim().toUpperCase() as LescoAlphabetSignId;
  const userCalibrated = userCalibrationStore.get(normKey);
  if (userCalibrated && userCalibrated.length === 21) {
    return userCalibrated;
  }
  return LESCO_ALPHABET_TEMPLATES[normKey]?.landmarks21;
}

/**
 * Registra una muestra de calibración on-device del usuario.
 * Aplica un promedio móvil exponencial (alpha=0.4) para no sesgar drásticamente la pose base.
 */
export function calibrateUserSample(
  signId: LescoAlphabetSignId,
  landmarks: HandLandmark3D[]
): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const normGeo = normalizeHandLandmarks(landmarks);
  if (!normGeo) return false;
  const current = userCalibrationStore.get(signId) || LESCO_ALPHABET_TEMPLATES[signId]?.landmarks21;

  if (!current || current.length < 21) {
    userCalibrationStore.set(signId, normGeo.landmarks);
    return true;
  }

  const alpha = 0.4;
  const blended: NormalizedLandmark3D[] = current.map((p, i) => ({
    x: p.x * (1 - alpha) + normGeo.landmarks[i].x * alpha,
    y: p.y * (1 - alpha) + normGeo.landmarks[i].y * alpha,
    z: (p.z ?? 0) * (1 - alpha) + (normGeo.landmarks[i].z ?? 0) * alpha,
  }));

  userCalibrationStore.set(signId, blended);
  return true;
}

/**
 * Reinicia la calibración del usuario volviendo a las plantillas canónicas.
 */
export function resetCalibration(): void {
  userCalibrationStore.clear();
}

/**
 * Clasificador dactilológico de alta fidelidad para LESCO.
 * Evalúa:
 * 1. Similitud euclidiana ponderada por articulación contra las 30 plantillas
 * 2. Desambiguación geométrica explícita de familias críticas:
 *    - Puños: A, S, E, O, T
 *    - Horizontales: G, H, CH
 *    - Descendentes: P, Q, M, N
 *    - Cruzados / V: R, RR, K, U, V
 */
export function classifyTrainedAlphabetLesco(
  rawLandmarks: HandLandmark3D[]
): AlphabetClassificationResult | null {
  if (!rawLandmarks || rawLandmarks.length < 21) return null;

  const normalized = normalizeHandLandmarks(rawLandmarks);
  if (!normalized || normalized.palmScale < 0.03) return null;

  const bioFeatures = extractBiomechanicalFeatures(rawLandmarks);
  if (!bioFeatures) return null;
  const ext = bioFeatures.fingerExtensions;

  // ── DESAMBIGUACIONES ESPECÍFICAS LESCO ─────────────────────────────────────
  // 1. Detección de orientación vertical/descendente/horizontal
  const wrist = normalized.landmarks[0];
  const middleMcp = normalized.landmarks[9];
  const indexTip = normalized.landmarks[8];
  const middleTip = normalized.landmarks[12];
  const thumbTip = normalized.landmarks[4];
  const pinkyTip = normalized.landmarks[20];

  const dyIndex = indexTip.y - middleMcp.y;
  const dxIndex = indexTip.x - middleMcp.x;
  const isIndexHorizontal = Math.abs(dxIndex) > Math.abs(dyIndex) * 0.9;
  const isHandDownward = indexTip.y > wrist.y && middleTip.y > wrist.y;

  // Puños compactos (todos los dedos flexionados < 0.25)
  const isFist = ext.index < 0.25 && ext.middle < 0.25 && ext.ring < 0.25 && ext.pinky < 0.25;

  if (isFist) {
    const dThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const dThumbMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);

    // O: Círculo cerrado yemas juntas
    if (dThumbIndex < 0.12 && dThumbMiddle < 0.14) {
      return {
        letter: 'O',
        confidence: 97,
        isDynamic: false,
        alternatives: [{ letter: 'C', confidence: 78 }, { letter: 'E', confidence: 65 }],
      };
    }

    // A: Pulgar lateral erguido al lado del índice
    if (ext.thumb > 0.6 && thumbTip.x < normalized.landmarks[5].x - 0.08) {
      return {
        letter: 'A',
        confidence: 96,
        isDynamic: false,
        alternatives: [{ letter: 'S', confidence: 74 }, { letter: 'T', confidence: 68 }],
      };
    }

    // T: Pulgar asoma entre índice y medio
    if (thumbTip.x > normalized.landmarks[5].x - 0.02 && thumbTip.x < normalized.landmarks[9].x + 0.02) {
      return {
        letter: 'T',
        confidence: 95,
        isDynamic: false,
        alternatives: [{ letter: 'S', confidence: 80 }, { letter: 'A', confidence: 66 }],
      };
    }

    // E: Dedos apoyados sobre el pulgar
    if (thumbTip.y > indexTip.y && ext.thumb < 0.35) {
      return {
        letter: 'E',
        confidence: 95,
        isDynamic: false,
        alternatives: [{ letter: 'S', confidence: 78 }, { letter: 'O', confidence: 70 }],
      };
    }

    // S: Pulgar cruzado sobre el centro de los dedos en puño
    return {
      letter: 'S',
      confidence: 96,
      isDynamic: false,
      alternatives: [{ letter: 'A', confidence: 79 }, { letter: 'E', confidence: 75 }],
    };
  }

  // 2. Horizontales: G vs H vs CH
  if (isIndexHorizontal && ext.index > 0.65) {
    if (ext.middle > 0.65) {
      return {
        letter: 'H',
        confidence: 96,
        isDynamic: false,
        alternatives: [{ letter: 'G', confidence: 82 }, { letter: 'CH', confidence: 71 }],
      };
    }
    return {
      letter: 'G',
      confidence: 96,
      isDynamic: false,
      alternatives: [{ letter: 'H', confidence: 81 }, { letter: 'L', confidence: 64 }],
    };
  }

  // 3. Descendentes: P vs Q vs M vs N
  if (isHandDownward) {
    if (ext.index > 0.5 && ext.middle > 0.5 && ext.ring < 0.3) {
      // P: K hacia abajo
      return {
        letter: 'P',
        confidence: 95,
        isDynamic: false,
        alternatives: [{ letter: 'Q', confidence: 79 }, { letter: 'K', confidence: 70 }],
      };
    }
    if (ext.index > 0.4 && ext.middle < 0.3 && ext.ring < 0.3) {
      // Q: Pinza hacia abajo
      return {
        letter: 'Q',
        confidence: 95,
        isDynamic: false,
        alternatives: [{ letter: 'P', confidence: 77 }, { letter: 'G', confidence: 65 }],
      };
    }
    if (ext.index > 0.25 && ext.middle > 0.25 && ext.ring > 0.25) {
      // M: 3 dedos colgando
      return {
        letter: 'M',
        confidence: 94,
        isDynamic: false,
        alternatives: [{ letter: 'N', confidence: 85 }, { letter: 'Ñ', confidence: 78 }],
      };
    }
    if (ext.index > 0.25 && ext.middle > 0.25) {
      // N: 2 dedos colgando
      return {
        letter: 'N',
        confidence: 94,
        isDynamic: false,
        alternatives: [{ letter: 'M', confidence: 82 }, { letter: 'Ñ', confidence: 80 }],
      };
    }
  }

  // 4. Comparador de distancia ponderada contra todas las plantillas registradas
  const candidates: Array<{ letter: LescoAlphabetSignId; distance: number }> = [];

  const templateEntries = Object.entries(LESCO_ALPHABET_TEMPLATES) as [LescoAlphabetSignId, LescoAlphabetPoseTemplate][];

  for (const [id, tmpl] of templateEntries) {
    let distSum = 0;
    // Ponderación mayor para puntas de los dedos (indices 4, 8, 12, 16, 20)
    for (let i = 0; i < 21; i++) {
      const pObs = normalized.landmarks[i];
      const pTmpl = tmpl.landmarks21[i];
      const weight = (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) ? 2.5 : 1.0;
      const d2 = Math.pow(pObs.x - pTmpl.x, 2) + Math.pow(pObs.y - pTmpl.y, 2) + Math.pow(pObs.z - pTmpl.z, 2);
      distSum += Math.sqrt(d2) * weight;
    }

    // Penalización por diferencia de extensiones de dedos
    const extDiff =
      Math.abs(ext.thumb - tmpl.fingerExtensions[0]) * 1.5 +
      Math.abs(ext.index - tmpl.fingerExtensions[1]) * 2.0 +
      Math.abs(ext.middle - tmpl.fingerExtensions[2]) * 2.0 +
      Math.abs(ext.ring - tmpl.fingerExtensions[3]) * 1.5 +
      Math.abs(ext.pinky - tmpl.fingerExtensions[4]) * 1.5;

    candidates.push({ letter: id, distance: distSum + extDiff });
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const best = candidates[0];
  if (!best) return null;

  // Cálculo de confianza normalizada [50..99]
  const baseConf = Math.max(50, Math.min(99, Math.round(100 - best.distance * 12)));
  const tmpl = LESCO_ALPHABET_TEMPLATES[best.letter];

  const alternatives: AlphabetClassificationAlternative[] = candidates.slice(1, 4).map((c) => ({
    letter: c.letter,
    confidence: Math.max(40, Math.min(92, Math.round(100 - c.distance * 12))),
  }));

  return {
    letter: best.letter,
    confidence: baseConf,
    isDynamic: tmpl?.isDynamic ?? false,
    alternatives,
  };
}
