/**
 * Servicio del Diccionario Oficial LESCO del CENAREC
 * (Centro Nacional de Recursos para la Educación Inclusiva — MEP, Costa Rica)
 * Referencia: https://lesco.cenarec.go.cr/index.php/diccionariolesco
 *
 * Estructura querológica completa para cada seña:
 * 1) Configuración manual dominante y no dominante (Handshape)
 * 2) Ubicación espacial y plano articulatorio (Location)
 * 3) Orientación de la palma (Palm Orientation)
 * 4) Tipo de movimiento cinemático y repetición (Movement)
 * 5) Expresión no manual / Rasgos faciales (Non-Manual Expression)
 * 6) Firma de captura para entrenamiento por cámara (MediaPipe 21 landmarks)
 *
 * IMPORTANTE (procedencia): el sitio del diccionario CENAREC no pudo consultarse
 * de forma automatizada (contenido multimedia heredado), por lo que TODAS las
 * entradas están marcadas `source: 'pendiente-validacion'`. Las descripciones
 * articulatorias son hipótesis de trabajo para el pipeline de captura y deben
 * contrastarse con el video oficial y con intérpretes/personas sordas antes de
 * cambiarse a `'cenarec-validado'`. Ver LESCOnect-backend/CENAREC_DICTIONARY_TRAINING_GUIDE.md.
 */

import { registerExternalVocabulary } from './lescoGrammarCoherenceService';

export type CenarecEntrySource = 'cenarec-validado' | 'pendiente-validacion';

/** URL base del diccionario oficial; las entradas pendientes no inventan IDs de video. */
export const CENAREC_DICTIONARY_BASE_URL = 'https://lesco.cenarec.go.cr/index.php/diccionariolesco';

export interface CenarecSignEntry {
  id: string;
  wordEs: string;
  gloss: string;
  synonyms: string[];
  category:
    | 'saludos_cortesia'
    | 'pronombres_personas'
    | 'familia'
    | 'salud_cuerpo'
    | 'tramites_banco_documentos'
    | 'emergencias_seguridad'
    | 'verbos_frecuentes'
    | 'tiempo_calendario'
    | 'interrogativos'
    | 'lugares_transporte'
    | 'estado_animo_cortesia'
    | 'educacion_tecnologia'
    | 'numeros'
    | 'colores';
  /**
   * Procedencia de la descripción querológica:
   * - 'cenarec-validado': glosa y articulación contrastadas contra el video oficial
   *   del CENAREC y revisadas por una persona intérprete / persona sorda usuaria de LESCO.
   * - 'pendiente-validacion': descripción de trabajo (no verificada contra el video
   *   oficial). NO debe presentarse como seña oficial hasta su validación.
   */
  source: CenarecEntrySource;
  meaning: string;
  cenarecVideoRef: string;
  articulation: {
    dominantHandshape: string;
    nonDominantHandshape?: string;
    twoHanded: boolean;
    location: 'sien_frente' | 'menton_boca' | 'pecho' | 'hombro' | 'mejilla' | 'espacio_neutro' | 'mano_base';
    palmOrientation: 'frente' | 'adentro' | 'abajo' | 'arriba' | 'lateral';
    movementType:
      | 'estatico'
      | 'oscilante_lateral'
      | 'avance_frontal'
      | 'circular'
      | 'vertical_repetido'
      | 'toque_doble'
      | 'apertura_cierre'
      | 'deslizamiento_sobre_palma'
      | 'alternado_bimanual'
      | 'arco_direccion';
    movementVector: { dx: number; dy: number; dz: number; repetitions: number; durationMs: number };
    nonManualExpression:
      | 'neutral'
      | 'sonrisa_cordial'
      | 'cejas_arriba_pregunta'
      | 'cejas_fruncidas_wh'
      | 'alerta_urgencia'
      | 'asentimiento'
      | 'negacion_cabeza';
  };
  captureSignature: {
    extendedFingers: ('thumb' | 'index' | 'middle' | 'ring' | 'pinky')[];
    curledFingers: ('thumb' | 'index' | 'middle' | 'ring' | 'pinky')[];
    minPinchThumbIndex?: number;
    maxPinchThumbIndex?: number;
    wristHeightZone: 'high' | 'mid' | 'low' | 'any';
    trajectoryPattern:
      | 'static'
      | 'horizontal_wave'
      | 'forward_push'
      | 'circle'
      | 'vertical_nod'
      | 'pinch_repeat'
      | 'upward_lift'
      | 'cross_touch';
    trainingNotes: string;
  };
}

