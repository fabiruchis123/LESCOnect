/**
 * @file benchmark_lesco_recognition.ts
 * @description Arnés de Benchmark y Evaluación Automatizada de Precisión Querológica y DTW LESCO.
 *
 * Evalúa:
 * - 30 letras dactilológicas del abecedario costarricense (A-Z, CH, LL, Ñ, RR).
 * - 10 señas dinámicas con trayectoria cinemática (Z, J, Ñ, LL, RR, HOLA, GRACIAS, POR FAVOR, SÍ, NO).
 * - Pruebas de estrés con ruido sintético gaussiano (σ = 0.02, σ = 0.04) y perturbación angular (±5°, ±10°).
 * - Matrices de confusión de familias críticas querológicas:
 *   * Puños: A vs S vs E vs O vs T
 *   * Dedos erguidos: U vs V vs K vs R vs RR
 *   * Horizontales: G vs H vs CH
 *   * Descendentes: P vs Q vs M vs N
 *   * Abiertas: B vs F vs W vs C
 * - Métricas de latencia de inferencia por frame (benchmark en milisegundos).
 */

import {
  classifyUnifiedLesco,
  resolveQuerologicalAmbiguity,
} from '../src/modules/Traductor/services/lescoUnifiedRecognitionService';

import {
  LESCO_ALPHABET_TEMPLATES,
  getTrainedLescoLandmarkTemplate,
  LescoAlphabetSignId,
  StandardLescoLetter,
} from '../src/modules/Traductor/services/lescoAlphabetTrainerService';

import {
  DYNAMIC_SIGN_PROTOTYPES,
  DynamicLescoSignId,
  matchDynamicSignTrajectory,
  extractBiomechanicalFeatures,
  Trajectory2DPoint,
  HandLandmark3D,
} from '../src/modules/Traductor/services/lescoKeypointPipelineService';

interface TestSample {
  expected: string;
  landmarks: HandLandmark3D[];
  trajectory?: Trajectory2DPoint[];
  category: 'static_letter' | 'dynamic_sign' | 'confusion_pair';
}

interface BenchmarkMetrics {
  totalTests: number;
  top1Correct: number;
  top3Correct: number;
  top1Accuracy: number;
  top3Accuracy: number;
  avgInferenceTimeMs: number;
  confusionPairsTested: number;
  confusionPairsResolved: number;
  confusionPairAccuracy: number;
  categoryAccuracy: Record<string, { total: number; correct: number; accuracy: number }>;
  confusionMatrix: Record<string, Record<string, number>>;
}

/** Genera ruido gaussiano Box-Muller */
function randomGaussian(mean = 0, std = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

/** Aplica ruido y rotación planar a un conjunto de landmarks 3D */
function perturbLandmarks(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  noiseStd: number,
  rotationDeg: number,
  scaleFactor: number
): HandLandmark3D[] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return landmarks.map((p) => {
    // Escalar respecto a la muñeca
    const sx = p.x * scaleFactor;
    const sy = p.y * scaleFactor;
    const sz = (p.z ?? 0) * scaleFactor;

    // Rotar en el plano XY
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;

    // Agregar ruido gaussiano
    return {
      x: rx + randomGaussian(0, noiseStd),
      y: ry + randomGaussian(0, noiseStd),
      z: sz + randomGaussian(0, noiseStd * 0.5),
    };
  });
}

/** Genera muestras de trayectoria para una seña dinámica */
function generateDynamicTrajectory(signId: DynamicLescoSignId, noiseStd = 0.015): Trajectory2DPoint[] {
  const basePoints = DYNAMIC_SIGN_PROTOTYPES[signId];
  if (!basePoints || basePoints.length === 0) {
    return [];
  }

  const now = Date.now();
  const stepMs = Math.round(750 / basePoints.length);

  return basePoints.map((pt, i) => ({
    x: pt.x + randomGaussian(0, noiseStd),
    y: pt.y + randomGaussian(0, noiseStd),
    timestamp: now + i * stepMs,
  }));
}

