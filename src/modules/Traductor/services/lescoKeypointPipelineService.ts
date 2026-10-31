/**
 * @file lescoKeypointPipelineService.ts
 * @description Pipeline Cinemático y Geométrico 3D para Lengua de Señas Costarricense (LESCO).
 *
 * Implementa:
 * 1. Normalización Geométrica Invariante 3D (`normalizeHandLandmarks`):
 *    Traslación al origen en la muñeca (p0 = (0,0,0)), escalado por longitud anatómica
 *    de la palma ||p9 - p0|| y alineación rotacional planar del eje muñeca–nudillo medio.
 * 2. Extractor de Descriptor Biomecánico en R^78 (`extractBiomechanicalFeatures`):
 *    - 63 coordenadas 3D normalizadas (21 puntos * 3 ejes)
 *    - 5 estados de extensión continuos [0..1] (pulgar, índice, medio, anular, meñique)
 *    - 5 ángulos de flexión articular compuesta (PIP + DIP normalizados)
 *    - 5 distancias de pinza e interdigitales normalizadas
 *    Además de metadatos fonológicos: orientación de la palma y zona espacial corporal.
 * 3. Detector de Fronteras de Señas en Flujo Continuo (`SignBoundaryTracker`):
 *    Basado en energía cinética instantánea E_t = ||v_t||^2 sobre ventana deslizante para
 *    distinguir Reposición/Transición, Retención Estática (Hold >= 3 frames) y Trazo Dinámico (Stroke).
 * 4. Comparador de Trayectorias por Dynamic Time Warping con banda de Sakoe-Chiba
 *    (`computeTrajectoryDTW` y `matchDynamicSignTrajectory`) contra plantillas canónicas LESCO:
 *    Z, J, Ñ, LL, RR, HOLA, GRACIAS, POR FAVOR, SÍ, NO.
 *    El núcleo DTW usa dos filas rodantes (Float64Array reutilizables, O(m) memoria) y
 *    early-abandon (poda por cota inferior de fila) para rendimiento en dispositivos móviles.
 * 5. Suavizado temporal One-Euro (`OneEuroFilter`, `HandLandmarkSmoother`) contra el jitter de landmarks.
 * 6. Detección de mano dominante / espejo (`detectHandedness`, `mirrorHandLandmarks`,
 *    `canonicalizeHandLandmarks`, `extractHandFeatures`) para usuarios zurdos y cámaras frontales espejadas.
 *
 * NOTA DE AISLAMIENTO: este módulo es matemática pura (sin estado global de UI). La clasificación
 * estática de letras vive en `lescoAlphabetTrainerService.ts` y la gramática en
 * `lescoGrammarCoherenceService.ts`; aquí NO se duplica esa lógica.
 */

export interface HandLandmark3D {
  x: number;
  y: number;
  z?: number;
}

export interface NormalizedLandmark3D {
  x: number;
  y: number;
  z: number;
}

export interface Trajectory2DPoint {
  x: number;
  y: number;
  timestamp?: number;
}

export type PalmOrientation = 'frente' | 'dorso' | 'lateral' | 'abajo' | 'arriba';

export type SpatialBodyZone = 'sien_frente' | 'menton_boca' | 'pecho' | 'espacio_neutro';

export type SignKinematicsPhase = 'IDLE' | 'TRANSITION' | 'HOLD' | 'STROKE';

export interface NormalizedHandGeometry {
  /** 21 landmarks con origen en muñeca (0,0,0), escalados por ||p9 - p0|| y alineados planarmente */
  landmarks: NormalizedLandmark3D[];
  /** Coordenadas escaladas pero sin derotación planar (útiles para distinguir P/Q/G/H vs B/U/V) */
  scaleNormalizedLandmarks: NormalizedLandmark3D[];
  /** Posición original de la muñeca en coordenadas de cámara [0..1] */
  wristOrigin: NormalizedLandmark3D;
  /** Escala anatómica de la palma ||p9 - p0|| en el frame original */
  palmScale: number;
  /** Ángulo planar en radianes del eje muñeca(0) -> nudillo medio(9) respecto al eje vertical -Y */
  planarRotationRad: number;
}

export interface FingerExtensionState {
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
}

export interface FingerJointAnglesDeg {
  thumb: { pip: number; dip: number };
  index: { pip: number; dip: number };
  middle: { pip: number; dip: number };
  ring: { pip: number; dip: number };
  pinky: { pip: number; dip: number };
}

export interface NormalizedPinchDistances {
  thumbToIndex: number;
  thumbToMiddle: number;
  thumbToRing: number;
  thumbToPinky: number;
  indexToMiddleSpread: number;
}

export interface BiomechanicalFeatureDescriptor {
  /** Vector denso en R^78 listo para clasificadores TCN / BiLSTM / MLP */
  featureVector78: number[];
  /** Estado de extensión continuo [0..1] para cada uno de los 5 dedos */
  fingerExtensions: FingerExtensionState;
  /** Ángulos de flexión articular PIP y DIP de cada dedo en grados [0..180] */
  jointAnglesDeg: FingerJointAnglesDeg;
  /** Distancias de pinza y apertura interdigital normalizadas por escala de palma */
  pinchDistances: NormalizedPinchDistances;
  /** Orientación estimada de la palma según normal vectorial 3D e inclinación */
  palmOrientation: PalmOrientation;
  /** Zona espacial vertical/horizontal en el marco de cámara (locación fonológica LESCO) */
  spatialZone: SpatialBodyZone;
  /** Geometría 3D normalizada subyacente */
  geometry: NormalizedHandGeometry;
}

export interface SignBoundaryEvent {
  /** Fase cinemática actual */
  phase: SignKinematicsPhase;
  /** Energía cinética instantánea ponderada E_t = ||v_t||^2 */
  kineticEnergy: number;
  /** Energía cinética suavizada en la ventana deslizante */
  smoothedEnergy: number;
  /** Cantidad de frames consecutivos en estado HOLD estático */
  holdFrames: number;
  /** Cantidad de frames consecutivos en estado STROKE dinámico */
  strokeFrames: number;
  /** True en el instante exacto en que una postura estática alcanza el umbral de confirmación (>= 3 frames) */
  isStaticSignReady: boolean;
  /** True cuando finaliza un trazo dinámico (transición STROKE -> HOLD/IDLE) listo para evaluar por DTW */
  isDynamicStrokeCompleted: boolean;
  /** Trayectoria acumulada de la punta activa / centroide durante el último trazo */
  activeStrokeTrajectory: Trajectory2DPoint[];
}

