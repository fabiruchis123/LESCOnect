/**
 * Clasificador KNN para señas LESCO usando landmarks de MediaPipe.
 *
 * Este módulo carga el modelo entrenado (lesco_model.json) y clasifica
 * las señas en base a los 21 puntos de la mano detectados por MediaPipe.
 *
 * El modelo se genera con el notebook de Google Colab (scratch/train_lesco_colab.py).
 */

import modelData from '../assets/lesco_model.json';

interface Sample {
  label: string;
  features: number[];
}

interface LescoModel {
  version: number;
  k: number;
  feature_size: number;
  labels: string[];
  samples: Sample[];
}

const model = modelData as LescoModel;

/**
 * Normaliza los 21 landmarks de MediaPipe de la misma forma que el script Python:
 * - Traslada el origen a la muñeca (landmark 0)
 * - Escala por la distancia muñeca → nudillo medio (landmark 9)
 * - Retorna un vector de 42 floats [x0,y0, x1,y1, ..., x20,y20]
 */
export function normalizeLandmarks(
  landmarks: Array<{ x: number; y: number }>
): number[] | null {
  if (!landmarks || landmarks.length < 21) return null;

  const ox = landmarks[0].x;
  const oy = landmarks[0].y;

  // Trasladar a la muñeca
  const pts = landmarks.map((lm) => [lm.x - ox, lm.y - oy]);

  // Escala: distancia muñeca → nudillo medio (índice 9)
  const scale = Math.sqrt(pts[9][0] ** 2 + pts[9][1] ** 2);
  if (scale < 1e-6) return null;

  const normalized: number[] = [];
  for (const [px, py] of pts) {
    normalized.push(px / scale, py / scale);
  }

  return normalized; // 42 floats
}

/**
 * Distancia euclidiana entre dos vectores de características.
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Clasifica una seña LESCO usando KNN sobre los landmarks normalizados.
 *
 * @param landmarks - Array de 21 {x, y} landmarks de MediaPipe
 * @param dynamicHistory - Historial de posiciones de la muñeca (para señas dinámicas)
 * @returns {letter, confidence} o null si no se puede clasificar
 */
export function classifyWithKNN(
  landmarks: Array<{ x: number; y: number }>,
  dynamicHistory: Array<{ x: number; y: number; time: number }> = []
): { letter: string; confidence: number; isDynamic?: boolean } | null {
  const features = normalizeLandmarks(landmarks);
  if (!features) return null;

  if (!model.samples || model.samples.length === 0) return null;

  // Calcular distancia a todos los ejemplos de entrenamiento
  const distances = model.samples.map((sample) => ({
    label: sample.label,
    dist: euclideanDistance(features, sample.features),
  }));

  // Ordenar por distancia más cercana
  distances.sort((a, b) => a.dist - b.dist);

  // KNN: tomar los k más cercanos
  const k = model.k ?? 5;
  const nearest = distances.slice(0, k);

  // Distancia máxima aceptable (umbral de confianza)
  // 2.2 permite variaciones naturales de manos y ángulos sin rechazar señas válidas
  if (nearest[0].dist > 2.2) return null;

  // Votación ponderada por distancia inversa
  const votes: Record<string, number> = {};
  for (const { label, dist } of nearest) {
    const weight = 1 / (dist + 1e-6);
    votes[label] = (votes[label] ?? 0) + weight;
  }

  // Letra ganadora
  const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  const totalWeight = Object.values(votes).reduce((s, v) => s + v, 0);

  const letter = winner[0];
  const confidence = Math.round((winner[1] / totalWeight) * 100);

  // Señas dinámicas: J y Z requieren movimiento
  const isDynamic = letter === 'J' || letter === 'Z' || letter === 'Ñ' || letter === 'LL' || letter === 'RR';

  if (isDynamic && dynamicHistory.length >= 5) {
    const start = dynamicHistory[0];
    const end = dynamicHistory[dynamicHistory.length - 1];
    const totalDist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    // Si no hay movimiento suficiente, no confirmar señas dinámicas
    if (totalDist < 0.04) return null;
  } else if (isDynamic && dynamicHistory.length < 5) {
    // Sin historial, no podemos confirmar señas dinámicas
    return null;
  }

  return { letter, confidence, isDynamic };
}

/**
 * Verifica si el modelo KNN está disponible y tiene muestras suficientes.
 */
export function isKNNModelAvailable(): boolean {
  return (
    !!model &&
    model.version === 1 &&
    Array.isArray(model.samples) &&
    model.samples.length > 10
  );
}

/**
 * Información del modelo cargado.
 */
export function getKNNModelInfo(): string {
  if (!isKNNModelAvailable()) return 'Modelo KNN no disponible';
  return `KNN: ${model.samples.length} muestras, ${model.labels.length} letras (v${model.version})`;
}
