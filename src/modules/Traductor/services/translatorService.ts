export interface LescoRecognitionResult {
  detected: boolean;
  letter: string;
  name: string;
  confidence: number;
  tip: string;
  rawAnalysis?: string;
}

const LESCO_PROMPT = `Eres el clasificador de visión artificial oficial de Lengua de Señas Costarricense (LESCO) basado en los manuales de Hands-On LESCO y CENAREC Costa Rica.

Determina con precisión qué seña manual del alfabeto LESCO está realizando la persona en la imagen:

GUÍA OFICIAL DEL ALFABETO LESCO (MANOS-ON LESCO / COSTA RICA):
- "A": Puño cerrado al frente, 4 dedos flexionados, pulgar erguido descansando pegado al costado exterior del índice.
- "B": 4 dedos completamente extendidos juntos hacia arriba, palma al frente, pulgar doblado cruzando sobre la palma.
- "C": Todos los dedos curvados en forma de semicírculo continuo formando la silueta de una letra "C".
- "CH": Mano horizontal, dedos índice y medio extendidos juntos horizontalmente señalando hacia el lateral.
- "D": Solo el dedo índice recto hacia arriba. Pulgar unido en círculo con las yemas de medio y anular.
- "E": 4 dedos doblados hacia abajo apoyando sus yemas sobre el borde horizontal del pulgar flexionado.
- "F": Las yemas de índice y pulgar se unen formando un círculo ("OK"); dedos medio, anular y meñique rectos hacia arriba.
- "G": Mano horizontal de perfil con el dedo índice extendido apuntando hacia el lateral/frente y el pulgar horizontal.
- "H": Mano horizontal con dedos índice y medio extendidos juntos hacia el lateral.
- "I": Solo el dedo meñique completamente extendido hacia arriba; los otros 3 dedos y el pulgar cerrados en puño.
- "K": Dedos índice y medio en forma de "V" con el pulgar insertado en medio apuntando hacia adelante.
- "L": Dedo índice vertical hacia arriba y pulgar abierto a 90° hacia el lateral formando una "L" nítida. Otros dedos cerrados.
- "M": Puño cerrado con los tres dedos (índice, medio, anular) descansando sobre el pulgar (3 bultos visibles).
- "N": Puño cerrado con dos dedos (índice y medio) descansando sobre el pulgar (2 bultos visibles).
- "O": Todos los dedos curvados hacia adelante tocando la yema del pulgar, formando una "O" redonda cerrada.
- "P": Mano inclinada hacia abajo/frente, índice horizontal al frente y medio apuntando hacia abajo en ángulo de 90°.
- "Q": Mano apuntando hacia abajo con el índice y pulgar apuntando al suelo.
- "R": Dedos índice y medio extendidos hacia arriba y cruzados entre sí.
- "S": Puño cerrado completo donde el pulgar abraza por el frente los cuatro dedos flexionados.
- "T": Dedos índice y medio extendidos juntos hacia arriba con el pulgar al lateral o apoyado.
- "U": Dedos índice y medio rectos hacia arriba y completamente unidos (pegados).
- "V": Dedos índice y medio rectos hacia arriba y ABIERTOS en forma de "V" (paz).
- "W": Dedos índice, medio y anular rectos hacia arriba y separados.
- "X": Dedo índice flexionado en forma de garfio/gancho; demás dedos en puño.
- "Y": Pulgar y meñique completamente extendidos hacia los lados (estilo shaka/surf); 3 dedos centrales cerrados.

CRITERIOS DE CLASIFICACIÓN:
1. Si reconoces con certeza la postura de la mano según esta guía, responde "detected": true con la letra en mayúscula y "confidence" (70 a 99).
2. Sé tolerante al ángulo de la cámara del usuario (frontal o selfie).
3. Si la imagen está en negro, muy oscura o no se muestra ninguna mano con postura de seña, responde "detected": false.
4. Responde ÚNICAMENTE en JSON válido sin texto adicional:
{"detected": true, "letter": "L", "confidence": 95}
o
{"detected": false, "letter": "", "confidence": 0}`;

