import { FALLBACK_VIDEO_CATALOG, videoCacheService } from './videoCacheService';

export interface SubtitleCue {
  index: number;
  total: number;
  startTime: number; // segundos
  endTime: number;   // segundos
  text: string;      // fragmento de subtítulo en español
}

const INITIAL_POSTURE_WINDOW_S = 0.4;
const PUNCTUATION_PAUSE_S = 0.35;
const DEFAULT_DURATION_S = 10.0;

/**
 * Divide una frase oficial en español (`phrase_es`) en segmentos legibles de 1 a 2 líneas
 * respetando oraciones, cláusulas con puntuación y conjunciones largas (>55 caracteres).
 */
function splitPhraseIntoSegments(phraseEs: string): string[] {
  const clean = phraseEs.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  // 1. Separar por fin de oración (. ! ? ;) conservando el signo de puntuación
  const rawSentences = clean
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Fusionar salutaciones o exclamaciones muy cortas (ej. "¡Hola!", "¡Atención!") con la oración siguiente
  const sentences: string[] = [];
  for (let i = 0; i < rawSentences.length; i++) {
    const current = rawSentences[i];
    if (current.length < 18 && i + 1 < rawSentences.length) {
      rawSentences[i + 1] = `${current} ${rawSentences[i + 1]}`;
    } else {
      sentences.push(current);
    }
  }

  // 2. Subdividir oraciones largas (>55 caracteres) en cláusulas naturales de 1 a 2 líneas
  const segments: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= 55) {
      segments.push(sentence);
      continue;
    }

    // Si la oración es muy extensa (>115 caracteres), buscar primero un punto de corte equilibrado cerca de la mitad
    if (sentence.length > 115) {
      const mid = Math.floor(sentence.length / 2);
      const conjunctionRegex = /\s+(y conectar|y|o|para|pero)\s+/gi;
      let bestMatchIndex = -1;
      let bestDistance = Infinity;
      let match: RegExpExecArray | null;

      while ((match = conjunctionRegex.exec(sentence)) !== null) {
        const candidateIdx = match.index;
        const leftLen = candidateIdx;
        const rightLen = sentence.length - candidateIdx;
        if (leftLen >= 32 && rightLen >= 32) {
          const dist = Math.abs(candidateIdx - mid);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestMatchIndex = candidateIdx;
          }
        }
      }

      if (bestMatchIndex !== -1) {
        const firstHalf = sentence.slice(0, bestMatchIndex).trim();
        const secondHalf = sentence.slice(bestMatchIndex).trim();
        segments.push(firstHalf, secondHalf);
        continue;
      }
    }

    // Buscar coma o punto y coma más cercano al centro cuyos dos lados sean legibles (>=18 caracteres)
    const mid = Math.floor(sentence.length / 2);
    const commaIndices: number[] = [];
    for (let i = 0; i < sentence.length; i++) {
      if ((sentence[i] === ',' || sentence[i] === ';') && i >= 18 && sentence.length - i >= 18) {
        commaIndices.push(i + 1);
      }
    }

    if (commaIndices.length > 0) {
      commaIndices.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
      const splitAt = commaIndices[0];
      const left = sentence.slice(0, splitAt).trim();
      const right = sentence.slice(splitAt).trim();
      if (left && right) {
        segments.push(left, right);
        continue;
      }
    }

    // Si no tiene coma pero supera ~55-60 caracteres y tiene conjunción clara, dividir en la conjunción más centrada
    const conjRegex = /\s+(y|o|para|si)\s+/gi;
    let bestConjSplit = -1;
    let bestConjDist = Infinity;
    let conjMatch: RegExpExecArray | null;

    while ((conjMatch = conjRegex.exec(sentence)) !== null) {
      const idx = conjMatch.index;
      if (idx >= 22 && sentence.length - idx >= 20) {
        const dist = Math.abs(idx - mid);
        if (dist < bestConjDist) {
          bestConjDist = dist;
          bestConjSplit = idx;
        }
      }
    }

    if (bestConjSplit !== -1) {
      const left = sentence.slice(0, bestConjSplit).trim();
      const right = sentence.slice(bestConjSplit).trim();
      segments.push(left, right);
    } else {
      segments.push(sentence);
    }
  }

  return segments;
}

/**
 * Calcula el peso visual/articulatorio en LESCO de un segmento de texto:
 * cada carácter aporta peso base y cada signo de puntuación interno o final
 * añade el equivalente a una pausa de articulación de `0.35s`.
 */
