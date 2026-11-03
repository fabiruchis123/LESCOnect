import {
  classifyUnifiedLesco,
  resolveQuerologicalAmbiguity,
} from '../src/modules/Traductor/services/lescoUnifiedRecognitionService';

import {
  LESCO_ALPHABET_TEMPLATES,
  classifyTrainedAlphabetLesco,
} from '../src/modules/Traductor/services/lescoAlphabetTrainerService';

import {
  classifyWithKNN,
} from '../src/modules/Traductor/services/lescoKNNClassifier';

import {
  extractBiomechanicalFeatures,
  normalizeHandLandmarks,
} from '../src/modules/Traductor/services/lescoKeypointPipelineService';

const testLetters = ['K', 'T', 'X', 'O', 'S', 'P', 'Q', 'M', 'N', 'CH', 'A', 'E', 'R'];

console.log('--- DIAGNÓSTICO INDIVIDUAL DE LETRAS ---');
for (const letter of testLetters) {
  const tmpl = LESCO_ALPHABET_TEMPLATES[letter as keyof typeof LESCO_ALPHABET_TEMPLATES];
  if (!tmpl) continue;

  const pts = tmpl.landmarks21;
  const bio = extractBiomechanicalFeatures(pts);
  const knn = classifyWithKNN(pts.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })));
  const quer = bio ? resolveQuerologicalAmbiguity(pts, bio, knn?.letter) : null;
  const trained = classifyTrainedAlphabetLesco(pts);
  const unified = classifyUnifiedLesco(pts, [], { enableOneEuroFilter: false });

  console.log(`\nLetra: [${letter}]`);
  console.log(`  Ext: thumb=${bio?.fingerExtensions.thumb.toFixed(2)}, idx=${bio?.fingerExtensions.index.toFixed(2)}, mid=${bio?.fingerExtensions.middle.toFixed(2)}, ring=${bio?.fingerExtensions.ring.toFixed(2)}, pnk=${bio?.fingerExtensions.pinky.toFixed(2)}`);
  if (bio) {
    const palmScale = Math.hypot(bio.geometry.landmarks[9].x - bio.geometry.landmarks[0].x, bio.geometry.landmarks[9].y - bio.geometry.landmarks[0].y) || 1.0;
    const dThumbIndex = Math.hypot(bio.geometry.landmarks[4].x - bio.geometry.landmarks[8].x, bio.geometry.landmarks[4].y - bio.geometry.landmarks[8].y) / palmScale;
    const dThumbMiddle = Math.hypot(bio.geometry.landmarks[4].x - bio.geometry.landmarks[12].x, bio.geometry.landmarks[4].y - bio.geometry.landmarks[12].y) / palmScale;
    console.log(`  Pinch: dThumbIndex=${dThumbIndex.toFixed(3)}, dThumbMiddle=${dThumbMiddle.toFixed(3)}`);
    console.log(`  Orientación: palm=${bio.palmOrientation}, rotRad=${bio.geometry.planarRotationRad.toFixed(3)}, rawMidMcpY=${bio.geometry.scaleNormalizedLandmarks[9].y.toFixed(3)}`);
  }
  console.log(`  KNN: ${knn?.letter} (conf: ${knn?.confidence}%)`);
  console.log(`  Querológico: ${quer?.letter} (conf: ${quer?.confidence}%, rule: ${quer?.rule})`);
  console.log(`  Plantillas 3D: ${trained?.letter} (conf: ${trained?.confidence}%)`);
  console.log(`  UNIFIED: ${unified?.letter} (conf: ${unified?.confidence}%, engine: ${unified?.engine})`);
}