export type DynamicLescoSignId =
  | 'Z'
  | 'J'
  | 'Ñ'
  | 'LL'
  | 'RR'
  | 'HOLA'
  | 'GRACIAS'
  | 'POR FAVOR'
  | 'SÍ'
  | 'NO';

export interface DynamicSignDTWMatch {
  sign: DynamicLescoSignId;
  dtwDistance: number;
  similarityScore: number; // [0..100]
  isCompatibleHandshape: boolean;
}

// ============================================================================
// UTILIDADES MATEMÁTICAS 3D
// ============================================================================

const EPSILON = 1e-6;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function vecSub(a: NormalizedLandmark3D, b: NormalizedLandmark3D): NormalizedLandmark3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vecNorm(v: NormalizedLandmark3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function dist3D(a: NormalizedLandmark3D, b: NormalizedLandmark3D): number {
  return vecNorm(vecSub(a, b));
}

function dot3D(a: NormalizedLandmark3D, b: NormalizedLandmark3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross3D(a: NormalizedLandmark3D, b: NormalizedLandmark3D): NormalizedLandmark3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Calcula el ángulo de flexión en grados en la articulación B formada por los segmentos A-B y B-C.
 * 0° significa segmentos completamente colineales (dedo recto),
 * valores mayores (ej. 90°..160°) indican flexión articular.
 */
export function computeJointFlexionDeg(
  a: NormalizedLandmark3D,
  b: NormalizedLandmark3D,
  c: NormalizedLandmark3D
): number {
  const v1 = vecSub(b, a);
  const v2 = vecSub(c, b);
  const n1 = vecNorm(v1);
  const n2 = vecNorm(v2);
  if (n1 < EPSILON || n2 < EPSILON) return 0;
  const cosTheta = clamp(dot3D(v1, v2) / (n1 * n2), -1, 1);
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

// ============================================================================
// 1. NORMALIZACIÓN GEOMÉTRICA INVARIANTE 3D
// ============================================================================

/**
 * Normaliza los 21 landmarks de MediaPipe Hands:
 * 1. Traslada el origen a la muñeca p_0 = (0, 0, 0).
 * 2. Escala todas las coordenadas por la longitud anatómica de la palma ||p_9 - p_0||.
 * 3. Calcula el ángulo de rotación planar del eje muñeca (0) -> nudillo medio (9)
 *    y rota las coordenadas para alinear la mano con el eje vertical canónico (-Y),
 *    logrando invarianza a traslación, distancia a la cámara e inclinación en el plano.
 */
export function normalizeHandLandmarks(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>
): NormalizedHandGeometry | null {
  if (!rawLandmarks || rawLandmarks.length < 21) {
    return null;
  }

  const pts: NormalizedLandmark3D[] = rawLandmarks.slice(0, 21).map((p) => ({
    x: Number(p.x) || 0,
    y: Number(p.y) || 0,
    z: Number(p.z) || 0,
  }));

  const wrist = pts[0];
  const middleMcp = pts[9];

  // Longitud anatómica de la palma ||p_9 - p_0||
  const palmVector = vecSub(middleMcp, wrist);
  const palmScale = Math.max(vecNorm(palmVector), EPSILON);

  if (palmScale < 0.015) {
    return null;
  }

  // Coordenadas trasladadas al origen y escaladas por longitud de palma
  const scaleNormalizedLandmarks: NormalizedLandmark3D[] = pts.map((p) => ({
    x: (p.x - wrist.x) / palmScale,
    y: (p.y - wrist.y) / palmScale,
    z: (p.z - wrist.z) / palmScale,
  }));

  // Ángulo de rotación planar respecto al eje vertical hacia arriba (0, -1)
  // En coordenadas de pantalla, hacia arriba es -Y.
  const vx = scaleNormalizedLandmarks[9].x;
  const vy = scaleNormalizedLandmarks[9].y;
  const planarRotationRad = Math.atan2(vx, -vy);

  const cosA = Math.cos(-planarRotationRad);
  const sinA = Math.sin(-planarRotationRad);

  const landmarks: NormalizedLandmark3D[] = scaleNormalizedLandmarks.map((p) => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA,
    z: p.z,
  }));

  return {
    landmarks,
    scaleNormalizedLandmarks,
    wristOrigin: { ...wrist },
    palmScale,
    planarRotationRad,
  };
}

// ============================================================================
// 2. EXTRACTOR DE DESCRIPTOR BIOMECÁNICO EN R^78
// ============================================================================

/**
 * Calcula el descriptor biomecánico completo en R^78 y metadatos fonológicos LESCO:
 * - 63 valores: coordenadas 3D normalizadas (21 puntos * 3)
 * - 5 valores: estado de extensión continuo [0..1] de los 5 dedos
 * - 5 valores: flexión articular media normalizada [0..1] (PIP + DIP) de cada dedo
 * - 5 valores: distancias de pinza normalizadas (thumbToIndex, thumbToMiddle, thumbToRing, thumbToPinky, indexToMiddleSpread)
 * Total = 63 + 5 + 5 + 5 = 78 dimensiones (R^78).
 */
export function extractBiomechanicalFeatures(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>
): BiomechanicalFeatureDescriptor | null {
  const geometry = normalizeHandLandmarks(rawLandmarks);
  if (!geometry) return null;

  const lm = geometry.landmarks;
  const sLm = geometry.scaleNormalizedLandmarks;

  // Ángulos de flexión PIP y DIP para cada dedo (en grados [0..180])
  const thumbAngles = {
    pip: computeJointFlexionDeg(lm[1], lm[2], lm[3]),
    dip: computeJointFlexionDeg(lm[2], lm[3], lm[4]),
  };
  const indexAngles = {
    pip: computeJointFlexionDeg(lm[5], lm[6], lm[7]),
    dip: computeJointFlexionDeg(lm[6], lm[7], lm[8]),
  };
  const middleAngles = {
    pip: computeJointFlexionDeg(lm[9], lm[10], lm[11]),
    dip: computeJointFlexionDeg(lm[10], lm[11], lm[12]),
  };
  const ringAngles = {
    pip: computeJointFlexionDeg(lm[13], lm[14], lm[15]),
    dip: computeJointFlexionDeg(lm[14], lm[15], lm[16]),
  };
  const pinkyAngles = {
    pip: computeJointFlexionDeg(lm[17], lm[18], lm[19]),
    dip: computeJointFlexionDeg(lm[18], lm[19], lm[20]),
  };

  const jointAnglesDeg: FingerJointAnglesDeg = {
    thumb: thumbAngles,
    index: indexAngles,
    middle: middleAngles,
    ring: ringAngles,
    pinky: pinkyAngles,
  };

  // Estado continuo de extensión [0..1] combinando razón de alcance radial y rectitud articular
  const computeFingerExtensionRatio = (
    mcpIdx: number,
    pipIdx: number,
    tipIdx: number,
    angles: { pip: number; dip: number }
  ): number => {
    const dTipWrist = dist3D(lm[tipIdx], lm[0]);
    const dPipWrist = Math.max(dist3D(lm[pipIdx], lm[0]), EPSILON);
    const dMcpTip = dist3D(lm[tipIdx], lm[mcpIdx]);

    const radialScore = clamp((dTipWrist / dPipWrist - 0.85) / 0.55, 0, 1);
    const straightnessScore = clamp(1 - (angles.pip + angles.dip) / 220, 0, 1);
    const spanScore = clamp(dMcpTip / 1.15, 0, 1);

    return Number(clamp(0.45 * radialScore + 0.35 * straightnessScore + 0.2 * spanScore, 0, 1).toFixed(4));
  };

  // Pulgar: apertura lateral + extensión interfalángica
  const thumbSpan = dist3D(lm[4], lm[5]);
  const thumbStraightness = clamp(1 - (thumbAngles.pip + thumbAngles.dip) / 140, 0, 1);
  const thumbExt = Number(clamp(0.6 * clamp((thumbSpan - 0.32) / 0.55, 0, 1) + 0.4 * thumbStraightness, 0, 1).toFixed(4));

  const fingerExtensions: FingerExtensionState = {
    thumb: thumbExt,
    index: computeFingerExtensionRatio(5, 6, 8, indexAngles),
    middle: computeFingerExtensionRatio(9, 10, 12, middleAngles),
    ring: computeFingerExtensionRatio(13, 14, 16, ringAngles),
    pinky: computeFingerExtensionRatio(17, 18, 20, pinkyAngles),
  };

  // Distancias de pinza normalizadas
  const pinchDistances: NormalizedPinchDistances = {
    thumbToIndex: Number(dist3D(lm[4], lm[8]).toFixed(4)),
    thumbToMiddle: Number(dist3D(lm[4], lm[12]).toFixed(4)),
    thumbToRing: Number(dist3D(lm[4], lm[16]).toFixed(4)),
    thumbToPinky: Number(dist3D(lm[4], lm[20]).toFixed(4)),
    indexToMiddleSpread: Number(dist3D(lm[8], lm[12]).toFixed(4)),
  };

  // Orientación estimada de la palma (usando coordenadas escaladas sin derotar)
  const vIndexMcp = vecSub(sLm[5], sLm[0]);
  const vPinkyMcp = vecSub(sLm[17], sLm[0]);
  const palmNormal = cross3D(vIndexMcp, vPinkyMcp);
  const middleAxis = sLm[9];

  let palmOrientation: PalmOrientation = 'frente';
  if (middleAxis.y > 0.45) {
    palmOrientation = 'abajo';
  } else if (Math.abs(middleAxis.x) > Math.abs(middleAxis.y) * 1.15) {
    palmOrientation = 'lateral';
  } else if (Math.abs(palmNormal.x) > Math.abs(palmNormal.z) * 1.35) {
    palmOrientation = 'lateral';
  } else if (palmNormal.y < -0.55) {
    palmOrientation = 'arriba';
  } else if (palmNormal.z > 0.15) {
    palmOrientation = 'dorso';
  } else {
    palmOrientation = 'frente';
  }

  // Zona espacial corporal según la altura de la muñeca y yema del índice en el encuadre [0..1]
  const refY = (geometry.wristOrigin.y + (rawLandmarks[8]?.y ?? geometry.wristOrigin.y)) * 0.5;
  let spatialZone: SpatialBodyZone = 'espacio_neutro';
  if (refY < 0.34) {
    spatialZone = 'sien_frente';
  } else if (refY < 0.52) {
    spatialZone = 'menton_boca';
  } else if (refY < 0.76) {
    spatialZone = 'pecho';
  } else {
    spatialZone = 'espacio_neutro';
  }

  // Construcción del vector denso en R^78:
  // [0..62]: 21 landmarks * (x, y, z) = 63 valores
  // [63..67]: 5 extensiones continuas [0..1]
  // [68..72]: 5 ángulos compuestos normalizados (pip + dip) / 360
  // [73..77]: 5 distancias de pinza normalizadas
  const coords63: number[] = [];
  for (let i = 0; i < 21; i++) {
    coords63.push(
      Number(lm[i].x.toFixed(4)),
      Number(lm[i].y.toFixed(4)),
      Number(lm[i].z.toFixed(4))
    );
  }

  const ext5 = [
    fingerExtensions.thumb,
    fingerExtensions.index,
    fingerExtensions.middle,
    fingerExtensions.ring,
    fingerExtensions.pinky,
  ];

  const jointNorm5 = [
    Number(((thumbAngles.pip + thumbAngles.dip) / 360).toFixed(4)),
    Number(((indexAngles.pip + indexAngles.dip) / 360).toFixed(4)),
    Number(((middleAngles.pip + middleAngles.dip) / 360).toFixed(4)),
    Number(((ringAngles.pip + ringAngles.dip) / 360).toFixed(4)),
    Number(((pinkyAngles.pip + pinkyAngles.dip) / 360).toFixed(4)),
  ];

  const pinch5 = [
    pinchDistances.thumbToIndex,
    pinchDistances.thumbToMiddle,
    pinchDistances.thumbToRing,
    pinchDistances.thumbToPinky,
    pinchDistances.indexToMiddleSpread,
  ];

  const featureVector78 = [...coords63, ...ext5, ...jointNorm5, ...pinch5];

  return {
    featureVector78,
    fingerExtensions,
    jointAnglesDeg,
    pinchDistances,
    palmOrientation,
    spatialZone,
    geometry,
  };
}

/** Dimensión del descriptor biomecánico denso. */
export const FEATURE_VECTOR_DIMENSION = 78;

/**
 * Distribución de índices [inicio, fin) dentro de `featureVector78`.
 * Útil para ponderar bloques (p.ej. similitud coseno por articulación en el entrenador del abecedario).
 */
export const FEATURE_VECTOR_LAYOUT = {
  coordinates: { start: 0, end: 63 },
  fingerExtensions: { start: 63, end: 68 },
  jointFlexion: { start: 68, end: 73 },
  pinchDistances: { start: 73, end: 78 },
} as const;

// ============================================================================
// 2b. MANO DOMINANTE / ESPEJO (USUARIOS ZURDOS Y CÁMARA FRONTAL)
// ============================================================================

export type HandSide = 'left' | 'right';

export interface HandednessEstimate {
  /** Mano anatómica estimada */
  side: HandSide;
  /** Confianza [0..1] */
  confidence: number;
  /** Fuente de la estimación */
  source: 'mediapipe' | 'geometry';
}

export interface HandednessDetectionOptions {
  /** Etiqueta de MediaPipe ('Left' | 'Right'), si está disponible */
  mediapipeLabel?: string | null;
  /** Score de MediaPipe asociado a la etiqueta [0..1] */
  mediapipeScore?: number;
  /**
   * MediaPipe asume imagen espejada (selfie). Si la imagen de entrada NO está espejada,
   * su etiqueta queda invertida; en ese caso pase `true` para corregirla.
   */
  mediapipeLabelSwapped?: boolean;
  /** True si los landmarks provienen de una imagen espejada (preview de cámara frontal) */
  isMirroredImage?: boolean;
}

/**
 * Estima la mano anatómica (izquierda/derecha) que realiza la seña.
 * - Si existe etiqueta de MediaPipe, se usa como fuente principal.
 * - En su defecto, usa la quiralidad 2D del triángulo muñeca(0)–índice MCP(5)–meñique MCP(17).
 *   Esta heurística asume palma hacia la cámara (caso dominante en dactilología); por la
 *   ambigüedad palma/dorso su confianza máxima se limita a 0.7.
 */
export function detectHandedness(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>,
  options: HandednessDetectionOptions = {}
): HandednessEstimate | null {
  const label = options.mediapipeLabel?.trim().toLowerCase();
  if (label === 'left' || label === 'right') {
    let side: HandSide = label;
    if (options.mediapipeLabelSwapped) side = side === 'left' ? 'right' : 'left';
    return {
      side,
      confidence: clamp(options.mediapipeScore ?? 0.9, 0, 1),
      source: 'mediapipe',
    };
  }

  if (!rawLandmarks || rawLandmarks.length < 21) return null;
  const w = rawLandmarks[0];
  const i5 = rawLandmarks[5];
  const p17 = rawLandmarks[17];
  const m9 = rawLandmarks[9];
  const ax = i5.x - w.x;
  const ay = i5.y - w.y;
  const bx = p17.x - w.x;
  const by = p17.y - w.y;
  // Componente Z del producto cruz en coordenadas de imagen (Y hacia abajo).
  // Mano derecha con palma a cámara en imagen NO espejada -> valor negativo.
  const crossZ = ax * by - ay * bx;
  const palm2 = Math.max((m9.x - w.x) ** 2 + (m9.y - w.y) ** 2, EPSILON);
  const strength = Math.abs(crossZ) / palm2;
  if (strength < 0.02) return null;

  let side: HandSide = crossZ < 0 ? 'right' : 'left';
  if (options.isMirroredImage) side = side === 'left' ? 'right' : 'left';

  return {
    side,
    confidence: Number((0.7 * clamp(strength / 0.35, 0, 1)).toFixed(3)),
    source: 'geometry',
  };
}

/**
 * Refleja horizontalmente los landmarks (x -> 1 - x) en coordenadas de imagen normalizadas [0..1].
 * Convierte una mano izquierda en su equivalente derecha (y viceversa), o deshace el espejo de la cámara frontal.
 */
export function mirrorHandLandmarks(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>
): NormalizedLandmark3D[] {
  return (rawLandmarks || []).map((p) => ({
    x: 1 - (Number(p.x) || 0),
    y: Number(p.y) || 0,
    z: Number(p.z) || 0,
  }));
}

/**
 * Lleva la mano al lado canónico (derecha por defecto) para que plantillas y centroides
 * entrenados con diestros sirvan también para usuarios zurdos.
 */
export function canonicalizeHandLandmarks(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>,
  side: HandSide,
  canonicalSide: HandSide = 'right'
): { landmarks: Array<{ x: number; y: number; z?: number }>; wasMirrored: boolean } {
  if (side === canonicalSide) {
    return { landmarks: rawLandmarks, wasMirrored: false };
  }
  return { landmarks: mirrorHandLandmarks(rawLandmarks), wasMirrored: true };
}

export interface HandFeatureExtractionOptions extends HandednessDetectionOptions {
  /** Mano conocida (p.ej. preferencia de usuario zurdo). Si se omite, se estima con `detectHandedness`. */
  handedness?: HandSide | HandednessEstimate | null;
  /** Lado canónico al que se refleja la mano antes de extraer features (default 'right'). */
  canonicalSide?: HandSide;
  /** Si es false no se refleja la mano aunque sea del lado opuesto (default true). */
  canonicalize?: boolean;
  /** Confianza mínima de la estimación geométrica para reflejar (default 0.35). */
  minHandednessConfidence?: number;
}

export interface HandFeatureExtractionResult extends BiomechanicalFeatureDescriptor {
  /** Mano anatómica estimada o provista (null si no se pudo determinar) */
  handedness: HandSide | null;
  /** True si los landmarks se reflejaron al lado canónico antes de extraer */
  wasMirrored: boolean;
}

/**
 * Extractor reutilizable de alto nivel: detección de mano dominante + canonicalización espejo +
 * normalización 3D invariante + descriptor R^78. Recomendado para el entrenador del abecedario
 * y el pipeline offline de videos.
 */
export function extractHandFeatures(
  rawLandmarks: Array<{ x: number; y: number; z?: number }>,
  options: HandFeatureExtractionOptions = {}
): HandFeatureExtractionResult | null {
  if (!rawLandmarks || rawLandmarks.length < 21) return null;

  let side: HandSide | null = null;
  let confident = false;
  const minConf = options.minHandednessConfidence ?? 0.35;
  if (typeof options.handedness === 'string') {
    side = options.handedness;
    confident = true;
  } else if (options.handedness) {
    side = options.handedness.side;
    confident = options.handedness.confidence >= minConf;
  } else {
    const est = detectHandedness(rawLandmarks, options);
    if (est) {
      side = est.side;
      confident = est.confidence >= minConf;
    }
  }

  let source = rawLandmarks;
  let wasMirrored = false;
  if (side && confident && options.canonicalize !== false) {
    const canon = canonicalizeHandLandmarks(rawLandmarks, side, options.canonicalSide ?? 'right');
    source = canon.landmarks;
    wasMirrored = canon.wasMirrored;
  }

  const descriptor = extractBiomechanicalFeatures(source);
  if (!descriptor) return null;
  return { ...descriptor, handedness: side, wasMirrored };
}

// ============================================================================
// 2c. SUAVIZADO TEMPORAL ONE-EURO (ANTI-JITTER DE LANDMARKS)
// ============================================================================

export interface OneEuroFilterOptions {
  /** Frecuencia de corte mínima en Hz (menor = más suave en reposo). Default 1.0 */
  minCutoff?: number;
  /** Coeficiente de velocidad (mayor = menos lag en movimiento rápido). Default 10 (coords [0..1]) */
  beta?: number;
  /** Frecuencia de corte para la derivada en Hz. Default 1.0 */
  dCutoff?: number;
}

/**
 * Filtro One-Euro (Casiez et al., CHI 2012): pasa-bajos adaptativo a la velocidad.
 * Elimina temblor en poses estáticas sin introducir lag perceptible en trazos rápidos.
 */
export class OneEuroFilter {
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrevSec: number | null = null;

  constructor(options: OneEuroFilterOptions = {}) {
    this.minCutoff = Math.max(options.minCutoff ?? 1.0, EPSILON);
    this.beta = Math.max(options.beta ?? 10, 0);
    this.dCutoff = Math.max(options.dCutoff ?? 1.0, EPSILON);
  }

  private static alpha(cutoffHz: number, dtSec: number): number {
    const tau = 1 / (2 * Math.PI * cutoffHz);
    return 1 / (1 + tau / dtSec);
  }

  public reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrevSec = null;
  }

  /** Filtra una muestra escalar. `timestampMs` en milisegundos. */
  public filter(value: number, timestampMs: number): number {
    const tSec = timestampMs / 1000;
    if (this.xPrev === null || this.tPrevSec === null) {
      this.xPrev = value;
      this.tPrevSec = tSec;
      this.dxPrev = 0;
      return value;
    }
    const dt = Math.max(tSec - this.tPrevSec, 1 / 240);
    this.tPrevSec = tSec;

    const dx = (value - this.xPrev) / dt;
    const aD = OneEuroFilter.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroFilter.alpha(cutoff, dt);
    const xHat = a * value + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    return xHat;
  }
}

