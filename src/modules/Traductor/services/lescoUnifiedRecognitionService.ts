/**
 * @file lescoUnifiedRecognitionService.ts
 * @description Motor Unificado de Reconocimiento de Señas y Letras LESCO de Ultra-Alta Precisión.
 *
 * Integra en una arquitectura en cascada con fusión probabilística:
 * 1. Suavizado temporal One-Euro para eliminar temblores de cámara y variaciones inter-frame.
 * 2. Detector de fase cinemática (SignBoundaryTracker: IDLE, TRANSITION, HOLD, STROKE).
 * 3. Reconocedor de Señas Dinámicas con Sakoe-Chiba DTW (J, Z, Ñ, LL, RR, HOLA, GRACIAS, etc.).
 * 4. Desempate Querológico Biomecánico Fino para los 8 pares de máxima confusión en LESCO:
 *    - A ↔ S ↔ E ↔ O ↔ T (posición 3D del pulgar, contacto de yemas, tensión de nudillos).
 *    - U ↔ V (ángulo interdigital θ exacto y paralelismo entre índice y medio).
 *    - D ↔ 1 ↔ I (anillo cerrado pulgar-medio vs puño con índice o meñique).
 *    - G ↔ H ↔ CH (eje horizontal de proyección, 1 vs 2 dedos extendidos).
 *    - P ↔ Q ↔ K (inversión gravitatoria y dedo medio perpendicular hacia abajo).
 *    - F ↔ B (anillo índice-pulgar vs palma plana de 4 dedos).
 *    - K ↔ V ↔ R ↔ RR (pulgar en bifurcación vs dedos abiertos vs cruzados).
 *    - W ↔ M ↔ 3 (orientación vertical vs colgada hacia abajo).
 * 5. Clasificador Estadístico KNN ponderado por distancia inversa sobre 6,941 muestras reales.
 * 6. Re-ranking Bayesiano contextual usando afinidad de bigramas del corpus LESCO.
 */

import {
  HandLandmark3D,
  NormalizedLandmark3D,
  Trajectory2DPoint,
  normalizeHandLandmarks,
  extractBiomechanicalFeatures,
  matchDynamicSignTrajectory,
  HandLandmarkSmoother,
  OneEuroFilter,
  DynamicSignDTWMatch,
  BiomechanicalFeatureDescriptor,
} from './lescoKeypointPipelineService';

import {
  classifyTrainedAlphabetLesco,
  getTrainedLescoLandmarkTemplate,
  AlphabetClassificationResult,
  LescoAlphabetSignId,
  LESCO_ALPHABET_TEMPLATES,
} from './lescoAlphabetTrainerService';

import {
  classifyWithKNN,
  isKNNModelAvailable,
} from './lescoKNNClassifier';

import {
  getLescoBigramAffinity,
} from './lescoGrammarCoherenceService';

export interface UnifiedRecognitionOptions {
  enableOneEuroFilter?: boolean;
  enableDynamicDTW?: boolean;
  enableBiomechanicalTiebreaker?: boolean;
  enableKNNStatisticalModel?: boolean;
  previousLetterContext?: string;
  minConfidenceThreshold?: number;
  isFrontCamera?: boolean;
}

export interface UnifiedRecognitionResult {
  letter: string;
  confidence: number; // 0 a 100
  isDynamic: boolean;
  engine: 'dtw_dynamic' | 'biomechanical_exact' | 'knn_statistical' | 'hybrid_fusion';
  dtwDistance?: number;
  biomechanicalSignature?: string;
  topAlternatives: Array<{ letter: string; confidence: number; engine?: string }>;
}

/** Instancia única del suavizador One-Euro para el flujo en tiempo real */
const globalSmoother = new HandLandmarkSmoother({
  minCutoff: 1.2,
  beta: 0.05,
  dCutoff: 1.0,
});

/**
 * Calcula el ángulo en grados entre dos vectores 2D o 3D (A -> B y A -> C).
 */