// Modelos activos verificados con disponibilidad y cuota fresca
const MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

let currentModelIndex = 0;
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000; // 1s entre llamadas para conservar cuota

/**
 * Limpia y valida el base64 de una imagen.
 * Soporta: data URI completo, base64 puro, con o sin padding.
 */
function cleanBase64(raw: string): { data: string; mimeType: string } {
  let data = raw.trim();
  let mimeType = 'image/jpeg';

  // Extraer si viene con prefijo data URI
  const dataUriMatch = data.match(/^data:(image\/[a-z+]+);base64,(.+)$/s);
  if (dataUriMatch) {
    mimeType = dataUriMatch[1];
    data = dataUriMatch[2].trim();
  }

  // Eliminar espacios/saltos de línea que puedan haberse colado
  data = data.replace(/\s/g, '');

  // Asegurar padding correcto
  const rem = data.length % 4;
  if (rem === 2) data += '==';
  else if (rem === 3) data += '=';

  return { data, mimeType };
}

export async function recognizeLescoSignFromBase64(
  base64Image: string,
  apiKey?: string
): Promise<LescoRecognitionResult> {
  const EMPTY: LescoRecognitionResult = { detected: false, letter: '', name: '', confidence: 0, tip: '' };

  if (!base64Image || base64Image.length < 100) return EMPTY;

  const { data: cleanData, mimeType } = cleanBase64(base64Image);

  if (cleanData.length < 100) return EMPTY;

  const key =
    apiKey ||
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY : '') ||
    '';

  // Throttle suave entre requests
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt < MODELS.length; attempt++) {
    const model = MODELS[(currentModelIndex + attempt) % MODELS.length];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s para permitir subida completa en móvil

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: LESCO_PROMPT },
              { inline_data: { mime_type: mimeType, data: cleanData } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            max_output_tokens: 300, // Espacio suficiente para pensamiento interno + JSON completo
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        // Rate limit — rotar modelo
        currentModelIndex = (currentModelIndex + 1) % MODELS.length;
        continue;
      }

      if (response.status === 404 || response.status === 400) {
        // Modelo no disponible o request inválida para este modelo
        currentModelIndex = (currentModelIndex + 1) % MODELS.length;
        continue;
      }

      if (!response.ok) {
        currentModelIndex = (currentModelIndex + 1) % MODELS.length;
        continue;
      }

      const data = await response.json();

      // Buscar texto en la respuesta (ignorar partes de "thought")
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => p.text && !p.thought)?.text
        || parts.find((p: any) => p.text)?.text;

      if (!textPart) {
        // Sin texto en respuesta
        continue;
      }

      // Limpiar markdown si lo hay
      const cleanJson = textPart
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      let parsed: any = {};
      try {
        // Extraer JSON aunque haya texto extra alrededor
        const jsonMatch = cleanJson.match(/\{[^}]+\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanJson);
      } catch {
        continue;
      }

      const isDetected = Boolean(
        parsed.detected === true &&
        parsed.letter &&
        typeof parsed.letter === 'string' &&
        parsed.letter.trim().length > 0
      );

      if (isDetected) {
        return {
          detected: true,
          letter: parsed.letter.toUpperCase().trim(),
          name: `Seña ${parsed.letter}`,
          confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 85))),
          tip: '',
          rawAnalysis: textPart,
        };
      }

      // Gemini respondió pero detected: false — es una respuesta válida, no reintentamos
      return EMPTY;

    } catch (err: any) {
      // Timeout u error de red — rotar modelo
      currentModelIndex = (currentModelIndex + 1) % MODELS.length;
      if (attempt === MODELS.length - 1) {
        // Último intento fallido
        console.warn('[LESCO] Todos los modelos fallaron:', err?.message);
      }
    }
  }

  return EMPTY;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECONOCIMIENTO DE SEÑAS DINÁMICAS (con movimiento)
// Envía 3 fotos en secuencia y pide a Gemini que identifique el movimiento
// ─────────────────────────────────────────────────────────────────────────────