export const CENAREC_DICTIONARY_ENTRIES: CenarecSignEntry[] = [
  // ── 1. SALUDOS Y CORTESÍA ──
  {
    id: 'cenarec_hola',
    wordEs: 'Hola',
    gloss: 'HOLA',
    synonyms: ['saludo', 'buenas', 'que tal'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Saludo cordial habitual abriendo la mano a la altura de la sien.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=hola',
    articulation: {
      dominantHandshape: '5',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'frente',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.12, dy: 0, dz: 0, repetitions: 2, durationMs: 900 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Palma abierta mirando a la cámara, altura superior al mentón, oscilación lateral suave.',
    },
  },
  {
    id: 'cenarec_buenos_dias',
    wordEs: 'Buenos días',
    gloss: 'BUENOS DÍAS',
    synonyms: ['buen dia', 'saludo de manana'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Saludo matutino iniciando en mentón/pecho y abriendo al frente.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=buenos-dias',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: true,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: -0.08, dz: 0.15, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Mano plana parte del pecho y avanza con apertura hacia la persona receptora.',
    },
  },
  {
    id: 'cenarec_buenas_tardes',
    wordEs: 'Buenas tardes',
    gloss: 'BUENAS TARDES',
    synonyms: ['tardes'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Saludo vespertino indicando la caída del sol sobre el antebrazo base.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=buenas-tardes',
    articulation: {
      dominantHandshape: 'B',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'abajo',
      movementType: 'arco_direccion',
      movementVector: { dx: 0, dy: 0.15, dz: 0, repetitions: 1, durationMs: 1200 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Mano dominante desciende en arco suave sobre el antebrazo no dominante horizontal.',
    },
  },
  {
    id: 'cenarec_buenas_noches',
    wordEs: 'Buenas noches',
    gloss: 'BUENAS NOCHES',
    synonyms: ['noches'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Saludo nocturno cubriendo simbólicamente la luz con la mano dominante.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=buenas-noches',
    articulation: {
      dominantHandshape: 'C',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'pecho',
      palmOrientation: 'abajo',
      movementType: 'apertura_cierre',
      movementVector: { dx: 0, dy: 0.12, dz: 0, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Mano curvada cubre el dorso de la mano base simulando el anochecer.',
    },
  },
  {
    id: 'cenarec_gracias',
    wordEs: 'Gracias',
    gloss: 'GRACIAS',
    synonyms: ['agradecido', 'agradecimiento'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Expresión de agradecimiento tocando el mentón con las yemas y extendiendo al frente.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=gracias',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'menton_boca',
      palmOrientation: 'adentro',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: 0.05, dz: 0.18, repetitions: 1, durationMs: 900 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Inicia en el mentón y avanza hacia la cámara con leve inclinación.',
    },
  },
  {
    id: 'cenarec_muchas_gracias',
    wordEs: 'Muchas gracias',
    gloss: 'MUCHAS GRACIAS',
    synonyms: ['mil gracias', 'muy agradecido'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Agradecimiento enfático ejecutado con ambas manos partiendo del mentón hacia el frente.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=muchas-gracias',
    articulation: {
      dominantHandshape: 'B',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'menton_boca',
      palmOrientation: 'adentro',
      movementType: 'avance_frontal',
      movementVector: { dx: 0.05, dy: 0.05, dz: 0.22, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Doble mano en avance simétrico hacia la cámara desde el área de la mandíbula.',
    },
  },
  {
    id: 'cenarec_por_favor',
    wordEs: 'Por favor',
    gloss: 'POR FAVOR',
    synonyms: ['favor', 'le pido'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Petición cortés frotando la palma plana en círculo suave sobre el pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=por-favor',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'circular',
      movementVector: { dx: 0.08, dy: 0.08, dz: 0, repetitions: 2, durationMs: 1200 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'circle',
      trainingNotes: 'Palma sobre el pecho realizando trayectoria circular horaria en plano frontal.',
    },
  },
  {
    id: 'cenarec_con_mucho_gusto',
    wordEs: 'Con mucho gusto',
    gloss: 'CON MUCHO GUSTO',
    synonyms: ['de nada', 'un placer', 'a la orden'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Respuesta cordial al agradecimiento con palma en pecho y apertura de agrado.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=con-gusto',
    articulation: {
      dominantHandshape: '5',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'circular',
      movementVector: { dx: 0.06, dy: 0.06, dz: 0.05, repetitions: 1, durationMs: 950 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'circle',
      trainingNotes: 'Palma extendida con pulgar abierto acariciando el pecho en señal de complacencia.',
    },
  },
  {
    id: 'cenarec_perdon',
    wordEs: 'Perdón / Disculpe',
    gloss: 'PERDÓN',
    synonyms: ['disculpe', 'disculpa', 'lo siento'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Disculpa frotando la barbilla con la yema del pulgar o mano en Y suave.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=perdon',
    articulation: {
      dominantHandshape: 'Y',
      twoHanded: false,
      location: 'menton_boca',
      palmOrientation: 'adentro',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.04, dy: 0, dz: 0, repetitions: 2, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'pinky'],
      curledFingers: ['index', 'middle', 'ring'],
      wristHeightZone: 'high',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Mano en postura Y apoyada cerca del mentón con leve vaivén compungido.',
    },
  },
  {
    id: 'cenarec_bienvenido',
    wordEs: 'Bienvenido',
    gloss: 'BIENVENIDO',
    synonyms: ['bienvenida', 'pase adelante'],
    category: 'saludos_cortesia',
    source: 'pendiente-validacion',
    meaning: 'Gesto de acogida trayendo ambas palmas desde el espacio neutro hacia el pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=bienvenido',
    articulation: {
      dominantHandshape: 'B',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'arriba',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: -0.05, dz: -0.15, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Palmas hacia arriba que se recogen gentilmente hacia el pecho invitando a entrar.',
    },
  },

  // ── 2. PRONOMBRES E IDENTIDAD ──
  {
    id: 'cenarec_yo',
    wordEs: 'Yo',
    gloss: 'YO',
    synonyms: ['mi', 'conmigo'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice señalando con claridad el centro del pecho de la persona emisora.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=yo',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0, dz: -0.08, repetitions: 1, durationMs: 650 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'static',
      trainingNotes: 'Dedo índice apuntando hacia el cuerpo en el esternón sin vacilación.',
    },
  },
  {
    id: 'cenarec_tu',
    wordEs: 'Tú / Usted',
    gloss: 'TÚ',
    synonyms: ['usted', 'vos', 'ti'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice señalando hacia la persona interlocutora al frente.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=tu',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'frente',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: 0, dz: 0.12, repetitions: 1, durationMs: 650 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Dedo índice extendido al frente apuntando directamente a la cámara.',
    },
  },
  {
    id: 'cenarec_nosotros',
    wordEs: 'Nosotros',
    gloss: 'NOSOTROS',
    synonyms: ['nosotras', 'nuestro grupo'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice trazando un semicírculo inclusivo desde el hombro dominante al opuesto.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=nosotros',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'circular',
      movementVector: { dx: 0.22, dy: 0, dz: 0.05, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'circle',
      trainingNotes: 'Arco horizontal amplio frente al pecho de hombro a hombro.',
    },
  },
  {
    id: 'cenarec_persona_sorda',
    wordEs: 'Persona sorda',
    gloss: 'SORDO',
    synonyms: ['sorda', 'comunidad sorda', 'persona no oyente'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Seña de identidad tocando el oído y luego la boca con el dedo índice.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=sordo',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'mejilla',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0.1, dz: 0, repetitions: 1, durationMs: 950 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'cross_touch',
      trainingNotes: 'Dedo índice toca suavemente oreja/sien y desciende tocando comisura labial.',
    },
  },
  {
    id: 'cenarec_oyente',
    wordEs: 'Oyente',
    gloss: 'OYENTE',
    synonyms: ['persona oyente', 'hablante'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Mano en círculo o índice tocando la oreja indicando capacidad auditiva.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=oyente',
    articulation: {
      dominantHandshape: 'C',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0, dz: 0.04, repetitions: 2, durationMs: 850 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'static',
      trainingNotes: 'Mano curvada cerca del pabellón de la oreja con leve rebote.',
    },
  },
  {
    id: 'cenarec_interprete',
    wordEs: 'Intérprete',
    gloss: 'INTÉRPRETE',
    synonyms: ['traductor', 'interpretacion', 'lesco traduccion'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Ambas manos en pinza F o V girando alternadamente simulando el puente comunicativo.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=interprete',
    articulation: {
      dominantHandshape: 'F',
      nonDominantHandshape: 'F',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'lateral',
      movementType: 'alternado_bimanual',
      movementVector: { dx: 0.08, dy: 0.05, dz: 0, repetitions: 2, durationMs: 1200 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['middle', 'ring', 'pinky'],
      curledFingers: ['thumb', 'index'],
      minPinchThumbIndex: 0,
      maxPinchThumbIndex: 0.35,
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Manos en F girando muñecas en vaivén alternado en el centro neutro.',
    },
  },
  {
    id: 'cenarec_nombre',
    wordEs: 'Nombre',
    gloss: 'NOMBRE',
    synonyms: ['como te llamas', 'mi nombre'],
    category: 'pronombres_personas',
    source: 'pendiente-validacion',
    meaning: 'Dedos índice y medio en H rozando la frente o golpeando cruzados en H.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=nombre',
    articulation: {
      dominantHandshape: 'H',
      nonDominantHandshape: 'H',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'lateral',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0.04, dz: 0, repetitions: 2, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Dedos índice y medio de mano dominante golpean suavemente sobre los de la base.',
    },
  },

  // ── 3. SALUD Y HOSPITAL (CCSS / EBAIS) ──
  {
    id: 'cenarec_hospital',
    wordEs: 'Hospital',
    gloss: 'HOSPITAL',
    synonyms: ['clinica', 'ebais', 'centro medico', 'emergencias medicas'],
    category: 'salud_cuerpo',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice trazando una cruz en la frente o brazo simulando la cruz médica.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=hospital',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'hombro',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0.06, dy: 0.06, dz: 0, repetitions: 1, durationMs: 1000 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'cross_touch',
      trainingNotes: 'Trazo de cruz (vertical y horizontal) con dedo índice sobre el brazo/hombro opuesto.',
    },
  },
  {
    id: 'cenarec_medico',
    wordEs: 'Médico / Doctor',
    gloss: 'DOCTOR',
    synonyms: ['medico', 'doctora', 'doctor', 'especialista'],
    category: 'salud_cuerpo',
    source: 'pendiente-validacion',
    meaning: 'Yemas de dedos índice y medio tomando el pulso en la muñeca de la mano base.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=medico',
    articulation: {
      dominantHandshape: 'H',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'mano_base',
      palmOrientation: 'abajo',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0.04, dz: 0, repetitions: 2, durationMs: 850 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Dos dedos tocan con precisión la arteria radial en la muñeca contraria.',
    },
  },
  {
    id: 'cenarec_dolor',
    wordEs: 'Dolor',
    gloss: 'DOLOR',
    synonyms: ['duele', 'fuerte dolor', 'molestia', 'doliendo'],
    category: 'salud_cuerpo',
    source: 'pendiente-validacion',
    meaning: 'Dedos índices enfrentados en giro oscilante con expresión facial de aflicción.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=dolor',
    articulation: {
      dominantHandshape: '1',
      nonDominantHandshape: '1',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'lateral',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.08, dy: 0, dz: 0, repetitions: 3, durationMs: 1100 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Índices apuntándose mutuamente con sacudida vibratoria y ceño fruncido.',
    },
  },
  {
    id: 'cenarec_cita_medica',
    wordEs: 'Cita médica',
    gloss: 'CITA MÉDICA',
    synonyms: ['cita', 'consulta', 'turno medico'],
    category: 'salud_cuerpo',
    source: 'pendiente-validacion',
    meaning: 'Mano curvada en C golpeando suavemente sobre el reloj o dorso de la muñeca.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=cita-medica',
    articulation: {
      dominantHandshape: 'C',
      nonDominantHandshape: 'B',
      twoHanded: true,
      location: 'mano_base',
      palmOrientation: 'abajo',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0.05, dz: 0, repetitions: 2, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Configuración C tocando dorso de muñeca no dominante (cita/hora).',
    },
  },
  {
    id: 'cenarec_medicamentos',
    wordEs: 'Medicamentos / Pastillas',
    gloss: 'PASTILLAS',
    synonyms: ['medicina', 'pastilla', 'farmaco', 'tratamiento'],
    category: 'salud_cuerpo',
    source: 'pendiente-validacion',
    meaning: 'Dedo medio o pinza frotando el centro de la palma contraria como triturando píldora.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=pastillas',
    articulation: {
      dominantHandshape: '1',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'mano_base',
      palmOrientation: 'arriba',
      movementType: 'circular',
      movementVector: { dx: 0.05, dy: 0.05, dz: 0, repetitions: 2, durationMs: 950 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'circle',
      trainingNotes: 'Dedo medio/índice rota sobre la palma receptora simulando pastilla o mortero.',
    },
  },

  // ── 4. TRÁMITES, BANCO Y DOCUMENTOS ──
  {
    id: 'cenarec_cedula',
    wordEs: 'Cédula de identidad',
    gloss: 'CÉDULA',
    synonyms: ['identidad', 'identificacion', 'documento identidad', 'dimex'],
    category: 'tramites_banco_documentos',
    source: 'pendiente-validacion',
    meaning: 'Mano en L o rectángulo formado con pulgar e índice tocando el rostro/pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=cedula',
    articulation: {
      dominantHandshape: 'L',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'frente',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0, dz: -0.06, repetitions: 2, durationMs: 850 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'static',
      trainingNotes: 'Ángulo recto claro de L mostrando identificación frente al pecho.',
    },
  },
  {
    id: 'cenarec_banco',
    wordEs: 'Banco',
    gloss: 'BANCO',
    synonyms: ['banco de costa rica', 'banco nacional', 'caja banco'],
    category: 'tramites_banco_documentos',
    source: 'pendiente-validacion',
    meaning: 'Mano en B acariciando el mentón o simulando conteo de billetes en la palma.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=banco',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'mejilla',
      palmOrientation: 'adentro',
      movementType: 'deslizamiento_sobre_palma',
      movementVector: { dx: 0, dy: 0.08, dz: 0, repetitions: 1, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Configuración B rozando el lateral de la barbilla hacia abajo.',
    },
  },
  {
    id: 'cenarec_tarjeta',
    wordEs: 'Tarjeta',
    gloss: 'TARJETA',
    synonyms: ['tarjeta debito', 'tarjeta credito', 'plastico'],
    category: 'tramites_banco_documentos',
    source: 'pendiente-validacion',
    meaning: 'Simulación de sostener una tarjeta de crédito deslizada sobre el aire o cajero.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=tarjeta',
    articulation: {
      dominantHandshape: 'L',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'lateral',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: 0, dz: 0.12, repetitions: 1, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Pulgar e índice en pinza horizontal empujando tarjeta en ranura.',
    },
  },
  {
    id: 'cenarec_firmar',
    wordEs: 'Firmar',
    gloss: 'FIRMAR',
    synonyms: ['firma', 'firmar documento', 'poner firma'],
    category: 'tramites_banco_documentos',
    source: 'pendiente-validacion',
    meaning: 'Mano dominante imitando la rúbrica con lápiz sobre la palma plana abierta.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=firmar',
    articulation: {
      dominantHandshape: '1',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'mano_base',
      palmOrientation: 'arriba',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.1, dy: 0.03, dz: 0, repetitions: 2, durationMs: 950 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Trazo de zigzag simulando firma manuscrita sobre la palma de apoyo.',
    },
  },
  {
    id: 'cenarec_dinero',
    wordEs: 'Dinero / Efectivo',
    gloss: 'DINERO',
    synonyms: ['plata', 'efectivo', 'colones', 'monto'],
    category: 'tramites_banco_documentos',
    source: 'pendiente-validacion',
    meaning: 'Frote repetido de la yema del pulgar contra el índice y medio mirando hacia arriba.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=dinero',
    articulation: {
      dominantHandshape: '5',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'arriba',
      movementType: 'apertura_cierre',
      movementVector: { dx: 0.02, dy: 0, dz: 0, repetitions: 3, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle'],
      curledFingers: ['ring', 'pinky'],
      minPinchThumbIndex: 0,
      maxPinchThumbIndex: 0.45,
      wristHeightZone: 'mid',
      trajectoryPattern: 'pinch_repeat',
      trainingNotes: 'Frote clásico de pulgar sobre yemas de índice/medio con palma hacia arriba.',
    },
  },

  // ── 5. EMERGENCIAS Y SEGURIDAD (9-1-1) ──
  {
    id: 'cenarec_ayuda',
    wordEs: 'Ayuda',
    gloss: 'AYUDA',
    synonyms: ['auxilio', 'ayudar', 'asistencia', 'socorro'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Mano cerrada en puño con pulgar erguido elevado sobre la palma abierta de apoyo.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=ayuda',
    articulation: {
      dominantHandshape: 'A',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'pecho',
      palmOrientation: 'arriba',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: -0.15, dz: 0.05, repetitions: 1, durationMs: 1000 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: ['thumb'],
      curledFingers: ['index', 'middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'upward_lift',
      trainingNotes: 'Puño dominante con pulgar arriba descansa sobre palma base y asciende con impulso.',
    },
  },
  {
    id: 'cenarec_emergencia',
    wordEs: 'Emergencia / Auxilio',
    gloss: 'EMERGENCIA',
    synonyms: ['urgencia', 'auxilio urgente', 'socorro', '911'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Mano en letra E vibrando enérgicamente de un lado a otro en el centro del pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=emergencia',
    articulation: {
      dominantHandshape: 'E',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'frente',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.12, dy: 0, dz: 0, repetitions: 3, durationMs: 850 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: [],
      curledFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Configuración E sacudiéndose horizontalmente con rostro de alerta apremiante.',
    },
  },
  {
    id: 'cenarec_policia',
    wordEs: 'Policía',
    gloss: 'POLICÍA',
    synonyms: ['oficial', 'fuerza publica', 'seguridad', 'patrulla'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Mano en C o pinza colocada en el lado superior del pecho simulando la placa o estrella policial.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=policia',
    articulation: {
      dominantHandshape: 'C',
      twoHanded: false,
      location: 'hombro',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0, dz: -0.05, repetitions: 2, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'static',
      trainingNotes: 'Pinza C posicionada sobre el pecho izquierdo donde se porta la insignia.',
    },
  },
  {
    id: 'cenarec_bomberos',
    wordEs: 'Bomberos',
    gloss: 'BOMBEROS',
    synonyms: ['cuerpo de bomberos', 'apagar fuego', 'estacion bomberos'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Palma abierta mirando al frente colocada sobre la frente como el escudo del casco de bombero.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=bomberos',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'frente',
      movementType: 'estatico',
      movementVector: { dx: 0, dy: 0, dz: 0, repetitions: 1, durationMs: 900 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'static',
      trainingNotes: 'Dorso de la mano o palma apoyada verticalmente en la frente emulando casco.',
    },
  },
  {
    id: 'cenarec_fuego',
    wordEs: 'Fuego / Incendio',
    gloss: 'FUEGO',
    synonyms: ['humo', 'incendio', 'llamas', 'quemando'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Ambas manos con dedos ondulantes ascendiendo de forma alternada simulando las llamas.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=fuego',
    articulation: {
      dominantHandshape: '5',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'adentro',
      movementType: 'alternado_bimanual',
      movementVector: { dx: 0, dy: -0.18, dz: 0, repetitions: 2, durationMs: 1100 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'upward_lift',
      trainingNotes: 'Movimiento ondulatorio de dedos hacia arriba imitando fuego vivo.',
    },
  },
  {
    id: 'cenarec_ambulancia',
    wordEs: 'Ambulancia',
    gloss: 'AMBULANCIA',
    synonyms: ['cruz roja', 'paramedicos', 'sirena ambulancia'],
    category: 'emergencias_seguridad',
    source: 'pendiente-validacion',
    meaning: 'Mano abierta sobre la cabeza rotando en semicírculo como la luz giratoria de la sirena.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=ambulancia',
    articulation: {
      dominantHandshape: '5',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'abajo',
      movementType: 'circular',
      movementVector: { dx: 0.1, dy: 0, dz: 0.1, repetitions: 2, durationMs: 1000 },
      nonManualExpression: 'alerta_urgencia',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'circle',
      trainingNotes: 'Giro de mano en la coronilla simulando baliza luminosa de vehículo de socorro.',
    },
  },

  // ── 6. VERBOS FRECUENTES ──
  {
    id: 'cenarec_necesitar',
    wordEs: 'Necesitar',
    gloss: 'NECESITAR',
    synonyms: ['necesito', 'requiero', 'hace falta', 'ocupo'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice doblado en gancho (X) descendiendo con firmeza frente al pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=necesitar',
    articulation: {
      dominantHandshape: 'X',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'abajo',
      movementType: 'vertical_repetido',
      movementVector: { dx: 0, dy: 0.15, dz: 0, repetitions: 2, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Dedo índice flexionado en garfio bajando con fuerza enérgica.',
    },
  },
  {
    id: 'cenarec_querer',
    wordEs: 'Querer',
    gloss: 'QUERER',
    synonyms: ['deseo', 'quisiera', 'quiero'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Ambas manos en garra abiertas jalando suavemente hacia el cuerpo como atrayendo algo.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=querer',
    articulation: {
      dominantHandshape: '5',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'arriba',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: 0, dz: -0.15, repetitions: 1, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Manos semicerradas en garra que se retraen hacia el abdomen.',
    },
  },
  {
    id: 'cenarec_tener',
    wordEs: 'Tener',
    gloss: 'TENER',
    synonyms: ['tengo', 'poseo', 'hay'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Mano con yemas dobladas apoyándose con seguridad sobre el pecho.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=tener',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'adentro',
      movementType: 'toque_doble',
      movementVector: { dx: 0, dy: 0, dz: -0.06, repetitions: 1, durationMs: 700 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'static',
      trainingNotes: 'Golpe seco y suave de yemas contra el tórax afirmando pertenencia.',
    },
  },
  {
    id: 'cenarec_ir',
    wordEs: 'Ir',
    gloss: 'IR',
    synonyms: ['vamos', 'ir a', 'desplazarse'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Dedos índice y medio apuntando al frente y avanzando en trayectoria rectilínea.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=ir',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'frente',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: -0.05, dz: 0.2, repetitions: 1, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Índice se proyecta con rapidez hacia adelante señalando destino.',
    },
  },
  {
    id: 'cenarec_entender',
    wordEs: 'Entender / Comprender',
    gloss: 'ENTENDER',
    synonyms: ['comprender', 'capto', 'ya entendi'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice flexionado junto a la sien saltando hacia arriba como bombilla encendida.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=entender',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'adentro',
      movementType: 'apertura_cierre',
      movementVector: { dx: 0, dy: -0.08, dz: 0, repetitions: 1, durationMs: 750 },
      nonManualExpression: 'asentimiento',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'upward_lift',
      trainingNotes: 'Dedo índice pasa de doblado a estirado verticalmente al lado de la frente.',
    },
  },
  {
    id: 'cenarec_escribir',
    wordEs: 'Escribir',
    gloss: 'ESCRIBIR',
    synonyms: ['anotar', 'por escrito', 'redactar'],
    category: 'verbos_frecuentes',
    source: 'pendiente-validacion',
    meaning: 'Mano en pinza imitando un lápiz trazando líneas rápidas sobre la palma contraria.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=escribir',
    articulation: {
      dominantHandshape: 'O',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'mano_base',
      palmOrientation: 'arriba',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.12, dy: 0, dz: 0, repetitions: 2, durationMs: 850 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index'],
      curledFingers: ['ring', 'pinky'],
      minPinchThumbIndex: 0,
      maxPinchThumbIndex: 0.3,
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Gesto de escritura lineal con pinza cerrada sobre palma horizontal.',
    },
  },

  // ── 7. TIEMPO Y CALENDARIO ──
  {
    id: 'cenarec_hoy',
    wordEs: 'Hoy',
    gloss: 'HOY',
    synonyms: ['ahora', 'este dia', 'presente'],
    category: 'tiempo_calendario',
    source: 'pendiente-validacion',
    meaning: 'Ambas manos en letra Y bajando simultáneamente al unísono frente al cuerpo.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=hoy',
    articulation: {
      dominantHandshape: 'Y',
      nonDominantHandshape: 'Y',
      twoHanded: true,
      location: 'pecho',
      palmOrientation: 'arriba',
      movementType: 'vertical_repetido',
      movementVector: { dx: 0, dy: 0.12, dz: 0, repetitions: 2, durationMs: 850 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'pinky'],
      curledFingers: ['index', 'middle', 'ring'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Doble Y con palmas hacia arriba bajando en golpe firme.',
    },
  },
  {
    id: 'cenarec_ayer',
    wordEs: 'Ayer',
    gloss: 'AYER',
    synonyms: ['dia anterior', 'pasado'],
    category: 'tiempo_calendario',
    source: 'pendiente-validacion',
    meaning: 'Dedo pulgar o mano en Y señalando hacia atrás por encima del hombro.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=ayer',
    articulation: {
      dominantHandshape: 'A',
      twoHanded: false,
      location: 'mejilla',
      palmOrientation: 'adentro',
      movementType: 'avance_frontal',
      movementVector: { dx: 0, dy: 0, dz: -0.15, repetitions: 1, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb'],
      curledFingers: ['index', 'middle', 'ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Pulgar apunta hacia el espacio posterior detrás de la cabeza (tiempo pasado).',
    },
  },
  {
    id: 'cenarec_manana',
    wordEs: 'Mañana',
    gloss: 'MAÑANA',
    synonyms: ['siguiente dia', 'proximo dia', 'futuro'],
    category: 'tiempo_calendario',
    source: 'pendiente-validacion',
    meaning: 'Dedo pulgar rozando la mejilla y proyectándose en arco hacia adelante.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=manana',
    articulation: {
      dominantHandshape: 'A',
      twoHanded: false,
      location: 'mejilla',
      palmOrientation: 'lateral',
      movementType: 'arco_direccion',
      movementVector: { dx: 0, dy: 0, dz: 0.18, repetitions: 1, durationMs: 900 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['thumb'],
      curledFingers: ['index', 'middle', 'ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Pulgar sale de la comisura de la mejilla hacia adelante en línea de futuro.',
    },
  },

  // ── 8. INTERROGATIVOS Y AFIRMACIÓN/NEGACIÓN ──
  {
    id: 'cenarec_si',
    wordEs: 'Sí',
    gloss: 'SÍ',
    synonyms: ['si', 'correcto', 'afirmativo', 'de acuerdo'],
    category: 'interrogativos',
    source: 'pendiente-validacion',
    meaning: 'Puño cerrado en S o A que asiente arriba y abajo emulando cabeceo afirmativo.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=si',
    articulation: {
      dominantHandshape: 'S',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'frente',
      movementType: 'vertical_repetido',
      movementVector: { dx: 0, dy: 0.08, dz: 0, repetitions: 2, durationMs: 700 },
      nonManualExpression: 'asentimiento',
    },
    captureSignature: {
      extendedFingers: [],
      curledFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'vertical_nod',
      trainingNotes: 'Puño cerrado cabeceando dos veces de muñeca verticalmente.',
    },
  },
  {
    id: 'cenarec_no',
    wordEs: 'No',
    gloss: 'NO',
    synonyms: ['negativo', 'tampoco', 'para nada'],
    category: 'interrogativos',
    source: 'pendiente-validacion',
    meaning: 'Dedos índice y medio se cierran en pinza enérgica contra el pulgar.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=no',
    articulation: {
      dominantHandshape: 'H',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'frente',
      movementType: 'apertura_cierre',
      movementVector: { dx: 0, dy: 0, dz: 0, repetitions: 2, durationMs: 750 },
      nonManualExpression: 'negacion_cabeza',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle'],
      curledFingers: ['ring', 'pinky'],
      minPinchThumbIndex: 0,
      maxPinchThumbIndex: 0.4,
      wristHeightZone: 'mid',
      trajectoryPattern: 'pinch_repeat',
      trainingNotes: 'Pinza rápida de dos dedos contra pulgar acompañada de negación cefálica.',
    },
  },
  {
    id: 'cenarec_donde',
    wordEs: 'Dónde',
    gloss: 'DÓNDE',
    synonyms: ['adonde', 'que lugar', 'donde queda'],
    category: 'interrogativos',
    source: 'pendiente-validacion',
    meaning: 'Ambas palmas abiertas hacia arriba oscilando lateralmente con cejas fruncidas.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=donde',
    articulation: {
      dominantHandshape: '5',
      nonDominantHandshape: '5',
      twoHanded: true,
      location: 'espacio_neutro',
      palmOrientation: 'arriba',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.08, dy: 0, dz: 0, repetitions: 2, durationMs: 950 },
      nonManualExpression: 'cejas_fruncidas_wh',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Palmas hacia arriba oscilando sutilmente de lado a lado con ceño indagatorio.',
    },
  },
  {
    id: 'cenarec_que',
    wordEs: 'Qué',
    gloss: 'QUÉ',
    synonyms: ['que cosa', 'cual'],
    category: 'interrogativos',
    source: 'pendiente-validacion',
    meaning: 'Dedo índice en vaivén lateral rápido o palma sacudiéndose en pregunta.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=que',
    articulation: {
      dominantHandshape: '1',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'frente',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.06, dy: 0, dz: 0, repetitions: 2, durationMs: 700 },
      nonManualExpression: 'cejas_fruncidas_wh',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Dedo índice oscilando en abanico con mirada concentrada.',
    },
  },
  {
    id: 'cenarec_cuanto',
    wordEs: 'Cuánto',
    gloss: 'CUÁNTO',
    synonyms: ['cuantos', 'que precio', 'monto'],
    category: 'interrogativos',
    source: 'pendiente-validacion',
    meaning: 'Dedos abriéndose en cascada ascendente hacia arriba con cejas fruncidas.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=cuanto',
    articulation: {
      dominantHandshape: '5',
      twoHanded: false,
      location: 'espacio_neutro',
      palmOrientation: 'arriba',
      movementType: 'apertura_cierre',
      movementVector: { dx: 0, dy: -0.1, dz: 0, repetitions: 2, durationMs: 900 },
      nonManualExpression: 'cejas_fruncidas_wh',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'mid',
      trajectoryPattern: 'upward_lift',
      trainingNotes: 'Yemas que se abren secuencialmente hacia el techo consultando cantidad.',
    },
  },

  // ── 9. LUGARES Y TRANSPORTE EN COSTA RICA ──
  {
    id: 'cenarec_bano',
    wordEs: 'Baño / Sanitarios',
    gloss: 'BAÑO',
    synonyms: ['servicios sanitarios', 'inodoro', 'sanitarios'],
    category: 'lugares_transporte',
    source: 'pendiente-validacion',
    meaning: 'Mano en letra T o B oscilando suavemente frente al hombro.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=bano',
    articulation: {
      dominantHandshape: 'T',
      twoHanded: false,
      location: 'hombro',
      palmOrientation: 'frente',
      movementType: 'oscilante_lateral',
      movementVector: { dx: 0.05, dy: 0, dz: 0, repetitions: 2, durationMs: 800 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index'],
      curledFingers: ['middle', 'ring', 'pinky'],
      wristHeightZone: 'high',
      trajectoryPattern: 'horizontal_wave',
      trainingNotes: 'Configuración T o letra manual sacudiéndose de izquierda a derecha.',
    },
  },
  {
    id: 'cenarec_parada_bus',
    wordEs: 'Parada de bus',
    gloss: 'PARADA BUS',
    synonyms: ['parada', 'estacion de bus', 'donde pasa el bus'],
    category: 'lugares_transporte',
    source: 'pendiente-validacion',
    meaning: 'Seña de Bus (manos en volante) seguida de mano en B vertical en alto (poste de parada).',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=parada-bus',
    articulation: {
      dominantHandshape: 'B',
      twoHanded: false,
      location: 'sien_frente',
      palmOrientation: 'frente',
      movementType: 'estatico',
      movementVector: { dx: 0, dy: 0, dz: 0, repetitions: 1, durationMs: 950 },
      nonManualExpression: 'neutral',
    },
    captureSignature: {
      extendedFingers: ['index', 'middle', 'ring', 'pinky'],
      curledFingers: [],
      wristHeightZone: 'high',
      trajectoryPattern: 'static',
      trainingNotes: 'Mano vertical simulando el letrero de parada de transporte público.',
    },
  },
  {
    id: 'cenarec_costa_rica',
    wordEs: 'Costa Rica',
    gloss: 'COSTA RICA',
    synonyms: ['pais', 'nacional', 'tico'],
    category: 'lugares_transporte',
    source: 'pendiente-validacion',
    meaning: 'Mano en C contorneando el área de la costa y cerrando en R.',
    cenarecVideoRef: 'https://lesco.cenarec.go.cr/index.php/diccionariolesco?id=costa-rica',
    articulation: {
      dominantHandshape: 'C',
      twoHanded: false,
      location: 'pecho',
      palmOrientation: 'frente',
      movementType: 'arco_direccion',
      movementVector: { dx: 0.12, dy: 0.04, dz: 0, repetitions: 1, durationMs: 1100 },
      nonManualExpression: 'sonrisa_cordial',
    },
    captureSignature: {
      extendedFingers: ['thumb', 'index', 'middle'],
      curledFingers: ['ring', 'pinky'],
      wristHeightZone: 'mid',
      trajectoryPattern: 'forward_push',
      trainingNotes: 'Letra C deslizándose de izquierda a derecha con orgullo patrio.',
    },
  },

  // ==========================================================================
  // AMPLIACIÓN DEL CORPUS (TRÁMITES EN COSTA RICA) — TODAS PENDIENTES DE VALIDACIÓN
  // Hipótesis articulatorias de trabajo; contrastar con el video CENAREC antes
  // de marcarlas como 'cenarec-validado'.
  // ==========================================================================

  // ── NÚMEROS 0-10 ──
  pv('cenarec_num_0', 'Cero', 'CERO', ['0', 'nada', 'ninguno'], 'numeros',
    'Número 0: dedos curvos formando un círculo con el pulgar (forma O).',
    art('O', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 700)),
    sig([], ['index', 'middle', 'ring', 'pinky'], 'mid', 'static', 'Círculo pulgar-índice cerrado; pinza < 0.05. Validar forma exacta en video.', { maxPinchThumbIndex: 0.05 })),
  pv('cenarec_num_1', 'Uno', 'UNO', ['1', 'una', 'primero'], 'numeros',
    'Número 1: índice extendido, resto de dedos flexionados.',
    art('1', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 600)),
    sig(['index'], ['middle', 'ring', 'pinky'], 'mid', 'static', 'Solo índice extendido. Validar si el pulgar participa.')),
  pv('cenarec_num_2', 'Dos', 'DOS', ['2', 'segundo'], 'numeros',
    'Número 2: índice y medio extendidos y separados.',
    art('V', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 600)),
    sig(['index', 'middle'], ['ring', 'pinky'], 'mid', 'static', 'Índice y medio en V. Validar orientación palmar.')),
  pv('cenarec_num_3', 'Tres', 'TRES', ['3', 'tercero'], 'numeros',
    'Número 3: tres dedos extendidos (variante a validar: pulgar-índice-medio o índice-medio-anular).',
    art('3', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 600)),
    sig(['index', 'middle'], ['pinky'], 'mid', 'static', 'Variante regional pendiente: confirmar qué tres dedos se extienden.')),
  pv('cenarec_num_4', 'Cuatro', 'CUATRO', ['4', 'cuarto'], 'numeros',
    'Número 4: cuatro dedos extendidos, pulgar recogido sobre la palma.',
    art('4', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 600)),
    sig(['index', 'middle', 'ring', 'pinky'], ['thumb'], 'mid', 'static', 'Cuatro dedos extendidos, pulgar flexionado.')),
  pv('cenarec_num_5', 'Cinco', 'CINCO', ['5', 'quinto'], 'numeros',
    'Número 5: mano abierta con los cinco dedos extendidos.',
    art('5', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 600)),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'static', 'Mano abierta estática (diferenciar de HOLA, que oscila a la altura de la sien).')),
  pv('cenarec_num_6', 'Seis', 'SEIS', ['6', 'sexto'], 'numeros',
    'Número 6: configuración a validar (posible combinación bimanual 5+1 o configuración monomanual propia).',
    art('6', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 700), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['thumb'], [], 'mid', 'static', 'Configuración NO confirmada; capturar referencia CENAREC antes de entrenar.')),
  pv('cenarec_num_7', 'Siete', 'SIETE', ['7', 'septimo'], 'numeros',
    'Número 7: configuración a validar (posible 5+2).',
    art('7', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 700), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['thumb', 'index'], [], 'mid', 'static', 'Configuración NO confirmada; capturar referencia CENAREC antes de entrenar.')),
  pv('cenarec_num_8', 'Ocho', 'OCHO', ['8', 'octavo'], 'numeros',
    'Número 8: configuración a validar (posible 5+3).',
    art('8', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 700), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['thumb', 'index', 'middle'], [], 'mid', 'static', 'Configuración NO confirmada; capturar referencia CENAREC antes de entrenar.')),
  pv('cenarec_num_9', 'Nueve', 'NUEVE', ['9', 'noveno'], 'numeros',
    'Número 9: configuración a validar (posible 5+4).',
    art('9', 'espacio_neutro', 'frente', 'estatico', mv(0, 0, 0, 1, 700), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['thumb', 'index', 'middle', 'ring'], [], 'mid', 'static', 'Configuración NO confirmada; capturar referencia CENAREC antes de entrenar.')),
  pv('cenarec_num_10', 'Diez', 'DIEZ', ['10', 'decimo'], 'numeros',
    'Número 10: configuración a validar (posible pulgar extendido con giro de muñeca o ambas manos abiertas).',
    art('A', 'espacio_neutro', 'lateral', 'oscilante_lateral', mv(0.04, 0, 0, 2, 700)),
    sig(['thumb'], ['index', 'middle', 'ring', 'pinky'], 'mid', 'horizontal_wave', 'Configuración NO confirmada; diferenciar de 6 por el movimiento.')),

  // ── DÍAS DE LA SEMANA ──
  pv('cenarec_lunes', 'Lunes', 'LUNES', ['lun'], 'tiempo_calendario',
    'Día lunes; hipótesis: inicial L con pequeño movimiento circular en espacio neutro.',
    art('L', 'espacio_neutro', 'frente', 'circular', mv(0.03, 0.03, 0, 1, 800)),
    sig(['thumb', 'index'], ['middle', 'ring', 'pinky'], 'mid', 'circle', 'Inicializada con L; validar en video si LESCO usa inicialización.')),
  pv('cenarec_martes', 'Martes', 'MARTES', ['mar'], 'tiempo_calendario',
    'Día martes; hipótesis: inicial M con movimiento circular.',
    art('M', 'espacio_neutro', 'frente', 'circular', mv(0.03, 0.03, 0, 1, 800)),
    sig(['index', 'middle', 'ring'], ['pinky'], 'mid', 'circle', 'Pendiente de validación.')),
  pv('cenarec_miercoles', 'Miércoles', 'MIÉRCOLES', ['mie'], 'tiempo_calendario',
    'Día miércoles; hipótesis: inicial con movimiento circular.',
    art('M', 'espacio_neutro', 'frente', 'circular', mv(0.03, 0.03, 0, 1, 800)),
    sig(['index', 'middle', 'ring'], ['pinky'], 'mid', 'circle', 'Pendiente; diferenciar de MARTES por variación de movimiento.')),
  pv('cenarec_jueves', 'Jueves', 'JUEVES', ['jue'], 'tiempo_calendario',
    'Día jueves; hipótesis: inicial J con trazo curvo.',
    art('J', 'espacio_neutro', 'frente', 'arco_direccion', mv(0.02, 0.05, 0, 1, 800)),
    sig(['pinky'], ['index', 'middle', 'ring'], 'mid', 'circle', 'Pendiente de validación.')),
  pv('cenarec_viernes', 'Viernes', 'VIERNES', ['vie'], 'tiempo_calendario',
    'Día viernes; hipótesis: inicial V con movimiento circular.',
    art('V', 'espacio_neutro', 'frente', 'circular', mv(0.03, 0.03, 0, 1, 800)),
    sig(['index', 'middle'], ['ring', 'pinky'], 'mid', 'circle', 'Pendiente de validación.')),
  pv('cenarec_sabado', 'Sábado', 'SÁBADO', ['sab', 'fin de semana'], 'tiempo_calendario',
    'Día sábado; hipótesis: inicial S con movimiento circular.',
    art('S', 'espacio_neutro', 'frente', 'circular', mv(0.03, 0.03, 0, 1, 800)),
    sig([], ['index', 'middle', 'ring', 'pinky'], 'mid', 'circle', 'Puño en S; pendiente de validación.')),
  pv('cenarec_domingo', 'Domingo', 'DOMINGO', ['dom', 'descanso'], 'tiempo_calendario',
    'Día domingo; hipótesis: ambas manos abiertas con movimiento descendente/circular.',
    art('5', 'espacio_neutro', 'frente', 'circular', mv(0.04, 0.03, 0, 1, 900), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'circle', 'Pendiente de validación.')),

  // ── COLORES BÁSICOS ──
  pv('cenarec_rojo', 'Rojo', 'ROJO', ['colorado'], 'colores',
    'Color rojo; hipótesis: índice roza los labios hacia abajo.',
    art('1', 'menton_boca', 'adentro', 'vertical_repetido', mv(0, -0.03, 0, 2, 700)),
    sig(['index'], ['middle', 'ring', 'pinky'], 'high', 'vertical_nod', 'Índice en labios; pendiente de validación.')),
  pv('cenarec_azul', 'Azul', 'AZUL', ['celeste'], 'colores',
    'Color azul; hipótesis: inicial A/B con giro de muñeca en espacio neutro.',
    art('B', 'espacio_neutro', 'lateral', 'oscilante_lateral', mv(0.04, 0, 0, 2, 700)),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'horizontal_wave', 'Pendiente de validación.')),
  pv('cenarec_verde', 'Verde', 'VERDE', [], 'colores',
    'Color verde; hipótesis: inicial V con oscilación lateral.',
    art('V', 'espacio_neutro', 'frente', 'oscilante_lateral', mv(0.04, 0, 0, 2, 700)),
    sig(['index', 'middle'], ['ring', 'pinky'], 'mid', 'horizontal_wave', 'Pendiente de validación.')),
  pv('cenarec_amarillo', 'Amarillo', 'AMARILLO', [], 'colores',
    'Color amarillo; hipótesis: configuración Y con giro de muñeca.',
    art('Y', 'espacio_neutro', 'frente', 'oscilante_lateral', mv(0.04, 0, 0, 2, 700)),
    sig(['thumb', 'pinky'], ['index', 'middle', 'ring'], 'mid', 'horizontal_wave', 'Pendiente de validación.')),
  pv('cenarec_negro', 'Negro', 'NEGRO', ['oscuro'], 'colores',
    'Color negro; hipótesis: índice desliza horizontalmente por la ceja/frente.',
    art('1', 'sien_frente', 'abajo', 'arco_direccion', mv(0.06, 0, 0, 1, 700)),
    sig(['index'], ['middle', 'ring', 'pinky'], 'high', 'horizontal_wave', 'Pendiente de validación.')),
  pv('cenarec_blanco', 'Blanco', 'BLANCO', ['claro'], 'colores',
    'Color blanco; hipótesis: mano abierta en el pecho que se cierra al separarse.',
    art('5', 'pecho', 'adentro', 'apertura_cierre', mv(0, 0, 0.08, 1, 800)),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'forward_push', 'Pendiente de validación.')),

  // ── EMOCIONES / ESTADO DE ÁNIMO ──
  pv('cenarec_feliz', 'Feliz', 'FELIZ', ['contento', 'alegre'], 'estado_animo_cortesia',
    'Estado feliz; hipótesis: mano plana roza el pecho hacia arriba repetidamente.',
    art('B', 'pecho', 'adentro', 'vertical_repetido', mv(0, 0.05, 0, 2, 900), { nonManualExpression: 'sonrisa_cordial' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'upward_lift', 'Sonrisa obligatoria como rasgo no manual. Pendiente.')),
  pv('cenarec_triste', 'Triste', 'TRISTE', ['tristeza', 'deprimido'], 'estado_animo_cortesia',
    'Estado triste; hipótesis: manos abiertas descienden frente al rostro.',
    art('5', 'mejilla', 'adentro', 'vertical_repetido', mv(0, -0.08, 0, 1, 1000), { twoHanded: true, nonDominantHandshape: '5', nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'high', 'vertical_nod', 'Comisuras hacia abajo. Pendiente.')),
  pv('cenarec_enojado', 'Enojado', 'ENOJADO', ['bravo', 'molesto', 'enojo'], 'estado_animo_cortesia',
    'Estado de enojo; hipótesis: dedos en garra ascienden desde el pecho.',
    art('5 garra', 'pecho', 'adentro', 'vertical_repetido', mv(0, 0.07, 0, 1, 800), { nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'upward_lift', 'Dedos semiflexionados; ceño fruncido. Pendiente.')),
  pv('cenarec_miedo', 'Miedo', 'MIEDO', ['susto', 'asustado', 'temor'], 'estado_animo_cortesia',
    'Miedo; hipótesis: ambas manos abiertas se retraen hacia el pecho con temblor.',
    art('5', 'pecho', 'frente', 'alternado_bimanual', mv(0, 0, -0.06, 3, 900), { twoHanded: true, nonDominantHandshape: '5', nonManualExpression: 'alerta_urgencia' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'static', 'Ojos abiertos/alerta. Relevante para denuncias. Pendiente.')),
  pv('cenarec_cansado', 'Cansado', 'CANSADO', ['cansancio', 'agotado'], 'estado_animo_cortesia',
    'Cansancio; hipótesis: manos en hombros/pecho que caen hacia abajo.',
    art('B', 'hombro', 'adentro', 'vertical_repetido', mv(0, -0.06, 0, 1, 1000), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'vertical_nod', 'Hombros caídos como rasgo no manual. Pendiente.')),
  pv('cenarec_nervioso', 'Nervioso', 'NERVIOSO', ['ansioso', 'ansiedad'], 'estado_animo_cortesia',
    'Nerviosismo; hipótesis: dedos que tiemblan alternadamente frente al pecho.',
    art('5', 'pecho', 'abajo', 'alternado_bimanual', mv(0.02, 0, 0, 4, 900), { twoHanded: true, nonDominantHandshape: '5', nonManualExpression: 'alerta_urgencia' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'horizontal_wave', 'Pendiente de validación.')),

  // ── FAMILIA ──
  pv('cenarec_familia', 'Familia', 'FAMILIA', ['familiares', 'parientes'], 'familia',
    'Familia; hipótesis: ambas manos en F describen un círculo que se cierra.',
    art('F', 'espacio_neutro', 'frente', 'circular', mv(0.08, 0, 0.04, 1, 1000), { twoHanded: true, nonDominantHandshape: 'F' }),
    sig(['middle', 'ring', 'pinky'], ['index'], 'mid', 'circle', 'Pendiente de validación.', { maxPinchThumbIndex: 0.06 })),
  pv('cenarec_mama', 'Mamá', 'MAMÁ', ['madre', 'mama'], 'familia',
    'Madre; hipótesis: toque en mejilla/mentón.',
    art('B', 'mejilla', 'adentro', 'toque_doble', mv(0, 0, 0.02, 2, 700)),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'high', 'pinch_repeat', 'Pendiente de validación.')),
  pv('cenarec_papa', 'Papá', 'PAPÁ', ['padre', 'papa'], 'familia',
    'Padre; hipótesis: toque en frente o bigote.',
    art('B', 'sien_frente', 'adentro', 'toque_doble', mv(0, 0, 0.02, 2, 700)),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'high', 'pinch_repeat', 'Pendiente de validación.')),
  pv('cenarec_hijo', 'Hijo', 'HIJO', ['hija', 'hijos'], 'familia',
    'Hijo/hija; hipótesis: mano desciende desde el pecho hacia adelante.',
    art('B', 'pecho', 'arriba', 'avance_frontal', mv(0, -0.04, 0.08, 1, 800)),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'forward_push', 'Género se marca con seña adicional; pendiente.')),
  pv('cenarec_hermano', 'Hermano', 'HERMANO', ['hermana', 'hermanos'], 'familia',
    'Hermano/hermana; hipótesis: índices paralelos que se juntan.',
    art('1', 'espacio_neutro', 'abajo', 'toque_doble', mv(0, 0, 0, 2, 700), { twoHanded: true, nonDominantHandshape: '1' }),
    sig(['index'], ['middle', 'ring', 'pinky'], 'mid', 'cross_touch', 'Pendiente de validación.')),
  pv('cenarec_esposo', 'Esposo', 'ESPOSO', ['esposa', 'pareja', 'marido'], 'familia',
    'Esposo/esposa; hipótesis: referencia al anillo en el dedo anular de la mano base.',
    art('1', 'mano_base', 'abajo', 'toque_doble', mv(0, 0, 0, 2, 700), { twoHanded: true, nonDominantHandshape: '5' }),
    sig(['index'], ['middle', 'ring', 'pinky'], 'mid', 'cross_touch', 'Pendiente de validación.')),
  pv('cenarec_bebe', 'Bebé', 'BEBÉ', ['bebe', 'nino pequeno', 'recien nacido'], 'familia',
    'Bebé; hipótesis: brazos acunando con balanceo lateral.',
    art('B', 'pecho', 'arriba', 'oscilante_lateral', mv(0.06, 0, 0, 2, 1000), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'low', 'horizontal_wave', 'Pendiente de validación.')),

  // ── SALUD / CCSS ──
  pv('cenarec_ccss', 'CCSS', 'CCSS', ['caja', 'seguro social', 'caja costarricense'], 'salud_cuerpo',
    'Caja Costarricense de Seguro Social; hipótesis: deletreo C-C-S-S o seña institucional local.',
    art('C', 'espacio_neutro', 'lateral', 'arco_direccion', mv(0.05, 0, 0, 1, 1200)),
    sig(['thumb', 'index'], [], 'mid', 'forward_push', 'Confirmar si existe seña institucional o se deletrea.')),
  pv('cenarec_ebais', 'EBAIS', 'EBAIS', ['clinica', 'centro de salud'], 'salud_cuerpo',
    'Equipo Básico de Atención Integral en Salud; hipótesis: deletreo o seña local (clínica).',
    art('E', 'espacio_neutro', 'frente', 'arco_direccion', mv(0.05, 0, 0, 1, 1200)),
    sig([], ['index', 'middle', 'ring', 'pinky'], 'mid', 'forward_push', 'Confirmar con comunidad sorda local.')),
  pv('cenarec_enfermo', 'Enfermo', 'ENFERMO', ['enferma', 'enfermedad', 'malo de salud'], 'salud_cuerpo',
    'Enfermo; hipótesis: dedo medio toca frente y pecho simultáneamente.',
    art('5 medio', 'sien_frente', 'adentro', 'toque_doble', mv(0, 0, 0.02, 2, 800), { twoHanded: true, nonDominantHandshape: '5 medio', nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'ring', 'pinky'], [], 'high', 'pinch_repeat', 'Pendiente de validación.')),
  pv('cenarec_fiebre', 'Fiebre', 'FIEBRE', ['calentura', 'temperatura'], 'salud_cuerpo',
    'Fiebre; hipótesis: dorso de la mano en la frente.',
    art('B', 'sien_frente', 'adentro', 'toque_doble', mv(0, 0, 0.02, 2, 800), { nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'high', 'pinch_repeat', 'Pendiente de validación.')),
  pv('cenarec_cabeza', 'Cabeza', 'CABEZA', ['dolor de cabeza', 'migrana'], 'salud_cuerpo',
    'Cabeza; hipótesis: índice señala/toca la sien.',
    art('1', 'sien_frente', 'adentro', 'toque_doble', mv(0, 0, 0.02, 2, 600)),
    sig(['index'], ['middle', 'ring', 'pinky'], 'high', 'pinch_repeat', 'Combinable con DOLOR. Pendiente.')),
  pv('cenarec_embarazada', 'Embarazada', 'EMBARAZADA', ['embarazo', 'encinta'], 'salud_cuerpo',
    'Embarazo; hipótesis: mano curva describe un arco sobre el abdomen.',
    art('C', 'pecho', 'adentro', 'arco_direccion', mv(0, -0.08, 0.08, 1, 1000)),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'low', 'forward_push', 'Pendiente de validación.')),
  pv('cenarec_alergia', 'Alergia', 'ALERGIA', ['alergico', 'alergica'], 'salud_cuerpo',
    'Alergia; hipótesis: deletreo parcial o rascado en antebrazo.',
    art('5 garra', 'mano_base', 'abajo', 'vertical_repetido', mv(0, 0.03, 0, 3, 900), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'vertical_nod', 'Información crítica en farmacia/CCSS. Pendiente.')),

  // ── BANCO Y TRÁMITES ──
  pv('cenarec_cuenta', 'Cuenta bancaria', 'CUENTA', ['cuenta de ahorros', 'cuenta bancaria', 'ahorros'], 'tramites_banco_documentos',
    'Cuenta bancaria; hipótesis: mano dominante desliza sobre la palma base como libreta.',
    art('B', 'mano_base', 'abajo', 'deslizamiento_sobre_palma', mv(0, -0.05, 0, 1, 800), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'cross_touch', 'Pendiente de validación.')),
  pv('cenarec_pagar', 'Pagar', 'PAGAR', ['pago', 'cancelar', 'cobrar'], 'tramites_banco_documentos',
    'Pagar; hipótesis: índice sale desde la palma base hacia adelante.',
    art('1', 'mano_base', 'frente', 'avance_frontal', mv(0, 0, 0.1, 1, 700), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['index'], ['middle', 'ring', 'pinky'], 'mid', 'forward_push', 'Pendiente de validación.')),
  pv('cenarec_deposito', 'Depósito', 'DEPÓSITO', ['depositar', 'transferencia', 'sinpe'], 'tramites_banco_documentos',
    'Depositar; hipótesis: mano en pinza deposita sobre la palma base.',
    art('pinza', 'mano_base', 'abajo', 'avance_frontal', mv(0, -0.05, 0.05, 1, 800), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['middle', 'ring', 'pinky'], [], 'mid', 'forward_push', 'SINPE puede requerir deletreo. Pendiente.', { maxPinchThumbIndex: 0.05 })),
  pv('cenarec_documento', 'Documento', 'DOCUMENTO', ['papel', 'formulario', 'documentos'], 'tramites_banco_documentos',
    'Documento; hipótesis: ambas manos planas delimitan un rectángulo.',
    art('B', 'espacio_neutro', 'abajo', 'arco_direccion', mv(0.06, -0.06, 0, 1, 900), { twoHanded: true, nonDominantHandshape: 'B' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'mid', 'static', 'Pendiente de validación.')),

  // ── POLICÍA / 911 ──
  pv('cenarec_911', 'Nueve uno uno', '9-1-1', ['911', 'linea de emergencia', 'sistema de emergencias'], 'emergencias_seguridad',
    'Número de emergencias 9-1-1: secuencia numérica NUEVE-UNO-UNO.',
    art('9', 'espacio_neutro', 'frente', 'avance_frontal', mv(0, 0, 0.04, 3, 1400), { nonManualExpression: 'alerta_urgencia' }),
    sig(['index'], ['middle', 'ring', 'pinky'], 'mid', 'forward_push', 'Secuencia compuesta; depende de validar NUEVE y UNO.')),
  pv('cenarec_robo', 'Robo', 'ROBO', ['robar', 'asalto', 'ladron'], 'emergencias_seguridad',
    'Robo; hipótesis: dedos en garra arrastran hacia el cuerpo desde la palma base.',
    art('V garra', 'mano_base', 'abajo', 'deslizamiento_sobre_palma', mv(0, 0, -0.08, 1, 700), { twoHanded: true, nonDominantHandshape: 'B', nonManualExpression: 'alerta_urgencia' }),
    sig(['index', 'middle'], ['ring', 'pinky'], 'mid', 'forward_push', 'Pendiente de validación.')),
  pv('cenarec_accidente', 'Accidente', 'ACCIDENTE', ['choque', 'colision'], 'emergencias_seguridad',
    'Accidente; hipótesis: ambos puños chocan en espacio neutro.',
    art('S', 'espacio_neutro', 'frente', 'toque_doble', mv(0.08, 0, 0, 1, 600), { twoHanded: true, nonDominantHandshape: 'S', nonManualExpression: 'alerta_urgencia' }),
    sig([], ['index', 'middle', 'ring', 'pinky'], 'mid', 'cross_touch', 'Pendiente de validación.')),
  pv('cenarec_denuncia', 'Denuncia', 'DENUNCIA', ['denunciar', 'oij', 'reportar'], 'emergencias_seguridad',
    'Denuncia (OIJ/Fuerza Pública); hipótesis: índice sale de la boca hacia adelante (informar).',
    art('1', 'menton_boca', 'frente', 'avance_frontal', mv(0, 0, 0.1, 1, 800)),
    sig(['index'], ['middle', 'ring', 'pinky'], 'high', 'forward_push', 'Pendiente de validación.')),
  pv('cenarec_perdido', 'Perdido', 'PERDIDO', ['perder', 'extraviado', 'perdi'], 'emergencias_seguridad',
    'Perdido/extraviado; hipótesis: manos juntas que se separan abriéndose hacia abajo.',
    art('O', 'espacio_neutro', 'abajo', 'apertura_cierre', mv(0.06, -0.04, 0, 1, 800), { twoHanded: true, nonDominantHandshape: 'O', nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'static', 'Pendiente de validación.')),

  // ── PREGUNTAS ──
  pv('cenarec_cuando', 'Cuándo', 'CUÁNDO', ['cuando', 'que dia', 'que hora'], 'interrogativos',
    'Pregunta temporal ¿cuándo?; hipótesis: dedos tamborilean sobre la mejilla o se mueven alternadamente.',
    art('5', 'mejilla', 'adentro', 'vertical_repetido', mv(0, 0, 0.01, 3, 900), { nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'high', 'pinch_repeat', 'Cejas fruncidas (pregunta qu-). Pendiente.')),
  pv('cenarec_como', 'Cómo', 'CÓMO', ['como', 'de que manera'], 'interrogativos',
    'Pregunta ¿cómo?; hipótesis: manos curvas giran hacia arriba en espacio neutro.',
    art('C', 'espacio_neutro', 'arriba', 'circular', mv(0.03, 0.03, 0, 1, 800), { twoHanded: true, nonDominantHandshape: 'C', nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['thumb', 'index', 'middle', 'ring', 'pinky'], [], 'mid', 'circle', 'Pendiente de validación.')),
  pv('cenarec_quien', 'Quién', 'QUIÉN', ['quien', 'que persona'], 'interrogativos',
    'Pregunta ¿quién?; hipótesis: índice oscila cerca del mentón.',
    art('1', 'menton_boca', 'adentro', 'oscilante_lateral', mv(0.02, 0, 0, 2, 700), { nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['index'], ['middle', 'ring', 'pinky'], 'high', 'horizontal_wave', 'Pendiente de validación.')),
  pv('cenarec_por_que', 'Por qué', 'POR QUÉ', ['porque', 'por que', 'razon', 'motivo'], 'interrogativos',
    'Pregunta ¿por qué?; hipótesis: mano toca la sien y se aleja con cejas fruncidas.',
    art('B', 'sien_frente', 'adentro', 'avance_frontal', mv(0, 0, 0.06, 1, 800), { nonManualExpression: 'cejas_fruncidas_wh' }),
    sig(['index', 'middle', 'ring', 'pinky'], [], 'high', 'forward_push', 'Pendiente de validación.')),
];

// ============================================================================
// FÁBRICAS COMPACTAS PARA ENTRADAS PENDIENTES DE VALIDACIÓN
// (declaraciones de función: se elevan y pueden usarse en el arreglo superior)
// ============================================================================

type CenarecFinger = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
type CenarecArticulation = CenarecSignEntry['articulation'];
type CenarecCaptureSignature = CenarecSignEntry['captureSignature'];

function mv(dx: number, dy: number, dz: number, repetitions: number, durationMs: number): CenarecArticulation['movementVector'] {
  return { dx, dy, dz, repetitions, durationMs };
}

function art(
  dominantHandshape: string,
  location: CenarecArticulation['location'],
  palmOrientation: CenarecArticulation['palmOrientation'],
  movementType: CenarecArticulation['movementType'],
  movementVector: CenarecArticulation['movementVector'],
  extra: Partial<Pick<CenarecArticulation, 'twoHanded' | 'nonDominantHandshape' | 'nonManualExpression'>> = {}
): CenarecArticulation {
  return {
    dominantHandshape,
    nonDominantHandshape: extra.nonDominantHandshape,
    twoHanded: extra.twoHanded ?? false,
    location,
    palmOrientation,
    movementType,
    movementVector,
    nonManualExpression: extra.nonManualExpression ?? 'neutral',
  };
}

function sig(
  extendedFingers: CenarecFinger[],
  curledFingers: CenarecFinger[],
  wristHeightZone: CenarecCaptureSignature['wristHeightZone'],
  trajectoryPattern: CenarecCaptureSignature['trajectoryPattern'],
  trainingNotes: string,
  pinch: { minPinchThumbIndex?: number; maxPinchThumbIndex?: number } = {}
): CenarecCaptureSignature {
  return { extendedFingers, curledFingers, wristHeightZone, trajectoryPattern, trainingNotes, ...pinch };
}

/** Construye una entrada marcada explícitamente como 'pendiente-validacion'. */
function pv(
  id: string,
  wordEs: string,
  gloss: string,
  synonyms: string[],
  category: CenarecSignEntry['category'],
  meaning: string,
  articulation: CenarecArticulation,
  captureSignature: CenarecCaptureSignature
): CenarecSignEntry {
  return {
    id,
    wordEs,
    gloss,
    synonyms,
    category,
    source: 'pendiente-validacion',
    meaning,
    cenarecVideoRef: CENAREC_DICTIONARY_BASE_URL,
    articulation,
    captureSignature,
  };
}

// ============================================================================
// INTEGRACIÓN CON EL MOTOR DE COHERENCIA (SUBAGENTE 5) — IDEMPOTENTE
// ============================================================================

const CATEGORY_LABELS: Record<CenarecSignEntry['category'], string> = {
  saludos_cortesia: 'Cortesía',
  pronombres_personas: 'Pronombre LESCO',
  familia: 'Familia',
  salud_cuerpo: 'Hospital',
  tramites_banco_documentos: 'Banco',
  emergencias_seguridad: 'Emergencia',
  verbos_frecuentes: 'Verbo LESCO',
  tiempo_calendario: 'Tiempo LESCO',
  interrogativos: 'Pregunta LESCO',
  lugares_transporte: 'Ubicación',
  estado_animo_cortesia: 'Emoción',
  educacion_tecnologia: 'Educación',
  numeros: 'Número',
  colores: 'Color',
};

let cenarecVocabularyRegistered = false;
let cenarecVocabularyAddedCount = 0;

/**
 * Registra todo el vocabulario CENAREC en el motor de autocompletado y coherencia
 * (`registerExternalVocabulary`). Idempotente: llamadas sucesivas no vuelven a
 * registrar y devuelven el número de entradas añadidas en la primera llamada.
 */
export function registerCenarecVocabularyIntoGrammar(): number {
  if (cenarecVocabularyRegistered) return cenarecVocabularyAddedCount;
  cenarecVocabularyRegistered = true;

  cenarecVocabularyAddedCount = registerExternalVocabulary(
    CENAREC_DICTIONARY_ENTRIES.map((entry) => ({
      gloss: entry.gloss,
      wordEs: entry.wordEs,
      category: CATEGORY_LABELS[entry.category] ?? 'Diccionario CENAREC',
    }))
  );
  return cenarecVocabularyAddedCount;
}

/** Indica si el vocabulario CENAREC ya fue inyectado en el motor gramatical. */
export function isCenarecVocabularyRegistered(): boolean {
  return cenarecVocabularyRegistered;
}

/** Entradas que aún requieren validación contra el video oficial del CENAREC. */
export function getCenarecEntriesPendingValidation(): CenarecSignEntry[] {
  return CENAREC_DICTIONARY_ENTRIES.filter((entry) => entry.source === 'pendiente-validacion');
}

function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Busca una seña en el catálogo CENAREC por palabra o glosa exacta o sinónimo.
 */
export function findCenarecSignByWordOrGloss(query: string): CenarecSignEntry | null {
  const norm = normalizeWord(query);
  if (!norm) return null;

  for (const entry of CENAREC_DICTIONARY_ENTRIES) {
    if (normalizeWord(entry.wordEs) === norm || normalizeWord(entry.gloss) === norm) {
      return entry;
    }
    if (entry.synonyms.some((s) => normalizeWord(s) === norm)) {
      return entry;
    }
  }

  // Búsqueda por inclusión si longitud >= 4
  if (norm.length >= 4) {
    for (const entry of CENAREC_DICTIONARY_ENTRIES) {
      if (normalizeWord(entry.wordEs).includes(norm) || normalizeWord(entry.gloss).includes(norm)) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Filtra el diccionario CENAREC por texto y categoría opcional.
 */
export function searchCenarecDictionary(query: string, category?: string): CenarecSignEntry[] {
  const norm = normalizeWord(query);

  return CENAREC_DICTIONARY_ENTRIES.filter((entry) => {
    if (category && category !== 'todos' && entry.category !== category) {
      return false;
    }
    if (!norm) return true;

    return (
      normalizeWord(entry.wordEs).includes(norm) ||
      normalizeWord(entry.gloss).includes(norm) ||
      entry.synonyms.some((s) => normalizeWord(s).includes(norm))
    );
  });
}

/**
 * Descompone cualquier frase en español o glosa en la secuencia exacta de señas
 * del Diccionario CENAREC o deletréo dactilológico si es una palabra propia no catalogada.
 */
export function decomposePhraseIntoCenarecSigns(
  spanishOrGlossPhrase: string
): Array<{ token: string; entry: CenarecSignEntry | null; spellLetters?: string[] }> {
  if (!spanishOrGlossPhrase || !spanishOrGlossPhrase.trim()) return [];

  const rawTokens = spanishOrGlossPhrase
    .replace(/[¡!¿?.,;:()"'•\-_/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const results: Array<{ token: string; entry: CenarecSignEntry | null; spellLetters?: string[] }> = [];

  for (const token of rawTokens) {
    const entry = findCenarecSignByWordOrGloss(token);
    if (entry) {
      results.push({ token, entry });
    } else {
      // Palabra sin entrada directa: deletreo dactilológico letra por letra
      const letters = token
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split('')
        .filter((c) => /^[A-ZÑ]$/.test(c));

      results.push({
        token,
        entry: null,
        spellLetters: letters.length > 0 ? letters : undefined,
      });
    }
  }

  return results;
}

/**
 * Empareja las características extraídas de la cámara con las señas del CENAREC.
 */
export function matchCapturedGestureToCenarec(features: {
  extendedFingers: string[];
  wristHeightZone: 'high' | 'mid' | 'low' | 'any';
  trajectoryPattern: string;
  twoHanded?: boolean;
}): CenarecSignEntry | null {
  const normFingers = new Set(features.extendedFingers);

  for (const entry of CENAREC_DICTIONARY_ENTRIES) {
    const sig = entry.captureSignature;

    if (sig.wristHeightZone !== 'any' && features.wristHeightZone !== 'any') {
      if (sig.wristHeightZone !== features.wristHeightZone) continue;
    }

    if (sig.trajectoryPattern !== 'static' && features.trajectoryPattern !== 'static') {
      if (sig.trajectoryPattern !== features.trajectoryPattern) continue;
    }

    const matchesExtended = sig.extendedFingers.every((f) => normFingers.has(f));
    const matchesCurled = sig.curledFingers.every((f) => !normFingers.has(f));

    if (matchesExtended && matchesCurled) {
      if (entry.articulation.twoHanded && features.twoHanded === false) {
        continue;
      }
      return entry;
    }
  }

  return null;
}