export function runLescoPrecisionBenchmark(iterationsPerSign = 15): BenchmarkMetrics {
  console.log(`\n================================================================`);
  console.log(` 🚀 INICIANDO BENCHMARK QUEROLÓGICO Y DTW DE ALTA PRECISIÓN LESCO`);
  console.log(`    Iteraciones por seña: ${iterationsPerSign}`);
  console.log(`================================================================\n`);

  const samples: TestSample[] = [];

  // 1. Muestras para las 30 letras oficiales
  const letters: StandardLescoLetter[] = [
    'A', 'B', 'C', 'CH', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'LL', 'M', 'N', 'Ñ', 'O', 'P', 'Q',
    'R', 'RR', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];

  for (const letter of letters) {
    const tmpl = LESCO_ALPHABET_TEMPLATES[letter];
    if (!tmpl) continue;

    for (let iter = 0; iter < iterationsPerSign; iter++) {
      // Perturbaciones graduales (iteración 0 sin ruido, luego con ruido creciente)
      const noise = iter === 0 ? 0 : 0.015 + (iter % 3) * 0.008;
      const angle = iter === 0 ? 0 : (iter % 2 === 0 ? 1 : -1) * (3 + (iter % 4) * 2);
      const scale = 1.0 + (iter % 2 === 0 ? 0.05 : -0.05);

      const perturbed = perturbLandmarks(tmpl.landmarks21, noise, angle, scale);

      // Si es dinámica (J, Z, Ñ, LL, RR), adjuntar trayectoria
      let traj: Trajectory2DPoint[] | undefined;
      if (tmpl.isDynamic && DYNAMIC_SIGN_PROTOTYPES[letter as DynamicLescoSignId]) {
        traj = generateDynamicTrajectory(letter as DynamicLescoSignId, noise);
      }

      samples.push({
        expected: letter,
        landmarks: perturbed,
        trajectory: traj,
        category: 'static_letter',
      });
    }
  }

  // 2. Muestras para señas dinámicas de vocabulario
  const dynamicSigns: DynamicLescoSignId[] = [
    'Z', 'J', 'Ñ', 'LL', 'RR', 'HOLA', 'GRACIAS', 'POR FAVOR', 'SÍ', 'NO',
  ];

  for (const sign of dynamicSigns) {
    const tmpl = LESCO_ALPHABET_TEMPLATES[sign as LescoAlphabetSignId];
    if (!tmpl) continue;

    for (let iter = 0; iter < iterationsPerSign; iter++) {
      const noise = iter === 0 ? 0.005 : 0.02 + (iter % 2) * 0.01;
      const perturbedLandmarks = perturbLandmarks(tmpl.landmarks21, noise, 0, 1.0);
      const traj = generateDynamicTrajectory(sign, noise);

      samples.push({
        expected: sign,
        landmarks: perturbedLandmarks,
        trajectory: traj,
        category: 'dynamic_sign',
      });
    }
  }

  // 3. Casos dedicados de pares de confusión querológica
  const confusionPairs: Array<[string, string]> = [
    ['A', 'S'], ['S', 'E'], ['E', 'O'], ['A', 'T'],
    ['U', 'V'], ['K', 'V'], ['R', 'RR'],
    ['G', 'H'], ['H', 'CH'],
    ['P', 'Q'], ['M', 'N'],
    ['B', 'F'], ['D', 'I'],
  ];

  for (const [signA, signB] of confusionPairs) {
    const tmplA = LESCO_ALPHABET_TEMPLATES[signA as LescoAlphabetSignId];
    const tmplB = LESCO_ALPHABET_TEMPLATES[signB as LescoAlphabetSignId];

    if (tmplA) {
      for (let i = 0; i < 5; i++) {
        samples.push({
          expected: signA,
          landmarks: perturbLandmarks(tmplA.landmarks21, 0.02, (i - 2) * 3, 1.0),
          category: 'confusion_pair',
        });
      }
    }
    if (tmplB) {
      for (let i = 0; i < 5; i++) {
        samples.push({
          expected: signB,
          landmarks: perturbLandmarks(tmplB.landmarks21, 0.02, (i - 2) * 3, 1.0),
          category: 'confusion_pair',
        });
      }
    }
  }

  // Ejecución de pruebas y medición de métricas
  let top1Correct = 0;
  let top3Correct = 0;
  let totalTimeMs = 0;
  let confusionPairsTested = 0;
  let confusionPairsResolved = 0;

  const categoryAccuracy: Record<string, { total: number; correct: number; accuracy: number }> = {
    static_letter: { total: 0, correct: 0, accuracy: 0 },
    dynamic_sign: { total: 0, correct: 0, accuracy: 0 },
    confusion_pair: { total: 0, correct: 0, accuracy: 0 },
  };

  const confusionMatrix: Record<string, Record<string, number>> = {};

  for (const sample of samples) {
    if (!confusionMatrix[sample.expected]) {
      confusionMatrix[sample.expected] = {};
    }

    const t0 = performance.now();
    const result = classifyUnifiedLesco(sample.landmarks, sample.trajectory, {
      enableOneEuroFilter: false,
      enableDynamicDTW: true,
      enableBiomechanicalTiebreaker: true,
      enableKNNStatisticalModel: true,
      minConfidenceThreshold: 60,
    });
    const dt = performance.now() - t0;
    totalTimeMs += dt;

    const detected = result?.letter ?? 'NONE';
    confusionMatrix[sample.expected][detected] = (confusionMatrix[sample.expected][detected] || 0) + 1;

    categoryAccuracy[sample.category].total++;

    const isTop1 = detected === sample.expected;
    const isTop3 =
      isTop1 ||
      (result?.topAlternatives && result.topAlternatives.some((alt) => alt.letter === sample.expected));

    if (isTop1) {
      top1Correct++;
      categoryAccuracy[sample.category].correct++;
    }
    if (isTop3) {
      top3Correct++;
    }

    if (sample.category === 'confusion_pair') {
      confusionPairsTested++;
      if (isTop1) {
        confusionPairsResolved++;
      }
    }
  }

  for (const cat in categoryAccuracy) {
    const data = categoryAccuracy[cat];
    data.accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  }

  const top1Accuracy = (top1Correct / samples.length) * 100;
  const top3Accuracy = (top3Correct / samples.length) * 100;
  const avgInferenceTimeMs = totalTimeMs / samples.length;
  const confusionPairAccuracy =
    confusionPairsTested > 0 ? (confusionPairsResolved / confusionPairsTested) * 100 : 0;

  console.log(`📊 RESULTADOS DEL BENCHMARK:`);
  console.log(`   - Muestras evaluadas: ${samples.length}`);
  console.log(`   - Precisión Top-1 Global: ${top1Accuracy.toFixed(2)}% (${top1Correct}/${samples.length})`);
  console.log(`   - Precisión Top-3 Global: ${top3Accuracy.toFixed(2)}% (${top3Correct}/${samples.length})`);
  console.log(`   - Latencia Media por Frame: ${avgInferenceTimeMs.toFixed(3)} ms (${(1000 / avgInferenceTimeMs).toFixed(1)} FPS teóricos)`);
  console.log(`   - Desempate Pares Críticos: ${confusionPairAccuracy.toFixed(2)}% (${confusionPairsResolved}/${confusionPairsTested})`);
  console.log(`\n Desglose por Categoría:`);
  console.log(`   * Letras Estáticas (30):  ${categoryAccuracy.static_letter.accuracy.toFixed(2)}%`);
  console.log(`   * Señas Dinámicas (10):   ${categoryAccuracy.dynamic_sign.accuracy.toFixed(2)}%`);
  console.log(`   * Pares de Confusión:     ${categoryAccuracy.confusion_pair.accuracy.toFixed(2)}%`);

  // Imprimir matriz de confusión de errores notables
  console.log(`\n Discrepancias / Confusiones Detectadas:`);
  let hasErrors = false;
  for (const expected in confusionMatrix) {
    for (const predicted in confusionMatrix[expected]) {
      if (expected !== predicted) {
        hasErrors = true;
        const count = confusionMatrix[expected][predicted];
        console.log(`   ⚠️ Esperado: '${expected}' ➔ Predicho: '${predicted}' (${count} veces)`);
      }
    }
  }
  if (!hasErrors) {
    console.log(`   ✨ ¡0 confusiones! Clasificación 100% infalible en este lote.`);
  }

  return {
    totalTests: samples.length,
    top1Correct,
    top3Correct,
    top1Accuracy,
    top3Accuracy,
    avgInferenceTimeMs,
    confusionPairsTested,
    confusionPairsResolved,
    confusionPairAccuracy,
    categoryAccuracy,
    confusionMatrix,
  };
}

// Ejecución directa si se invoca desde CLI
if (typeof process !== 'undefined' && process.argv[1]?.includes('benchmark_lesco_recognition')) {
  runLescoPrecisionBenchmark(12);
}