function computeSegmentWeight(segmentText: string, charsPerSecondRate: number): number {
  const charCount = Math.max(segmentText.length, 1);
  const punctuationMatches = segmentText.match(/[.,;!?¡¿]/g);
  const punctuationCount = punctuationMatches ? punctuationMatches.length : 0;
  const pauseEquivalentChars = punctuationCount * PUNCTUATION_PAUSE_S * charsPerSecondRate;
  return charCount + pauseEquivalentChars;
}

export const videoSubtitlesService = {
  /**
   * Obtiene la duración real en segundos (`duration_s`) para un `r2_key` del catálogo de 54 videos.
   */
  getVideoDuration(r2Key: string, overrideDuration?: number): number {
    if (overrideDuration && Number.isFinite(overrideDuration) && overrideDuration > 0) {
      return overrideDuration;
    }
    const row =
      videoCacheService.getCatalogRow(r2Key) ||
      FALLBACK_VIDEO_CATALOG.find((v) => v.r2_key === r2Key);
    return row?.duration_s && row.duration_s > 0 ? Number(row.duration_s) : DEFAULT_DURATION_S;
  },

  /**
   * Genera la lista de subtítulos sincronizados (`SubtitleCue[]`) para un `r2_key`
   * ajustados a su `duration_s` oficial (o `overrideDuration` si el reproductor reporta metadata).
   */
  getCuesForVideo(r2Key: string, overrideDuration?: number, customPhraseEs?: string): SubtitleCue[] {
    const row =
      videoCacheService.getCatalogRow(r2Key) ||
      FALLBACK_VIDEO_CATALOG.find((v) => v.r2_key === r2Key);

    const phraseEs = (customPhraseEs || row?.phrase_es || '').trim();
    const totalDuration = this.getVideoDuration(r2Key, overrideDuration);

    if (!phraseEs) {
      return [];
    }

    const segments = splitPhraseIntoSegments(phraseEs);
    const total = segments.length;

    if (total === 0) {
      return [];
    }

    const startOffset = Math.min(INITIAL_POSTURE_WINDOW_S, totalDuration * 0.12);
    const effectiveSpan = Math.max(totalDuration - startOffset, 1.0);

    const totalChars = segments.reduce((acc, s) => acc + s.length, 0);
    const avgCharsPerSec = totalChars / effectiveSpan;

    const weights = segments.map((seg) => computeSegmentWeight(seg, avgCharsPerSec));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;

    let cursor = startOffset;
    return segments.map((text, idx) => {
      const isLast = idx === total - 1;
      const portion = (weights[idx] / totalWeight) * effectiveSpan;
      const startTime = Number(cursor.toFixed(2));
      const endTime = isLast
        ? Number(totalDuration.toFixed(2))
        : Number(Math.min(totalDuration, cursor + portion).toFixed(2));
      cursor = endTime;

      return {
        index: idx + 1,
        total,
        startTime,
        endTime,
        text,
      };
    });
  },

  /**
   * Devuelve el `SubtitleCue` activo para el instante `currentTimeSec` del reproductor.
   * Soporta reproducción en bucle (`loop = true`): cuando `currentTimeSec` reinicia a `0`
   * o se encuentra en la ventana inicial (`0.0s - 0.4s`), devuelve automáticamente el cue `1`.
   */
  getActiveCue(cues: SubtitleCue[], currentTimeSec: number): SubtitleCue | null {
    if (!cues || cues.length === 0) return null;

    const lastEnd = cues[cues.length - 1].endTime;
    const safeTime =
      !Number.isFinite(currentTimeSec) || currentTimeSec < 0
        ? 0
        : lastEnd > 0 && currentTimeSec > lastEnd + 0.25
        ? currentTimeSec % lastEnd
        : currentTimeSec;

    // En la postura inicial (0.0s -> startTime del cue 1) o al reiniciar el loop a 0, mostrar el cue 1
    if (safeTime <= cues[0].endTime) {
      return cues[0];
    }

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (safeTime >= cue.startTime && safeTime <= cue.endTime) {
        return cue;
      }
    }

    return cues[cues.length - 1];
  },

  /**
   * Formatea segundos a `m:ss` (ej. `0:08 / 0:34`).
   */
  formatTime(seconds: number): string {
    const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },
};