export interface HandLandmarkSmootherOptions extends OneEuroFilterOptions {
  /** Hueco máximo entre frames antes de reiniciar el filtro (default 250 ms) */
  maxGapMs?: number;
}

/**
 * Aplica un `OneEuroFilter` independiente a cada eje de los 21 landmarks (63 filtros).
 * Usar una instancia por mano rastreada.
 */
export class HandLandmarkSmoother {
  private readonly filters: OneEuroFilter[];
  private readonly maxGapMs: number;
  private lastTimestampMs: number | null = null;

  constructor(options: HandLandmarkSmootherOptions = {}) {
    this.filters = Array.from({ length: 63 }, () => new OneEuroFilter(options));
    this.maxGapMs = options.maxGapMs ?? 250;
  }

  public reset(): void {
    this.filters.forEach((f) => f.reset());
    this.lastTimestampMs = null;
  }

  public smooth(
    landmarks: Array<{ x: number; y: number; z?: number }>,
    timestampMs: number = Date.now()
  ): NormalizedLandmark3D[] {
    if (!landmarks || landmarks.length < 21) {
      this.reset();
      return [];
    }
    if (
      this.lastTimestampMs !== null &&
      (timestampMs - this.lastTimestampMs > this.maxGapMs || timestampMs < this.lastTimestampMs)
    ) {
      this.reset();
    }
    this.lastTimestampMs = timestampMs;

    const out: NormalizedLandmark3D[] = new Array(21);
    for (let i = 0; i < 21; i++) {
      const p = landmarks[i];
      out[i] = {
        x: this.filters[i * 3].filter(Number(p.x) || 0, timestampMs),
        y: this.filters[i * 3 + 1].filter(Number(p.y) || 0, timestampMs),
        z: this.filters[i * 3 + 2].filter(Number(p.z) || 0, timestampMs),
      };
    }
    return out;
  }
}