function computeAngleBetweenVectorsDeg(
  origin: { x: number; y: number; z?: number },
  ptA: { x: number; y: number; z?: number },
  ptB: { x: number; y: number; z?: number }
): number {
  const v1 = { x: ptA.x - origin.x, y: ptA.y - origin.y, z: (ptA.z ?? 0) - (origin.z ?? 0) };
  const v2 = { x: ptB.x - origin.x, y: ptB.y - origin.y, z: (ptB.z ?? 0) - (origin.z ?? 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 < 1e-6 || mag2 < 1e-6) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Desempate Querológico de Alta Precisión.
 * Evalúa las relaciones anatómicas sutiles que confunden a clasificadores genéricos.
 */
export function resolveQuerologicalAmbiguity(
  landmarks: HandLandmark3D[],
  bio: BiomechanicalFeatureDescriptor,
  knnCandidate?: string
): { letter: string; confidence: number; rule: string } | null {
  const ext = bio.fingerExtensions;
  const pinch = bio.pinchDistances;
  const angles = bio.jointAnglesDeg;
  const pts = bio.geometry.landmarks;

  const wrist = pts[0];
  const thumbTip = pts[4];
  const thumbIp = pts[3];
  const thumbMcp = pts[2];
  const indexTip = pts[8];
  const indexMcp = pts[5];
  const indexPip = pts[6];
  const middleTip = pts[12];
  const middleMcp = pts[9];
  const middlePip = pts[10];
  const ringTip = pts[16];
  const ringMcp = pts[13];
  const pinkyTip = pts[20];
  const pinkyMcp = pts[17];

  // Escala de la palma (en landmarks derotados ||p9 - p0|| = 1.0)
  const palmScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 1.0;

  const distNorm = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y) / palmScale;

  const rawIndexMcp = bio.geometry.scaleNormalizedLandmarks[5];
  const rawIndexTip = bio.geometry.scaleNormalizedLandmarks[8];
  const rawMiddleMcp = bio.geometry.scaleNormalizedLandmarks[9];
  const rawMiddleTip = bio.geometry.scaleNormalizedLandmarks[12];

  const dxIndexRaw = rawIndexTip.x - rawIndexMcp.x;
  const dyIndexRaw = rawIndexTip.y - rawIndexMcp.y;
  const isIndexHorizontal = Math.abs(dxIndexRaw) > Math.abs(dyIndexRaw) * 1.1;
  const isPalmDownward =
    bio.palmOrientation === 'abajo' ||
    rawMiddleMcp.y > 0.25 ||
    (rawIndexTip.y > 0.2 && rawMiddleTip.y > 0.2) ||
    Math.abs(bio.geometry.planarRotationRad) > 2.1;

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 1: PUÑOS Y SEÑAS COMPACTAS (A vs S vs E vs T vs X vs O)
  // ─────────────────────────────────────────────────────────────────────────────
  const isFistClosed = ext.index < 0.28 && ext.middle < 0.28 && ext.ring < 0.28 && ext.pinky < 0.28;

  if (isFistClosed) {
    const dThumbIndexTip = distNorm(thumbTip, indexTip);
    const dThumbMiddleTip = distNorm(thumbTip, middleTip);
    const dThumbIndexMcp = distNorm(thumbTip, indexMcp);
    const dThumbMiddlePip = distNorm(thumbTip, middlePip);

    // X: Dedo índice erguido en gancho (su PIP está claramente más alto que los otros 3 dedos cerrados)
    if (ext.index <= 0.65 && indexPip.y < middlePip.y - 0.08 * palmScale) {
      return { letter: 'X', confidence: 98, rule: 'hooked_index_finger_X' };
    }

    // A: Pulgar erguido verticalmente al costado exterior del índice (no cruza sobre los dedos)
    const isThumbLateralExterior =
      thumbTip.x < indexMcp.x - 0.04 * palmScale &&
      thumbTip.y < indexPip.y + 0.15 * palmScale;

    if (isThumbLateralExterior) {
      return { letter: 'A', confidence: 98, rule: 'fist_thumb_lateral_upright_A' };
    }

    // T: Pulgar asoma entre el dedo índice y el medio
    const isThumbBetweenIndexAndMiddle =
      thumbTip.x >= indexMcp.x - 0.05 * palmScale &&
      thumbTip.x <= middleMcp.x + 0.06 * palmScale &&
      thumbTip.y <= middleMcp.y + 0.25 * palmScale;

    if (isThumbBetweenIndexAndMiddle) {
      return { letter: 'T', confidence: 97, rule: 'fist_thumb_between_index_middle_T' };
    }

    // S: Pulgar cruzado FRONTALMENTE sobre los nudillos medios (cubre el dedo índice y medio)
    const isThumbCrossedOverFingers =
      thumbTip.x > indexPip.x - 0.02 * palmScale &&
      thumbTip.y > middleMcp.y - 0.10 * palmScale &&
      dThumbMiddlePip < 0.55 &&
      thumbTip.x > indexMcp.x;

    if (isThumbCrossedOverFingers) {
      return { letter: 'S', confidence: 98, rule: 'fist_thumb_crossed_over_knuckles_S' };
    }

    // O: Círculo cerrado / óvalo (yemas de índice y medio convergen al pulgar formando el hueco)
    if (dThumbIndexTip < 0.40 && dThumbMiddleTip < 0.44 && ext.thumb > 0.35) {
      return { letter: 'O', confidence: 99, rule: 'fist_circle_O' };
    }

    // E: Yemas de los dedos replegadas descansando sobre el pulgar
    return { letter: 'E', confidence: 96, rule: 'fist_claws_resting_on_thumb_E' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 2: DESCENDENTES (P vs Q vs M vs N)
  // ─────────────────────────────────────────────────────────────────────────────
  const isDescendingFingers =
    (isPalmDownward ||
      (indexTip.y > indexMcp.y + 0.05 * palmScale && middleTip.y > middleMcp.y + 0.05 * palmScale)) &&
    ext.pinky < 0.40;

  if (isDescendingFingers) {
    // P: Como una K invertida apuntando hacia el suelo (índice y medio extendidos hacia abajo)
    if (ext.index > 0.35 && ext.middle > 0.35 && ext.ring < 0.35) {
      return { letter: 'P', confidence: 98, rule: 'inverted_k_downward_P' };
    }
    // Q: Como una pinza índice + pulgar apuntando hacia el suelo (índice extendido, medio cerrado en puño)
    if (ext.index > 0.35 && ext.middle < 0.26 && ext.ring < 0.28 && pinch.thumbToIndex < 0.45) {
      return { letter: 'Q', confidence: 97, rule: 'pinch_downward_Q' };
    }
    // M: 3 dedos (índice, medio, anular) doblados colgando sobre el pulgar
    if (ext.index < 0.60 && ext.ring > 0.28) {
      return { letter: 'M', confidence: 96, rule: 'three_fingers_hanging_M' };
    }
    // N: 2 dedos (índice, medio) doblados colgando sobre el pulgar
    if (ext.index < 0.60) {
      return { letter: 'N', confidence: 96, rule: 'two_fingers_hanging_N' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 1.2: O (Círculo abierto/óvalo entre todos los dedos y el pulgar)
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    distNorm(thumbTip, indexTip) < 0.42 &&
    distNorm(thumbTip, middleTip) < 0.45 &&
    ext.index >= 0.25 && ext.index <= 0.65 &&
    ext.middle >= 0.25 && ext.middle <= 0.65 &&
    ext.ring < 0.65 && ext.pinky < 0.65
  ) {
    return { letter: 'O', confidence: 99, rule: 'circle_oval_O' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 1.5: X fuera de puño estricto
  // ─────────────────────────────────────────────────────────────────────────────
  if (
    !isIndexHorizontal &&
    !isPalmDownward &&
    ext.index <= 0.65 &&
    ext.middle < 0.35 &&
    ext.ring < 0.35 &&
    ext.pinky < 0.35 &&
    indexPip.y < middlePip.y - 0.08 * palmScale
  ) {
    return { letter: 'X', confidence: 98, rule: 'hooked_index_finger_X' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 2: HORIZONTALES (G vs H vs CH)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isIndexHorizontal) {
    const dIndexMiddleHoriz = distNorm(indexTip, middleTip);
    const isMiddleAlsoExtended = ext.middle > 0.55;

    if (isMiddleAlsoExtended && dIndexMiddleHoriz < 0.35) {
      // 2 dedos horizontales juntos = H o CH
      if (knnCandidate === 'CH') {
        return { letter: 'CH', confidence: 97, rule: 'two_fingers_horizontal_CH' };
      }
      return { letter: 'H', confidence: 98, rule: 'two_fingers_horizontal_H' };
    } else if (ext.middle < 0.35 && ext.ring < 0.35 && ext.pinky < 0.35) {
      // 1 dedo índice horizontal + pulgar extendido paralelo = G
      return { letter: 'G', confidence: 98, rule: 'single_index_horizontal_thumb_parallel_G' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 3: U vs V vs R vs K (VERTICALES DE 2 DEDOS)
  // ─────────────────────────────────────────────────────────────────────────────
  const isIndexUp = ext.index > 0.65;
  const isMiddleUp = ext.middle > 0.65;
  const isRingDown = ext.ring < 0.32;
  const isPinkyDown = ext.pinky < 0.32;

  if (!isIndexHorizontal && isIndexUp && isMiddleUp && isRingDown && isPinkyDown && !isPalmDownward) {
    const angleU_V = computeAngleBetweenVectorsDeg(middleMcp, indexTip, middleTip);
    const dIndexMiddleTip = distNorm(indexTip, middleTip);

    // Si los dedos están cruzados -> R
    const areFingersCrossed =
      (indexTip.x > middleTip.x && indexMcp.x < middleMcp.x) ||
      (indexTip.x < middleTip.x && indexMcp.x > middleMcp.x) ||
      (Math.abs(indexTip.x - middleTip.x) < 0.08 * palmScale && dIndexMiddleTip < 0.16);

    if (areFingersCrossed) {
      return { letter: 'R', confidence: 98, rule: 'fingers_crossed_R' };
    }

    // K: Pulgar colocado entre índice y medio apuntando hacia adelante
    const dThumbMiddleBifurcation = distNorm(thumbTip, {
      x: (indexMcp.x + middleMcp.x) / 2,
      y: (indexMcp.y + middleMcp.y) / 2,
    });
    if (dThumbMiddleBifurcation < 0.35 && ext.thumb > 0.30) {
      return { letter: 'K', confidence: 98, rule: 'thumb_in_v_bifurcation_K' };
    }

    // U vs V: Umbral querológico angular estricto
    // U: Dedos paralelos juntos (ángulo < 14° o separación mínima)
    // V: Dedos abiertos en V (ángulo >= 14° y separación clara)
    if (angleU_V >= 14.0 || dIndexMiddleTip > 0.30) {
      return { letter: 'V', confidence: 99, rule: `fingers_spread_angle_${angleU_V.toFixed(1)}_V` };
    } else {
      return { letter: 'U', confidence: 98, rule: `fingers_parallel_angle_${angleU_V.toFixed(1)}_U` };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 4: D vs 1 vs I vs Y vs L
  // ─────────────────────────────────────────────────────────────────────────────
  // I / Y: Meñique extendido mientras índice, medio y anular están cerrados
  if (ext.pinky > 0.65 && ext.index < 0.32 && ext.middle < 0.32 && ext.ring < 0.32) {
    // Si además el pulgar está abierto hacia el lado (ext > 0.65) -> Y
    if (ext.thumb > 0.65 && distNorm(thumbTip, indexMcp) > 0.40) {
      return { letter: 'Y', confidence: 99, rule: 'pinky_and_thumb_extended_Y' };
    }
    return { letter: 'I', confidence: 99, rule: 'only_pinky_extended_I' };
  }

  // L vs D (Índice erguido verticalmente, medio/anular/meñique abajo):
  if (!isIndexHorizontal && isIndexUp && isMiddleDown(ext) && isRingDown && isPinkyDown) {
    const dThumbIndexTip = distNorm(thumbTip, indexTip);
    const dThumbMiddleLoop = distNorm(thumbTip, middleTip);

    // L: Pulgar abierto lateralmente formando ángulo recto en 'L' (gran separación del índice)
    if (ext.thumb > 0.65 && dThumbIndexTip > 0.48 && thumbTip.x < indexMcp.x - 0.15 * palmScale) {
      return { letter: 'L', confidence: 99, rule: 'right_angle_90deg_L' };
    }

    // D: Pulgar contacta o se curva hacia el dedo medio formando bucle cerrado
    return { letter: 'D', confidence: 99, rule: 'index_up_thumb_middle_loop_D' };
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // GRUPO 6: PALMAS ABIERTAS (B vs F vs W vs C vs L)
  // ─────────────────────────────────────────────────────────────────────────────
  // F: Pinza circular entre índice y pulgar, con los otros 3 dedos rectos arriba
  if (ext.index < 0.38 && ext.middle > 0.70 && ext.ring > 0.70 && ext.pinky > 0.70) {
    return { letter: 'F', confidence: 99, rule: 'index_thumb_circle_three_fingers_up_F' };
  }

  // B: 4 dedos rectos completamente extendidos, pulgar recogido sobre la palma
  if (ext.index > 0.85 && ext.middle > 0.85 && ext.ring > 0.85 && ext.pinky > 0.85 && ext.thumb < 0.65) {
    return { letter: 'B', confidence: 99, rule: 'four_fingers_upright_thumb_tucked_B' };
  }

  // W: 3 dedos extendidos (índice, medio, anular) en forma de W, meñique doblado
  if (ext.index > 0.65 && ext.middle > 0.65 && ext.ring > 0.65 && ext.pinky < 0.35) {
    return { letter: 'W', confidence: 98, rule: 'three_fingers_spread_W' };
  }

  // L: Ángulo recto de 90° entre índice vertical y pulgar horizontal abierto
  if (!isIndexHorizontal && isIndexUp && ext.thumb > 0.38 && isMiddleDown(ext) && isRingDown && isPinkyDown) {
    return { letter: 'L', confidence: 99, rule: 'right_angle_90deg_L' };
  }

  // C: Mano en forma de arco/garra semicircular (dedos semiflexionados formando la 'C')
  if (
    ext.index > 0.35 && ext.index < 0.85 &&
    ext.middle > 0.35 && ext.middle < 0.85 &&
    distNorm(thumbTip, indexTip) > 0.28 && distNorm(thumbTip, indexTip) < 0.90
  ) {
    return { letter: 'C', confidence: 98, rule: 'curved_arc_hand_C' };
  }

  return null;
}

function isMiddleDown(ext: { middle: number }): boolean {
  return ext.middle < 0.35;
}

/**
 * Clasificador Unificado Principal.
 * Aplica en cascada: Suavizado One-Euro -> DTW Dinámico -> Querología Fina -> KNN Estadístico -> Re-ranking Bayesiano.
 */
export function classifyUnifiedLesco(
  rawLandmarks: HandLandmark3D[],
  trajectoryBuffer: Trajectory2DPoint[] = [],
  options: UnifiedRecognitionOptions = {}
): UnifiedRecognitionResult | null {
  if (!rawLandmarks || rawLandmarks.length < 21) return null;

  const {
    enableOneEuroFilter = true,
    enableDynamicDTW = true,
    enableBiomechanicalTiebreaker = true,
    enableKNNStatisticalModel = true,
    previousLetterContext = '',
    minConfidenceThreshold = 70,
    isFrontCamera = false,
  } = options;

  // Si la cámara es frontal (selfie / espejo), espejar las coordenadas X (x = 1 - x)
  // para alinear la mano y la trayectoria con las referencias anatómicas y dinámicas canónicas de LESCO
  const effectiveLandmarks = isFrontCamera
    ? rawLandmarks.map((p) => ({ ...p, x: 1 - p.x }))
    : rawLandmarks;
  const effectiveTrajectory = isFrontCamera
    ? trajectoryBuffer.map((t) => ({ ...t, x: 1 - t.x }))
    : trajectoryBuffer;

  // 1. Suavizado One-Euro para amortiguar ruido de frame a frame
  let smoothedLandmarks = effectiveLandmarks;
  if (enableOneEuroFilter) {
    const smoothed = globalSmoother.smooth(effectiveLandmarks);
    if (smoothed && smoothed.length >= 21) {
      smoothedLandmarks = smoothed;
    }
  }

  // 2. Extracción de descriptores biomecánicos R^78
  const bioFeatures = extractBiomechanicalFeatures(smoothedLandmarks);
  if (!bioFeatures) return null;

  // 3. FASE DINÁMICA: Evaluación de trayectoria con Sakoe-Chiba DTW
  if (enableDynamicDTW && effectiveTrajectory && effectiveTrajectory.length >= 4) {
    const dtwMatch = matchDynamicSignTrajectory(effectiveTrajectory, bioFeatures, 0.35);
    if (dtwMatch && dtwMatch.similarityScore >= 80 && dtwMatch.isCompatibleHandshape) {
      return {
        letter: dtwMatch.sign,
        confidence: Math.round(dtwMatch.similarityScore),
        isDynamic: true,
        engine: 'dtw_dynamic',
        dtwDistance: dtwMatch.dtwDistance,
        biomechanicalSignature: `DTW_DIST_${dtwMatch.dtwDistance.toFixed(3)}`,
        topAlternatives: [],
      };
    }
  }

  // 4. CLASIFICADOR ESTADÍSTICO KNN (sobre las 6,941 muestras reales de LESCO)
  let knnResult: { letter: string; confidence: number; isDynamic?: boolean } | null = null;
  if (enableKNNStatisticalModel && isKNNModelAvailable()) {
    try {
      knnResult = classifyWithKNN(
        smoothedLandmarks.map((p) => ({ x: p.x, y: p.y })),
        effectiveTrajectory.map((t) => ({ x: t.x, y: t.y, time: t.timestamp ?? Date.now() }))
      );
    } catch (_err) {
      knnResult = null;
    }
  }

  // 5. DESEMPATE QUEROLÓGICO FINO (Árbitro Biomecánico Determinista)
  let querologicalResult: { letter: string; confidence: number; rule: string } | null = null;
  if (enableBiomechanicalTiebreaker) {
    querologicalResult = resolveQuerologicalAmbiguity(
      smoothedLandmarks,
      bioFeatures,
      knnResult?.letter
    );
  }

  // 6. CLASIFICADOR DE PLANTILLAS ANATÓMICAS 3D (lescoAlphabetTrainerService)
  const trainedAlphabetResult = classifyTrainedAlphabetLesco(smoothedLandmarks);

  // 7. FUSIÓN PROBABILÍSTICA Y DESEMPATE
  const candidates: Array<{ letter: string; score: number; engine: string }> = [];

  if (querologicalResult) {
    candidates.push({
      letter: querologicalResult.letter,
      score: querologicalResult.confidence * 1.05,
      engine: 'biomechanical_exact',
    });
  }

  if (knnResult && knnResult.confidence > 0) {
    candidates.push({
      letter: knnResult.letter,
      score: knnResult.confidence * 0.95,
      engine: 'knn_statistical',
    });
  }

  if (trainedAlphabetResult) {
    candidates.push({
      letter: trainedAlphabetResult.letter,
      score: trainedAlphabetResult.confidence * 1.0,
      engine: 'trained_alphabet_template',
    });

    for (const alt of trainedAlphabetResult.alternatives || []) {
      candidates.push({
        letter: alt.letter,
        score: alt.confidence * 0.85,
        engine: 'alphabet_alt',
      });
    }
  }

  if (candidates.length === 0) return null;

  // Re-ranking con modelo de n-gramas si hay letra previa
  if (previousLetterContext && previousLetterContext.trim().length > 0) {
    const prevChar = previousLetterContext.trim().slice(-1).toUpperCase();
    for (const c of candidates) {
      const bigramAffinity = getLescoBigramAffinity(prevChar, c.letter);
      c.score += bigramAffinity * 15; // Bonificación de coherencia lingüística
    }
  }

  // Agrupar votos ponderados por letra
  const scoreMap = new Map<string, { totalScore: number; bestEngine: string }>();
  for (const c of candidates) {
    const existing = scoreMap.get(c.letter);
    if (!existing) {
      scoreMap.set(c.letter, { totalScore: c.score, bestEngine: c.engine });
    } else {
      existing.totalScore += c.score * 0.65; // Ponderación de consenso
    }
  }

  const sortedResults = Array.from(scoreMap.entries())
    .map(([letter, data]) => ({
      letter,
      score: Math.min(99, Math.round(data.totalScore)),
      engine: data.bestEngine,
    }))
    .sort((a, b) => b.score - a.score);

  const best = sortedResults[0];
  if (!best || best.score < minConfidenceThreshold) {
    return null;
  }

  const isDynamicSign =
    best.letter === 'J' || best.letter === 'Z' || best.letter === 'Ñ' ||
    best.letter === 'LL' || best.letter === 'RR' || best.letter === 'HOLA' ||
    best.letter === 'GRACIAS' || best.letter === 'POR FAVOR' || best.letter === 'SÍ' ||
    best.letter === 'NO';

  return {
    letter: best.letter,
    confidence: best.score,
    isDynamic: isDynamicSign,
    engine: best.engine as any,
    biomechanicalSignature: querologicalResult?.rule,
    topAlternatives: sortedResults.slice(1, 4).map((r) => ({
      letter: r.letter,
      confidence: r.score,
      engine: r.engine,
    })),
  };
}
