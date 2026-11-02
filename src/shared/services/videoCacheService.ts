import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase, videoUrl, VideoOrientation } from '@/lib/supabase';
import { isTrustedVideoUrl, sanitizeR2Key } from '@/shared/utils/security';

export interface VideoCatalogRow {
  id: number;
  module: number;
  category: 'banco' | 'emergencia' | 'hospital' | 'mensajes' | 'policia' | null;
  file_code: string;
  situation: number;
  sentence: number;
  phrase_es: string;
  r2_key: string;
  version: number;
  size_bytes?: number | null;
  duration_s?: number | null;
}

const CATALOG_STORAGE_KEY = 'lesconect_video_catalog_v1';
const VERSIONS_STORAGE_KEY = 'lesconect_video_versions_v1';

// Catálogo base embebido (54 videos) como respaldo inmediato si la app arranca 100% sin internet la primera vez
export const FALLBACK_VIDEO_CATALOG: VideoCatalogRow[] = [
  // Módulo 1: Bienvenida, Registro y Configuración
  { id: 1, module: 1, category: null, file_code: '1_1', situation: 1, sentence: 1, phrase_es: '¡Hola! Te damos la bienvenida a LESCOnect, la aplicación pensada para romper barreras y conectar a la comunidad sorda de Costa Rica con servicios esenciales y emergencias. Desliza hacia arriba para comenzar.', r2_key: 'lesco/v1/m1/1_1.mp4', version: 1, size_bytes: 2987352, duration_s: 33.92 },
  { id: 2, module: 1, category: null, file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Para crear tu perfil, escribe tu nombre y apellidos, tu número de cédula nacional y tu número de teléfono. Estos datos permitirán identificarte de forma segura en caso de emergencia.', r2_key: 'lesco/v1/m1/1_2.mp4', version: 1, size_bytes: 2795978, duration_s: 33.63 },
  { id: 3, module: 1, category: null, file_code: '1_3', situation: 1, sentence: 3, phrase_es: 'Toca el campo de fecha de nacimiento. En el calendario emergente, elige primero tu año, luego el mes y finalmente presiona Guardar Fecha.', r2_key: 'lesco/v1/m1/1_3.mp4', version: 1, size_bytes: 2778701, duration_s: 30.94 },
  { id: 4, module: 1, category: null, file_code: '1_4', situation: 1, sentence: 4, phrase_es: 'En la tarjeta de emergencia, toca el botón Mis contactos para seleccionar a un familiar o amigo desde tu teléfono. Selecciona el tipo de parentesco y marca si esa persona sabe LESCO.', r2_key: 'lesco/v1/m1/1_4.mp4', version: 1, size_bytes: 3272780, duration_s: 35.20 },

  // Módulo 2: Pantalla Principal y Navegación
  { id: 5, module: 2, category: null, file_code: '2_1', situation: 2, sentence: 1, phrase_es: 'En la barra superior verás tu nombre y foto de perfil. Puedes presionar el botón de cámara Ver en señas en cualquier momento para ver videos explicativos como este.', r2_key: 'lesco/v1/m2/2_1.mp4', version: 1, size_bytes: 2997571, duration_s: 31.75 },
  { id: 6, module: 2, category: null, file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'Esta tarjeta te lleva directamente al Traductor. Presiona el botón del micrófono si una persona oyente quiere hablarte, o escribe para generar señas en video.', r2_key: 'lesco/v1/m2/2_2.mp4', version: 1, size_bytes: 3411556, duration_s: 35.30 },
  { id: 7, module: 2, category: null, file_code: '2_3', situation: 2, sentence: 3, phrase_es: 'En situaciones de peligro inminente, toca el banner rojo de emergencia para acceder de inmediato al botón de pánico y a tus contactos de auxilio.', r2_key: 'lesco/v1/m2/2_3.mp4', version: 1, size_bytes: 2630408, duration_s: 27.25 },
  { id: 8, module: 2, category: null, file_code: '2_4', situation: 2, sentence: 4, phrase_es: 'Usa los controles debajo del video para pausar, repetir la seña las veces que necesites o activar la velocidad lenta (0.5x) para aprender cada detalle del movimiento.', r2_key: 'lesco/v1/m2/2_4.mp4', version: 1, size_bytes: 3472039, duration_s: 34.75 },

  // Módulo 3: Traductor y Comunicación
  { id: 9, module: 3, category: null, file_code: '3_1', situation: 3, sentence: 1, phrase_es: 'Presiona el botón de micrófono para que la persona oyente hable, o usa el teclado para escribir. La aplicación transformará las palabras en glosa LESCO y te mostrará el video con la seña correspondiente.', r2_key: 'lesco/v1/m3/3_1.mp4', version: 1, size_bytes: 2496415, duration_s: 25.70 },
  { id: 10, module: 3, category: null, file_code: '3_2', situation: 3, sentence: 2, phrase_es: 'Coloca tu teléfono frente a ti con buena iluminación. Realiza las señas del abecedario LESCO con claridad; el sistema detectará tus manos y escribirá las letras automáticamente.', r2_key: 'lesco/v1/m3/3_2.mp4', version: 1, size_bytes: 2886964, duration_s: 30.04 },

  // Módulo 4: Emergencias y Auxilio SOS
  { id: 11, module: 4, category: null, file_code: '4_1', situation: 4, sentence: 1, phrase_es: 'Mantén presionado el botón rojo SOS durante 2 segundos. Se activará una alerta silenciosa que enviará un SMS con tu ubicación GPS exacta a tus contactos de auxilio.', r2_key: 'lesco/v1/m4/4_1.mp4', version: 1, size_bytes: 2553447, duration_s: 26.48 },
  { id: 12, module: 4, category: null, file_code: '4_2', situation: 4, sentence: 2, phrase_es: 'Al conectar con el 911, la aplicación comparte automáticamente tu condición de persona sorda, tu ubicación GPS y si requieres ambulancia, policía o bomberos.', r2_key: 'lesco/v1/m4/4_2.mp4', version: 1, size_bytes: 2615927, duration_s: 28.12 },

  // Módulo 5: Banco (8)
  { id: 13, module: 5, category: 'banco', file_code: '0', situation: 0, sentence: 0, phrase_es: 'Hola, soy una persona sorda y vengo a realizar un trámite.', r2_key: 'lesco/v1/m5/banco/0.mp4', version: 1, size_bytes: 819717, duration_s: 9.06 },
  { id: 14, module: 5, category: 'banco', file_code: '1_1', situation: 1, sentence: 1, phrase_es: 'Deseo abrir una cuenta de ahorros.', r2_key: 'lesco/v1/m5/banco/1_1.mp4', version: 1, size_bytes: 881938, duration_s: 9.38 },
  { id: 15, module: 5, category: 'banco', file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Vengo a retirar mi nueva tarjeta.', r2_key: 'lesco/v1/m5/banco/1_2.mp4', version: 1, size_bytes: 625320, duration_s: 7.26 },
  { id: 16, module: 5, category: 'banco', file_code: '1_3', situation: 1, sentence: 3, phrase_es: 'Mi tarjeta fue bloqueada o retenida por el cajero.', r2_key: 'lesco/v1/m5/banco/1_3.mp4', version: 1, size_bytes: 911240, duration_s: 10.03 },
  { id: 17, module: 5, category: 'banco', file_code: '2_1', situation: 2, sentence: 1, phrase_es: 'Deseo hacer un depósito en efectivo.', r2_key: 'lesco/v1/m5/banco/2_1.mp4', version: 1, size_bytes: 720011, duration_s: 7.28 },
  { id: 18, module: 5, category: 'banco', file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'Por favor escriba el monto final en el papel.', r2_key: 'lesco/v1/m5/banco/2_2.mp4', version: 1, size_bytes: 770782, duration_s: 7.95 },
  { id: 19, module: 5, category: 'banco', file_code: '3_1', situation: 3, sentence: 1, phrase_es: 'Aquí está mi cédula de identidad.', r2_key: 'lesco/v1/m5/banco/3_1.mp4', version: 1, size_bytes: 468860, duration_s: 5.51 },
  { id: 20, module: 5, category: 'banco', file_code: '3_2', situation: 3, sentence: 2, phrase_es: '¿Dónde debo firmar el documento?', r2_key: 'lesco/v1/m5/banco/3_2.mp4', version: 1, size_bytes: 847510, duration_s: 8.85 },

  // Módulo 5: Emergencia (8)
  { id: 21, module: 5, category: 'emergencia', file_code: '0', situation: 0, sentence: 0, phrase_es: '¡Atención! Soy una persona sorda y necesito auxilio urgente.', r2_key: 'lesco/v1/m5/emergencia/0.mp4', version: 1, size_bytes: 952930, duration_s: 10.31 },
  { id: 22, module: 5, category: 'emergencia', file_code: '1_1', situation: 1, sentence: 1, phrase_es: 'Necesito ayuda urgente, no puedo escuchar.', r2_key: 'lesco/v1/m5/emergencia/1_1.mp4', version: 1, size_bytes: 916800, duration_s: 9.30 },
  { id: 23, module: 5, category: 'emergencia', file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Estoy en una situación de peligro.', r2_key: 'lesco/v1/m5/emergencia/1_2.mp4', version: 1, size_bytes: 746712, duration_s: 8.39 },
  { id: 24, module: 5, category: 'emergencia', file_code: '1_3', situation: 1, sentence: 3, phrase_es: 'Por favor llame a mis contactos de emergencia.', r2_key: 'lesco/v1/m5/emergencia/1_3.mp4', version: 1, size_bytes: 964106, duration_s: 10.33 },
  { id: 25, module: 5, category: 'emergencia', file_code: '2_1', situation: 2, sentence: 1, phrase_es: 'Llamen a una ambulancia inmediatamente.', r2_key: 'lesco/v1/m5/emergencia/2_1.mp4', version: 1, size_bytes: 1044728, duration_s: 11.09 },
  { id: 26, module: 5, category: 'emergencia', file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'Hay una persona herida o inconsciente.', r2_key: 'lesco/v1/m5/emergencia/2_2.mp4', version: 1, size_bytes: 859025, duration_s: 9.12 },
  { id: 27, module: 5, category: 'emergencia', file_code: '3_1', situation: 3, sentence: 1, phrase_es: 'Hay fuego o humo, llamen a bomberos.', r2_key: 'lesco/v1/m5/emergencia/3_1.mp4', version: 1, size_bytes: 978636, duration_s: 9.77 },
  { id: 28, module: 5, category: 'emergencia', file_code: '3_2', situation: 3, sentence: 2, phrase_es: 'Hay una persona atrapada aquí.', r2_key: 'lesco/v1/m5/emergencia/3_2.mp4', version: 1, size_bytes: 821706, duration_s: 8.34 },

  // Módulo 5: Hospital (7)
  { id: 29, module: 5, category: 'hospital', file_code: '0', situation: 0, sentence: 0, phrase_es: 'Hola, soy una persona sorda y necesito atención médica.', r2_key: 'lesco/v1/m5/hospital/0.mp4', version: 1, size_bytes: 1113982, duration_s: 11.10 },
  { id: 30, module: 5, category: 'hospital', file_code: '1_1', situation: 1, sentence: 1, phrase_es: 'Soy sordo/a, necesito un intérprete de LESCO si es posible.', r2_key: 'lesco/v1/m5/hospital/1_1.mp4', version: 1, size_bytes: 1055385, duration_s: 10.73 },
  { id: 31, module: 5, category: 'hospital', file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Tengo cita médica programada para hoy.', r2_key: 'lesco/v1/m5/hospital/1_2.mp4', version: 1, size_bytes: 753219, duration_s: 8.38 },
  { id: 32, module: 5, category: 'hospital', file_code: '1_3', situation: 1, sentence: 3, phrase_es: 'Por favor escriba el número de consultorio.', r2_key: 'lesco/v1/m5/hospital/1_3.mp4', version: 1, size_bytes: 985823, duration_s: 9.55 },
  { id: 33, module: 5, category: 'hospital', file_code: '2_1', situation: 2, sentence: 1, phrase_es: 'Vengo a retirar mis medicamentos de la receta.', r2_key: 'lesco/v1/m5/hospital/2_1.mp4', version: 1, size_bytes: 837663, duration_s: 9.66 },
  { id: 34, module: 5, category: 'hospital', file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'Por favor escriba los horarios de las pastillas.', r2_key: 'lesco/v1/m5/hospital/2_2.mp4', version: 1, size_bytes: 977096, duration_s: 10.78 },
  { id: 35, module: 5, category: 'hospital', file_code: '3_1', situation: 3, sentence: 1, phrase_es: 'Tengo dolor fuerte en esta parte del cuerpo.', r2_key: 'lesco/v1/m5/hospital/3_1.mp4', version: 1, size_bytes: 729830, duration_s: 7.63 },

  // Módulo 5: Mensajes Generales y Cortesía (7)
  { id: 36, module: 5, category: 'mensajes', file_code: '0', situation: 0, sentence: 0, phrase_es: 'Hola, soy una persona sorda y necesito hacer una consulta.', r2_key: 'lesco/v1/m5/mensajes/0.mp4', version: 1, size_bytes: 912608, duration_s: 9.11 },
  { id: 37, module: 5, category: 'mensajes', file_code: '1_1', situation: 1, sentence: 1, phrase_es: 'Hola, buenos días / buenas tardes.', r2_key: 'lesco/v1/m5/mensajes/1_1.mp4', version: 1, size_bytes: 1066744, duration_s: 9.93 },
  { id: 38, module: 5, category: 'mensajes', file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Muchas gracias por su paciencia y ayuda.', r2_key: 'lesco/v1/m5/mensajes/1_2.mp4', version: 1, size_bytes: 702970, duration_s: 7.21 },
  { id: 39, module: 5, category: 'mensajes', file_code: '2_1', situation: 2, sentence: 1, phrase_es: '¿Podría escribir las indicaciones por favor?', r2_key: 'lesco/v1/m5/mensajes/2_1.mp4', version: 1, size_bytes: 926571, duration_s: 8.97 },
  { id: 40, module: 5, category: 'mensajes', file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'No comprendí bien, ¿puede repetirlo por escrito?', r2_key: 'lesco/v1/m5/mensajes/2_2.mp4', version: 1, size_bytes: 983861, duration_s: 9.30 },
  { id: 41, module: 5, category: 'mensajes', file_code: '3_1', situation: 3, sentence: 1, phrase_es: '¿Dónde se hace la fila preferencial?', r2_key: 'lesco/v1/m5/mensajes/3_1.mp4', version: 1, size_bytes: 901128, duration_s: 8.93 },
  { id: 42, module: 5, category: 'mensajes', file_code: '3_2', situation: 3, sentence: 2, phrase_es: '¿Dónde están los servicios sanitarios?', r2_key: 'lesco/v1/m5/mensajes/3_2.mp4', version: 1, size_bytes: 693218, duration_s: 7.54 },

  // Módulo 5: Policía y Seguridad (7)
  { id: 43, module: 5, category: 'policia', file_code: '0', situation: 0, sentence: 0, phrase_es: 'Hola, soy una persona sorda y necesito comunicarme con un oficial.', r2_key: 'lesco/v1/m5/policia/0.mp4', version: 1, size_bytes: 949437, duration_s: 9.72 },
  { id: 44, module: 5, category: 'policia', file_code: '1_1', situation: 1, sentence: 1, phrase_es: 'Soy una persona sorda, por favor escriba las indicaciones.', r2_key: 'lesco/v1/m5/policia/1_1.mp4', version: 1, size_bytes: 1153238, duration_s: 11.71 },
  { id: 45, module: 5, category: 'policia', file_code: '1_2', situation: 1, sentence: 2, phrase_es: 'Aquí está mi cédula de identidad.', r2_key: 'lesco/v1/m5/policia/1_2.mp4', version: 1, size_bytes: 713017, duration_s: 7.59 },
  { id: 46, module: 5, category: 'policia', file_code: '1_3', situation: 1, sentence: 3, phrase_es: 'Necesito un intérprete de LESCO para este proceso.', r2_key: 'lesco/v1/m5/policia/1_3.mp4', version: 1, size_bytes: 947395, duration_s: 9.98 },
  { id: 47, module: 5, category: 'policia', file_code: '2_1', situation: 2, sentence: 1, phrase_es: 'Fui víctima de un robo o asalto.', r2_key: 'lesco/v1/m5/policia/2_1.mp4', version: 1, size_bytes: 721803, duration_s: 8.50 },
  { id: 48, module: 5, category: 'policia', file_code: '2_2', situation: 2, sentence: 2, phrase_es: 'Perdí mis documentos personales.', r2_key: 'lesco/v1/m5/policia/2_2.mp4', version: 1, size_bytes: 609931, duration_s: 7.09 },
  { id: 49, module: 5, category: 'policia', file_code: '3_1', situation: 3, sentence: 1, phrase_es: '¿Dónde queda la parada de buses más cercana?', r2_key: 'lesco/v1/m5/policia/3_1.mp4', version: 1, size_bytes: 913230, duration_s: 9.30 },

  // Módulo 6: Perfil, Ajustes y Accesibilidad (3)
  { id: 50, module: 6, category: null, file_code: '6_1', situation: 6, sentence: 1, phrase_es: 'Puedes actualizar tu nombre, teléfono y contacto de emergencia. Recuerda que tu número de cédula es único y permanece bloqueado por seguridad.', r2_key: 'lesco/v1/m6/6_1.mp4', version: 1, size_bytes: 2451261, duration_s: 22.26 },
  { id: 51, module: 6, category: null, file_code: '6_2', situation: 6, sentence: 2, phrase_es: 'Activa la vibración háptica y presiona Probar Vibración para sentir la respuesta táctil que confirmará tus acciones en la aplicación.', r2_key: 'lesco/v1/m6/6_2.mp4', version: 1, size_bytes: 1588854, duration_s: 15.01 },
  { id: 52, module: 6, category: null, file_code: '6_3', situation: 6, sentence: 3, phrase_es: 'Mueve la barra deslizante para aumentar o disminuir el tamaño de los textos en la aplicación según tu comodidad visual.', r2_key: 'lesco/v1/m6/6_3.mp4', version: 1, size_bytes: 1085856, duration_s: 9.57 },

  // Módulo 7: Historial y Soporte (2)
  { id: 53, module: 7, category: null, file_code: '7_1', situation: 7, sentence: 1, phrase_es: 'En tu historial puedes consultar las frases que has traducido anteriormente y las alertas de emergencia emitidas para reproducirlas rápidamente.', r2_key: 'lesco/v1/m7/7_1.mp4', version: 1, size_bytes: 1891734, duration_s: 17.08 },
  { id: 54, module: 7, category: null, file_code: '7_2', situation: 7, sentence: 2, phrase_es: 'Si tienes dudas sobre el uso de LESCOnect, consulta las preguntas frecuentes o contáctanos por WhatsApp y correo para brindarte asistencia.', r2_key: 'lesco/v1/m7/7_2.mp4', version: 1, size_bytes: 1525044, duration_s: 15.63 },
];

let memoryCatalog: VideoCatalogRow[] = FALLBACK_VIDEO_CATALOG;
const inFlightDownloads = new Map<string, Promise<{ uri: string; isLocal: boolean }>>();

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:()"'/]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLocalFilePath(r2Key: string, orientation: VideoOrientation = 'vertical'): string {
  const cleanKey = sanitizeR2Key(r2Key);
  const safeName = `${orientation}_${cleanKey.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${baseDir}videos/${safeName}`;
}

async function getStoredVersions(): Promise<Record<string, number>> {
  try {
    if (Platform.OS === 'web' && typeof window === 'undefined') return {};
    const raw = await AsyncStorage.getItem(VERSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function setStoredVersion(cacheKey: string, version: number): Promise<void> {
  try {
    const current = await getStoredVersions();
    current[cacheKey] = version;
    await AsyncStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

export const videoCacheService = {
  /**
   * Sincroniza el catálogo de 54 videos desde Supabase y lo guarda localmente
   * para disponer de él en modo offline.
   */
  async syncCatalog(): Promise<VideoCatalogRow[]> {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, module, category, file_code, situation, sentence, phrase_es, r2_key, version, size_bytes, duration_s')
        .order('module')
        .order('category')
        .order('situation')
        .order('sentence');

      if (!error && data && data.length > 0) {
        memoryCatalog = data as VideoCatalogRow[];
        await AsyncStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(memoryCatalog)).catch(() => {});
        return memoryCatalog;
      }
    } catch {}

    try {
      const cached = await AsyncStorage.getItem(CATALOG_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as VideoCatalogRow[];
        if (parsed.length > 0) {
          memoryCatalog = parsed;
        }
      }
    } catch {}

    return memoryCatalog;
  },

  /**
   * Trae las frases de una categoría del módulo 5 en orden (como indica lesconect_setup_backend.md)
   */
  async getModule5ByCategory(
    category: 'banco' | 'emergencia' | 'hospital' | 'mensajes' | 'policia'
  ): Promise<VideoCatalogRow[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('id, module, category, file_code, situation, sentence, phrase_es, r2_key, version, size_bytes, duration_s')
      .eq('module', 5)
      .eq('category', category)
      .order('situation')
      .order('sentence');

    if (!error && data && data.length > 0) {
      return data as VideoCatalogRow[];
    }
    return memoryCatalog
      .filter((v) => v.module === 5 && v.category === category)
      .sort((a, b) => a.situation - b.situation || a.sentence - b.sentence);
  },

  /**
   * Obtiene la fila de metadatos del catálogo en memoria (o del catálogo base embebido) para un r2_key.
   */
  getCatalogRow(r2Key: string): VideoCatalogRow | undefined {
    return (
      memoryCatalog.find((v) => v.r2_key === r2Key) ||
      FALLBACK_VIDEO_CATALOG.find((v) => v.r2_key === r2Key)
    );
  },

  /**
   * Resuelve cualquier título, frase o categoría de las pantallas de LESCOnect
   * hacia su r2_key exacto dentro de los 54 videos oficiales.
   */
  resolveR2Key(input: {
    r2Key?: string;
    title?: string;
    category?: string;
    videoUri?: string;
  }): { r2Key: string; version: number; phraseEs?: string } {
    if (input.r2Key) {
      const found = memoryCatalog.find((v) => v.r2_key === input.r2Key);
      return {
        r2Key: input.r2Key,
        version: found?.version ?? 1,
        phraseEs: found?.phrase_es,
      };
    }

    const normTitle = normalizeText(input.title || '');
    const normCat = normalizeText(input.category || '');

    // 1. Coincidencia exacta o contenida con phrase_es del catálogo (con prioridad por categoría si se indica)
    const detectedCat: VideoCatalogRow['category'] = normCat.includes('policia')
      ? 'policia'
      : normCat.includes('banco')
      ? 'banco'
      : normCat.includes('hospital')
      ? 'hospital'
      : normCat.includes('emergencia')
      ? 'emergencia'
      : normCat.includes('mensaje') || normCat.includes('cortesia')
      ? 'mensajes'
      : null;

    if (detectedCat) {
      const byCatAndPhrase = memoryCatalog.find((v) => {
        if (v.category !== detectedCat) return false;
        const normPhrase = normalizeText(v.phrase_es);
        return normPhrase === normTitle || (normTitle.length > 12 && normPhrase.includes(normTitle));
      });
      if (byCatAndPhrase) {
        return {
          r2Key: byCatAndPhrase.r2_key,
          version: byCatAndPhrase.version,
          phraseEs: byCatAndPhrase.phrase_es,
        };
      }
    }

    const byPhrase = memoryCatalog.find((v) => {
      const normPhrase = normalizeText(v.phrase_es);
      return normPhrase === normTitle || (normTitle.length > 12 && normPhrase.includes(normTitle));
    });
    if (byPhrase) {
      return { r2Key: byPhrase.r2_key, version: byPhrase.version, phraseEs: byPhrase.phrase_es };
    }

    if (normTitle.includes('hola buenos dias')) {
      const r2Key = 'lesco/v1/m5/mensajes/1_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }

    // 2. Mapeo directo de botones de módulos (Módulos 1, 2, 3, 4, 6 y 7)
    if (normTitle.includes('pantalla de bienvenida') || normTitle.includes('welcome screen')) {
      const r2Key = 'lesco/v1/m1/1_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('fecha de nacimiento') ||
      normTitle.includes('calendario') ||
      normTitle.includes('datepicker')
    ) {
      const r2Key = 'lesco/v1/m1/1_3.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      (normTitle.includes('contactos sos') ||
        normTitle.includes('contacto sos') ||
        normTitle.includes('contacto de emergencia') ||
        normTitle.includes('mis contactos') ||
        normTitle.includes('contactpicker')) &&
      !normTitle.includes('editar perfil')
    ) {
      const r2Key = 'lesco/v1/m1/1_4.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('como crear tu cuenta') ||
      normTitle.includes('como entrar con codigo sms') ||
      normTitle.includes('formulario de registro') ||
      normCat.includes('registro') ||
      normCat.includes('acceso facil')
    ) {
      const r2Key = 'lesco/v1/m1/1_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('bienvenida a lesconect') ||
      normTitle.includes('encabezado y barra superior') ||
      normTitle.includes('home header') ||
      normCat.includes('introduccion general')
    ) {
      const r2Key = 'lesco/v1/m2/2_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('tarjeta principal del traductor') ||
      normTitle.includes('translator hero') ||
      normTitle === 'traductor lesco'
    ) {
      const r2Key = 'lesco/v1/m2/2_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('controles del reproductor') ||
      normTitle.includes('reproductor de video') ||
      normTitle.includes('velocidad lenta') ||
      normTitle.includes('lesco video player') ||
      normCat.includes('reproductor')
    ) {
      const r2Key = 'lesco/v1/m2/2_4.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('voz a senas') ||
      normTitle.includes('texto a senas') ||
      normTitle.includes('modo texto y voz') ||
      normTitle.includes('texttosigns') ||
      normCat.includes('traduccion a senas')
    ) {
      if (normTitle === 'hola') {
        const r2Key = 'lesco/v1/m5/mensajes/1_1.mp4';
        return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
      }
      if (normTitle.includes('gracias')) {
        const r2Key = 'lesco/v1/m5/mensajes/1_2.mp4';
        return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
      }
      if (normTitle.includes('por favor')) {
        const r2Key = 'lesco/v1/m5/mensajes/2_1.mp4';
        return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
      }
      if (normTitle.includes('donde queda')) {
        const r2Key = 'lesco/v1/m5/policia/3_1.mp4';
        return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
      }
      if (normTitle.includes('necesito ayuda')) {
        const r2Key = 'lesco/v1/m5/emergencia/1_1.mp4';
        return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
      }
      const r2Key = 'lesco/v1/m3/3_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('senas a voz') ||
      normTitle.includes('senas a texto') ||
      normTitle.includes('abecedario') ||
      normTitle.includes('signstotext')
    ) {
      const r2Key = 'lesco/v1/m3/3_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('fuego') || normTitle.includes('incendio')) {
      const r2Key = 'lesco/v1/m5/emergencia/3_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('accidente') || normTitle.includes('ambulancia') || normTitle.includes('emergencia medica')) {
      const r2Key = 'lesco/v1/m5/emergencia/2_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('asalto') || normTitle.includes('delito')) {
      const r2Key = 'lesco/v1/m5/policia/2_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('rescate') || normTitle.includes('atrapad')) {
      const r2Key = 'lesco/v1/m5/emergencia/3_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('conexion y despacho') ||
      normTitle.includes('despacho con el 911') ||
      normTitle.includes('despacho 911') ||
      normTitle.includes('despacho 9-1-1') ||
      normTitle.includes('dispatch 911')
    ) {
      const r2Key = 'lesco/v1/m4/4_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('centro de emergencias') ||
      normTitle.includes('boton de panico') ||
      normTitle.includes('boton sos') ||
      normTitle.includes('alerta silenciosa') ||
      normTitle.includes('senas de emergencia 9-1-1')
    ) {
      const r2Key = 'lesco/v1/m4/4_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('modulo de emergencias 911') ||
      normTitle.includes('banner de emergencia') ||
      normTitle.includes('emergency banner') ||
      normCat.includes('emergencias sos')
    ) {
      const r2Key = 'lesco/v1/m2/2_3.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('mensajes rapidos - emergencia')) {
      const r2Key = 'lesco/v1/m5/emergencia/0.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('mensajes rapidos - policia')) {
      const r2Key = 'lesco/v1/m5/policia/0.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('mensajes rapidos - hospital')) {
      const r2Key = 'lesco/v1/m5/hospital/0.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('mensajes rapidos - banco')) {
      const r2Key = 'lesco/v1/m5/banco/0.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('mensajes rapidos - mensajes') || normTitle.includes('saludos y cortesia')) {
      const r2Key = 'lesco/v1/m5/mensajes/0.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('editar perfil') ||
      normTitle.includes('edicion de perfil') ||
      normTitle.includes('editprofile')
    ) {
      const r2Key = 'lesco/v1/m6/6_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('vibracion haptica') ||
      normTitle.includes('calibracion de vibracion') ||
      normTitle.includes('vibration screen')
    ) {
      const r2Key = 'lesco/v1/m6/6_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('tamano de texto') || normTitle.includes('textsize screen')) {
      const r2Key = 'lesco/v1/m6/6_3.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (normTitle.includes('historial') || normTitle.includes('history screen')) {
      const r2Key = 'lesco/v1/m7/7_1.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }
    if (
      normTitle.includes('ayuda') ||
      normTitle.includes('preguntas frecuentes') ||
      normTitle.includes('recursos lesco') ||
      normTitle.includes('help screen')
    ) {
      const r2Key = 'lesco/v1/m7/7_2.mp4';
      return { r2Key, version: 1, phraseEs: this.getCatalogRow(r2Key)?.phrase_es };
    }

    // Fallback al video de bienvenida / controles (Módulo 2)
    const fallbackKey = 'lesco/v1/m2/2_1.mp4';
    return { r2Key: fallbackKey, version: 1, phraseEs: this.getCatalogRow(fallbackKey)?.phrase_es };
  },

  /**
   * Devuelve la URI reproducible para un r2_key:
   * - En Web: devuelve la URL directa de Cloudflare R2.
   * - En Android/iOS: verifica si el video ya está descargado en FileSystem.documentDirectory + 'videos/'
   *   y si su versión coincide con la de Supabase.
   *   - Si existe y está vigente (o si no hay internet), reproduce desde el archivo local.
   *   - Si no existe o hay una versión nueva en Supabase, lo descarga localmente y devuelve el archivo local
   *     (con fallback a streaming desde R2 si falla la escritura).
   */
  async getPlayableUri(
    r2Key: string,
    expectedVersion?: number,
    orientation: VideoOrientation = 'vertical'
  ): Promise<{ uri: string; isLocal: boolean }> {
    const remoteUri = videoUrl(r2Key, orientation);

    if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
      return { uri: remoteUri, isLocal: false };
    }

    const row = memoryCatalog.find((v) => v.r2_key === r2Key);
    const targetVersion = expectedVersion ?? row?.version ?? 1;
    const cacheKey = `${orientation}:${r2Key}`;
    const localPath = getLocalFilePath(r2Key, orientation);

    const existingPromise = inFlightDownloads.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const resolvePromise = (async (): Promise<{ uri: string; isLocal: boolean }> => {
      try {
        const info = await FileSystem.getInfoAsync(localPath);
        const versions = await getStoredVersions();
        const cachedVersion = versions[cacheKey] ?? 0;

        // Si el archivo local existe y la versión coincide, reproducir directo desde almacenamiento local (100% offline)
        if (info.exists && cachedVersion >= targetVersion) {
          return { uri: localPath, isLocal: true };
        }

        // Intentar descargar versión nueva o faltante desde Cloudflare R2 validando host HTTPS autorizado
        if (isTrustedVideoUrl(remoteUri)) {
          const videosDir = `${FileSystem.documentDirectory}videos`;
          await FileSystem.makeDirectoryAsync(videosDir, { intermediates: true }).catch(() => {});

          const downloadRes = await FileSystem.downloadAsync(remoteUri, localPath);
          if (downloadRes.status === 200) {
            await setStoredVersion(cacheKey, targetVersion);
            return { uri: downloadRes.uri, isLocal: true };
          }
        }

        // Si falló la red pero teníamos una versión previa en caché local, usar el archivo local en modo offline
        if (info.exists) {
          return { uri: localPath, isLocal: true };
        }
      } catch {
        // Modo avión / sin red: si el archivo local ya existe en disco, reproducirlo
        try {
          const fallbackInfo = await FileSystem.getInfoAsync(localPath);
          if (fallbackInfo.exists) {
            return { uri: localPath, isLocal: true };
          }
        } catch {}
      }

      // Plan B: streaming directo desde Cloudflare R2
      return { uri: remoteUri, isLocal: false };
    })();

    inFlightDownloads.set(cacheKey, resolvePromise);
    try {
      return await resolvePromise;
    } finally {
      inFlightDownloads.delete(cacheKey);
    }
  },

  /**
   * Precarga inteligente en el splash (sección 4 de lesconect_setup_backend.md):
   * - Sincroniza el catálogo de 54 videos desde Supabase.
   * - Descarga en segundo plano los videos prioritarios para la demo y uso offline inmediato
   *   (Bienvenida m1/1_1, Home m2/2_1..2_3, los 5 rompehielos 0.mp4 y las frases de emergencia),
   *   sin bloquear la apertura de la app ni saturar la memoria.
   */
  async preloadEssentialVideos(orientation: VideoOrientation = 'vertical'): Promise<void> {
    const catalog = await this.syncCatalog();
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;

    const priorityKeys = new Set<string>([
      'lesco/v1/m1/1_1.mp4',
      'lesco/v1/m1/1_2.mp4',
      'lesco/v1/m1/1_3.mp4',
      'lesco/v1/m1/1_4.mp4',
      'lesco/v1/m2/2_1.mp4',
      'lesco/v1/m2/2_2.mp4',
      'lesco/v1/m2/2_3.mp4',
      'lesco/v1/m2/2_4.mp4',
      'lesco/v1/m4/4_1.mp4',
      'lesco/v1/m4/4_2.mp4',
      'lesco/v1/m5/emergencia/0.mp4',
      'lesco/v1/m5/emergencia/1_1.mp4',
      'lesco/v1/m5/emergencia/1_2.mp4',
      'lesco/v1/m5/emergencia/1_3.mp4',
      'lesco/v1/m5/policia/0.mp4',
      'lesco/v1/m5/hospital/0.mp4',
      'lesco/v1/m5/banco/0.mp4',
      'lesco/v1/m5/mensajes/0.mp4',
    ]);

    const priorityRows = catalog.filter((v) => priorityKeys.has(v.r2_key));

    for (const item of priorityRows) {
      try {
        await this.getPlayableUri(item.r2_key, item.version, orientation);
      } catch {}
    }
  },
};