// ============================================================================
// 3. DETECTOR DE FRONTERAS DE SEÑAS EN FLUJO CONTINUO (SignBoundaryTracker)
// ============================================================================

export interface SignBoundaryTrackerOptions {
  /** Umbral de energía cinética por debajo del cual se considera retención estática (Hold) */
  holdEnergyThreshold?: number;
  /** Umbral de energía cinética por encima del cual se considera transición brusca / reposición */
  transitionEnergyThreshold?: number;
  /** Número mínimo de frames consecutivos en baja energía para declarar HOLD (>= 3 por defecto) */
  minHoldFrames?: number;
  /** Tamaño de la ventana deslizante de energía cinética */
  energyWindowSize?: number;
  /** Máximo de puntos almacenados en el trazo dinámico actual */
  maxStrokeLength?: number;
}

const KEY_KINETIC_INDICES = [0, 4, 8, 12, 16, 20] as const;

/**
 * Rastreador de fronteras de señas en flujo continuo de cámara.
 * Evalúa la energía cinética instantánea E_t = ||v_t||^2 de la muñeca y las 5 yemas
 * para segmentar automáticamente entre:
 * - HOLD (Retención Estática >= 3 frames): ideal para disparar clasificación de letra estática.
 * - STROKE (Trazo Dinámico controlado): acumula la trayectoria 2D de la mano para DTW.
 * - TRANSITION (Reposición rápida): evita falsos positivos mientras la mano cambia de postura.
 */