const DYNAMIC_PROMPT = `Eres un experto en Lengua de Señas Costarricense (LESCO).
Te envío 3 imágenes en secuencia (Foto 1 → Foto 2 → Foto 3) que capturan el movimiento de una mano durante ~1 segundo.

Señas DINÁMICAS (con movimiento) que debes identificar:
- Z: índice extendido trazando "Z" en el aire (zigzag horizontal)
- J: meñique extendido trazando "J" hacia abajo con curva
- HOLA: palma abierta moviéndose lateralmente (saludo)
- GRACIAS: mano abierta desde el mentón extendiéndose al frente/abajo
- SÍ: puño cerrado moviéndose arriba y abajo (asentimiento)
- NO: dedos juntos moviéndose horizontalmente de lado a lado
- LL: forma de L moviéndose lateralmente
- RR: dedos R moviéndose lateralmente
- Ñ: puño con sacudida horizontal
- POR FAVOR: palma abierta haciendo círculo en el pecho

Analiza el MOVIMIENTO entre las 3 fotos. Si identificas una seña dinámica, reporta detected:true.
Si la mano está quieta o no hay movimiento claro, reporta detected:false.

Responde ÚNICAMENTE con JSON (sin markdown):
{"detected": true, "letter": "HOLA", "confidence": 90}
o
{"detected": false, "letter": "", "confidence": 0}`;

/**
 * Reconoce señas DINÁMICAS enviando 3 fotos en secuencia a Gemini.
 * Llama esto cuando el usuario sostiene una seña durante ~1s con movimiento.
 */
export async function recognizeDynamicLescoSign(
  frames: string[],   // Array de 3 base64 images
  apiKey?: string
): Promise<LescoRecognitionResult> {
  const EMPTY: LescoRecognitionResult = { detected: false, letter: '', name: '', confidence: 0, tip: '' };

  if (!frames || frames.length < 2) return EMPTY;

  const cleanedFrames = frames
    .map(f => cleanBase64(f))
    .filter(f => f.data.length > 100);

  if (cleanedFrames.length < 2) return EMPTY;

  const key =
    apiKey ||
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_GEMINI_API_KEY : '') ||
    '';

  // Throttle
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  for (let attempt = 0; attempt < MODELS.length; attempt++) {
    const model = MODELS[(currentModelIndex + attempt) % MODELS.length];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // más tiempo para 3 imágenes

      // Construir partes: texto + 3 imágenes
      const parts: any[] = [{ text: DYNAMIC_PROMPT }];
      cleanedFrames.forEach((frame, idx) => {
        parts.push({ text: `Foto ${idx + 1}:` });
        parts.push({ inline_data: { mime_type: frame.mimeType, data: frame.data } });
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.1, max_output_tokens: 60 },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 429 || response.status === 404 || response.status === 400) {
        currentModelIndex = (currentModelIndex + 1) % MODELS.length;
        continue;
      }
      if (!response.ok) {
        currentModelIndex = (currentModelIndex + 1) % MODELS.length;
        continue;
      }

      const data = await response.json();
      const parts2 = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts2.find((p: any) => p.text && !p.thought)?.text
        || parts2.find((p: any) => p.text)?.text;

      if (!textPart) continue;

      const jsonMatch = textPart.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim().match(/\{[^}]+\}/);
      if (!jsonMatch) continue;

      let parsed: any = {};
      try { parsed = JSON.parse(jsonMatch[0]); } catch { continue; }

      const isDetected = Boolean(
        parsed.detected === true &&
        parsed.letter &&
        typeof parsed.letter === 'string' &&
        parsed.letter.trim().length > 0
      );

      if (isDetected) {
        return {
          detected: true,
          letter: parsed.letter.toUpperCase().trim(),
          name: `Seña ${parsed.letter}`,
          confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 85))),
          tip: '',
          rawAnalysis: textPart,
        };
      }

      return EMPTY;

    } catch (err: any) {
      currentModelIndex = (currentModelIndex + 1) % MODELS.length;
    }
  }

  return EMPTY;
}