export class SignBoundaryTracker {
  private readonly holdThreshold: number;
  private readonly transitionThreshold: number;
  private readonly minHoldFrames: number;
  private readonly energyWindowSize: number;
  private readonly maxStrokeLength: number;

  private prevLandmarks: Array<{ x: number; y: number; z?: number }> | null = null;
  private prevTimestamp: number = 0;
  private energyWindow: number[] = [];
  private holdCounter: number = 0;
  private strokeCounter: number = 0;
  private currentPhase: SignKinematicsPhase = 'IDLE';
  private strokeBuffer: Trajectory2DPoint[] = [];

  constructor(options: SignBoundaryTrackerOptions = {}) {
    this.holdThreshold = options.holdEnergyThreshold ?? 0.0012;
    this.transitionThreshold = options.transitionEnergyThreshold ?? 0.032;
    this.minHoldFrames = Math.max(3, options.minHoldFrames ?? 3);
    this.energyWindowSize = Math.max(3, options.energyWindowSize ?? 5);
    this.maxStrokeLength = options.maxStrokeLength ?? 36;
  }

  public reset(): void {
    this.prevLandmarks = null;
    this.prevTimestamp = 0;
    this.energyWindow = [];
    this.holdCounter = 0;
    this.strokeCounter = 0;
    this.currentPhase = 'IDLE';
    this.strokeBuffer = [];
  }

  /**
   * Actualiza el rastreador con los 21 landmarks del frame actual.
   */
  public update(
    landmarks: Array<{ x: number; y: number; z?: number }> | null,
    timestampMs: number = Date.now()
  ): SignBoundaryEvent {
    if (!landmarks || landmarks.length < 21) {
      const completedFromDrop = this.strokeCounter >= 4 && this.strokeBuffer.length >= 5;
      const snapshotTrajectory = completedFromDrop ? [...this.strokeBuffer] : [];
      this.reset();
      return {
        phase: 'IDLE',
        kineticEnergy: 0,
        smoothedEnergy: 0,
        holdFrames: 0,
        strokeFrames: 0,
        isStaticSignReady: false,
        isDynamicStrokeCompleted: completedFromDrop,
        activeStrokeTrajectory: snapshotTrajectory,
      };
    }

    // Punto representativo para la trayectoria (combinación de yema del índice 8, meñique 20 y muñeca 0)
    const trackedPoint: Trajectory2DPoint = {
      x: landmarks[8].x * 0.5 + landmarks[0].x * 0.3 + landmarks[20].x * 0.2,
      y: landmarks[8].y * 0.5 + landmarks[0].y * 0.3 + landmarks[20].y * 0.2,
      timestamp: timestampMs,
    };

    let instantEnergy = 0;
    if (this.prevLandmarks && this.prevLandmarks.length >= 21) {
      const dtSec = Math.max((timestampMs - this.prevTimestamp) / 1000, 1 / 120);
      // Normalización temporal a paso nominal de 30 fps (1/30 s)
      const timeScale = clamp((1 / 30) / dtSec, 0.25, 3.0);

      let sumSq = 0;
      for (const idx of KEY_KINETIC_INDICES) {
        const dx = (landmarks[idx].x - this.prevLandmarks[idx].x) * timeScale;
        const dy = (landmarks[idx].y - this.prevLandmarks[idx].y) * timeScale;
        const dz = ((landmarks[idx].z ?? 0) - (this.prevLandmarks[idx].z ?? 0)) * 0.5 * timeScale;
        sumSq += dx * dx + dy * dy + dz * dz;
      }
      instantEnergy = sumSq / KEY_KINETIC_INDICES.length;
    }

    this.prevLandmarks = landmarks.map((p) => ({ ...p }));
    this.prevTimestamp = timestampMs;

    this.energyWindow.push(instantEnergy);
    if (this.energyWindow.length > this.energyWindowSize) {
      this.energyWindow.shift();
    }

    const smoothedEnergy =
      this.energyWindow.reduce((acc, v) => acc + v, 0) / this.energyWindow.length;

    let isStaticSignReady = false;
    let isDynamicStrokeCompleted = false;
    let exportedTrajectory: Trajectory2DPoint[] = [];

    if (smoothedEnergy < this.holdThreshold) {
      this.holdCounter += 1;

      // Si veníamos de un trazo dinámico sostenido y ahora la mano se detiene, cerramos el trazo
      if (this.strokeCounter >= 4 && this.strokeBuffer.length >= 5) {
        isDynamicStrokeCompleted = true;
        exportedTrajectory = [...this.strokeBuffer];
      }

      this.strokeCounter = 0;
      this.strokeBuffer = [trackedPoint];

      if (this.holdCounter >= this.minHoldFrames) {
        this.currentPhase = 'HOLD';
        if (this.holdCounter === this.minHoldFrames) {
          isStaticSignReady = true;
        }
      }
    } else if (smoothedEnergy <= this.transitionThreshold) {
      // Energía intermedia controlada -> Trazo Dinámico (STROKE)
      this.currentPhase = 'STROKE';
      this.holdCounter = 0;
      this.strokeCounter += 1;
      this.strokeBuffer.push(trackedPoint);
      if (this.strokeBuffer.length > this.maxStrokeLength) {
        this.strokeBuffer.shift();
      }
      exportedTrajectory = [...this.strokeBuffer];
    } else {
      // Energía muy alta -> Reposición brusca o transición entre señas
      this.currentPhase = 'TRANSITION';
      this.holdCounter = 0;
      this.strokeCounter = 0;
      this.strokeBuffer = [trackedPoint];
    }

    return {
      phase: this.currentPhase,
      kineticEnergy: Number(instantEnergy.toFixed(6)),
      smoothedEnergy: Number(smoothedEnergy.toFixed(6)),
      holdFrames: this.holdCounter,
      strokeFrames: this.strokeCounter,
      isStaticSignReady,
      isDynamicStrokeCompleted,
      activeStrokeTrajectory:
        exportedTrajectory.length > 0 ? exportedTrajectory : [...this.strokeBuffer],
    };
  }
}

// ============================================================================
// 4. DYNAMIC TIME WARPING (DTW) CON VENTANA DE SAKOE-CHIBA Y PROTOTIPOS LESCO
// ============================================================================

/**
 * Re-muestrea y normaliza una trayectoria 2D a N puntos equidistantes en la caja unitaria [-1, 1]^2,
 * conservando la relación de aspecto para distinguir trazos puramente horizontales (LL, RR, NO)
 * de trazos verticales (SÍ, GRACIAS) o bidimensionales (Z, J, POR FAVOR).
 */
export function normalizeTrajectory2D(
  points: Trajectory2DPoint[],
  targetLength: number = 16
): Trajectory2DPoint[] {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    return Array.from({ length: targetLength }, () => ({ x: 0, y: 0 }));
  }

  // 1. Calcular longitud de arco acumulada
  const cumDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cumDist.push(cumDist[i - 1] + seg);
  }
  const totalArc = cumDist[cumDist.length - 1];

  if (totalArc < EPSILON) {
    return Array.from({ length: targetLength }, () => ({ x: 0, y: 0 }));
  }

  // 2. Interpolación lineal uniforme en longitud de arco
  const resampled: Trajectory2DPoint[] = [];
  for (let k = 0; k < targetLength; k++) {
    const targetD = (k / (targetLength - 1)) * totalArc;
    let idx = 0;
    while (idx < cumDist.length - 2 && cumDist[idx + 1] < targetD) {
      idx++;
    }
    const d0 = cumDist[idx];
    const d1 = cumDist[idx + 1];
    const ratio = d1 - d0 > EPSILON ? (targetD - d0) / (d1 - d0) : 0;
    resampled.push({
      x: points[idx].x + ratio * (points[idx + 1].x - points[idx].x),
      y: points[idx].y + ratio * (points[idx + 1].y - points[idx].y),
    });
  }

  // 3. Centrado en el centroide y escalado isotrópico por el rango máximo
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const p of resampled) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }

  const cx = sumX / resampled.length;
  const cy = sumY / resampled.length;
  const span = Math.max(maxX - minX, maxY - minY, EPSILON);

  return resampled.map((p) => ({
    x: ((p.x - cx) / span) * 2,
    y: ((p.y - cy) / span) * 2,
  }));
}

/**
 * Plantillas prototipo canónicas 2D (16 puntos en [-1, 1]^2) para las señas dinámicas LESCO:
 * - Z: Zigzag horizontal-diagonal-horizontal
 * - J: Descenso vertical seguido de gancho curvo hacia adentro
 * - Ñ: Onda / oscilación horizontal corta de ida y vuelta
 * - LL: Deslizamiento lateral continuo
 * - RR: Deslizamiento lateral continuo con ligera vibración
 * - HOLA: Arco oscilante lateral de saludo
 * - GRACIAS: Avance descendente desde el mentón hacia el frente/abajo
 * - POR FAVOR: Rotación circular sobre el pecho
 * - SÍ: Cabeceo vertical arriba-abajo-arriba
 * - NO: Cierre rápido convergente horizontal/oblicuo
 */
export const DYNAMIC_SIGN_PROTOTYPES: Record<DynamicLescoSignId, Trajectory2DPoint[]> = {
  Z: normalizeTrajectory2D([
    { x: -1.0, y: -0.9 },
    { x: 0.0, y: -0.9 },
    { x: 1.0, y: -0.9 },
    { x: 0.3, y: -0.3 },
    { x: -0.3, y: 0.3 },
    { x: -1.0, y: 0.9 },
    { x: 0.0, y: 0.9 },
    { x: 1.0, y: 0.9 },
  ]),
  J: normalizeTrajectory2D([
    { x: 0.5, y: -1.0 },
    { x: 0.5, y: -0.3 },
    { x: 0.45, y: 0.4 },
    { x: 0.2, y: 0.85 },
    { x: -0.25, y: 1.0 },
    { x: -0.7, y: 0.75 },
    { x: -0.85, y: 0.35 },
  ]),
  Ñ: normalizeTrajectory2D([
    { x: -0.9, y: -0.1 },
    { x: -0.3, y: 0.2 },
    { x: 0.3, y: -0.2 },
    { x: 0.9, y: 0.1 },
    { x: 0.2, y: 0.2 },
    { x: -0.5, y: -0.1 },
  ]),
  LL: normalizeTrajectory2D([
    { x: -1.0, y: 0.0 },
    { x: -0.5, y: 0.02 },
    { x: 0.0, y: 0.0 },
    { x: 0.5, y: -0.02 },
    { x: 1.0, y: 0.0 },
  ]),
  RR: normalizeTrajectory2D([
    { x: -1.0, y: -0.05 },
    { x: -0.5, y: 0.06 },
    { x: 0.0, y: -0.05 },
    { x: 0.5, y: 0.06 },
    { x: 1.0, y: 0.0 },
  ]),
  HOLA: normalizeTrajectory2D([
    { x: -0.9, y: 0.2 },
    { x: -0.3, y: -0.35 },
    { x: 0.4, y: -0.35 },
    { x: 0.95, y: 0.2 },
    { x: 0.2, y: -0.25 },
    { x: -0.5, y: 0.1 },
  ]),
  GRACIAS: normalizeTrajectory2D([
    { x: 0.0, y: -1.0 },
    { x: 0.05, y: -0.5 },
    { x: 0.1, y: 0.0 },
    { x: 0.12, y: 0.5 },
    { x: 0.15, y: 1.0 },
  ]),
  'POR FAVOR': normalizeTrajectory2D([
    { x: 0.0, y: -1.0 },
    { x: 0.7, y: -0.7 },
    { x: 1.0, y: 0.0 },
    { x: 0.7, y: 0.7 },
    { x: 0.0, y: 1.0 },
    { x: -0.7, y: 0.7 },
    { x: -1.0, y: 0.0 },
    { x: -0.7, y: -0.7 },
    { x: 0.0, y: -1.0 },
  ]),
  SÍ: normalizeTrajectory2D([
    { x: 0.0, y: -0.9 },
    { x: 0.0, y: 0.2 },
    { x: 0.0, y: 0.95 },
    { x: 0.0, y: -0.4 },
    { x: 0.0, y: 0.7 },
  ]),
  NO: normalizeTrajectory2D([
    { x: -0.8, y: -0.25 },
    { x: 0.6, y: 0.25 },
    { x: -0.6, y: -0.2 },
    { x: 0.8, y: 0.25 },
  ]),
};

/**
 * Calcula la distancia Dynamic Time Warping (DTW) normalizada por longitud de camino
 * entre dos trayectorias 2D aplicando una banda de restricción de Sakoe-Chiba.
 */
export function computeTrajectoryDTW(
  seqA: Trajectory2DPoint[],
  seqB: Trajectory2DPoint[],
  sakoeChibaBandRatio: number = 0.35
): number {
  const n = seqA.length;
  const m = seqB.length;
  if (n === 0 || m === 0) return Infinity;

  const band = Math.max(2, Math.ceil(Math.max(n, m) * clamp(sakoeChibaBandRatio, 0.1, 1.0)));
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(Infinity)
  );
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - band);
    const jEnd = Math.min(m, i + band);
    for (let j = jStart; j <= jEnd; j++) {
      const cost = Math.hypot(seqA[i - 1].x - seqB[j - 1].x, seqA[i - 1].y - seqB[j - 1].y);
      const prevMin = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      dp[i][j] = cost + prevMin;
    }
  }

  return dp[n][m] / (n + m);
}

/**
 * Evalúa si la configuración biomecánica de la mano es compatible con una seña dinámica específica.
 */
function isHandshapeCompatibleWithDynamicSign(
  sign: DynamicLescoSignId,
  features?: BiomechanicalFeatureDescriptor | null
): boolean {
  if (!features) return true;
  const ext = features.fingerExtensions;
  const pinch = features.pinchDistances;

  switch (sign) {
    case 'Z':
      // Solo índice extendido
      return ext.index > 0.55 && ext.middle < 0.45 && ext.ring < 0.45 && ext.pinky < 0.45;
    case 'J':
      // Solo meñique extendido
      return ext.pinky > 0.55 && ext.index < 0.45 && ext.middle < 0.45 && ext.ring < 0.45;
    case 'LL':
      // Postura de L: índice y pulgar abiertos
      return ext.index > 0.55 && ext.thumb > 0.48 && ext.middle < 0.45 && ext.ring < 0.45;
    case 'RR':
      // Índice y medio extendidos y juntos
      return ext.index > 0.55 && ext.middle > 0.55 && pinch.indexToMiddleSpread < 0.35 && ext.ring < 0.48;
    case 'Ñ':
      // Dedos flexionados hacia abajo (postura N)
      return ext.ring < 0.45 && ext.pinky < 0.45;
    case 'HOLA':
      // Palma abierta (al menos 3-4 dedos extendidos)
      return ext.index > 0.5 && ext.middle > 0.5 && ext.ring > 0.45 && ext.pinky > 0.45;
    case 'GRACIAS':
      // Mano abierta descendiendo desde mentón/boca
      return ext.index > 0.5 && ext.middle > 0.5 && ext.ring > 0.45;
    case 'POR FAVOR':
      // Palma abierta sobre el pecho
      return ext.index > 0.5 && ext.middle > 0.5 && ext.ring > 0.45;
    case 'SÍ':
      // Puño cerrado
      return ext.index < 0.45 && ext.middle < 0.45 && ext.ring < 0.45 && ext.pinky < 0.45;
    case 'NO':
      // Pinza índice/medio con pulgar
      return pinch.thumbToIndex < 0.55 || (ext.ring < 0.45 && ext.pinky < 0.45);
    default:
      return true;
  }
}

/**
 * Compara una trayectoria capturada contra todas las plantillas prototipo de señas dinámicas LESCO
 * usando DTW con ventana de Sakoe-Chiba (evalúa tanto la dirección original como la reflejada en X
 * para soportar mano izquierda/derecha y cámara frontal con o sin espejo).
 */
export function matchDynamicSignTrajectory(
  capturedTrajectory: Trajectory2DPoint[],
  biomechanicalFeatures?: BiomechanicalFeatureDescriptor | null,
  sakoeChibaBandRatio: number = 0.35
): DynamicSignDTWMatch | null {
  if (!capturedTrajectory || capturedTrajectory.length < 5) {
    return null;
  }

  // Verificar desplazamiento mínimo real para no confundir temblor estático con trazo
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of capturedTrajectory) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const totalSpan = Math.hypot(maxX - minX, maxY - minY);
  if (totalSpan < 0.04) {
    return null;
  }

  const normalizedInput = normalizeTrajectory2D(capturedTrajectory, 16);
  const mirroredInput = normalizedInput.map((p) => ({ x: -p.x, y: p.y }));

  const candidates: DynamicSignDTWMatch[] = [];

  (Object.keys(DYNAMIC_SIGN_PROTOTYPES) as DynamicLescoSignId[]).forEach((sign) => {
    const prototype = DYNAMIC_SIGN_PROTOTYPES[sign];
    const dDirect = computeTrajectoryDTW(normalizedInput, prototype, sakoeChibaBandRatio);
    // Para señas simétricas al espejo lateral (LL, RR, HOLA, Ñ, POR FAVOR, NO), permitimos inversión horizontal
    const allowMirror = sign !== 'Z' && sign !== 'J';
    const dMirror = allowMirror
      ? computeTrajectoryDTW(mirroredInput, prototype, sakoeChibaBandRatio)
      : dDirect * 1.15;

    const rawDtw = Math.min(dDirect, dMirror);
    const compatible = isHandshapeCompatibleWithDynamicSign(sign, biomechanicalFeatures);

    // Penalización si la morfología de la mano no corresponde a la seña dinámica
    const effectiveDtw = compatible ? rawDtw : rawDtw + 0.45;
    const similarityScore = Math.round(clamp((1 - effectiveDtw / 1.1) * 100, 0, 99));

    candidates.push({
      sign,
      dtwDistance: Number(effectiveDtw.toFixed(4)),
      similarityScore,
      isCompatibleHandshape: compatible,
    });
  });

  candidates.sort((a, b) => a.dtwDistance - b.dtwDistance);
  const best = candidates[0];

  if (!best || best.similarityScore < 55) {
    return null;
  }

  return best;
}
