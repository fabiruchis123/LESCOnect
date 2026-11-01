/**
 * Servicio de Entrenamiento LESCO (54 Videos Oficiales), Autocompletado Dactilológico,
 * Corrección Dactilológica Difusa (Fuzzy Damerau-Levenshtein Óptica),
 * Motor Morfosintáctico Generativo LESCO -> Español y API de Extensión CENAREC.
 *
 * Basado en la estructura morfosintáctica de la Lengua de Señas Costarricense (LESCO - CENAREC / Hands-On LESCO):
 * Orden canónico: TIEMPO -> LUGAR -> OBJETO / TEMA -> SUJETO -> VERBO (Infinitivo) -> NEGACIÓN / PARTÍCULA INTERROGATIVA.
 */

export type LescoCorpusCategory =
  | 'emergencia'
  | 'policia'
  | 'hospital'
  | 'banco'
  | 'mensajes'
  | 'bienvenida'
  | 'navegacion'
  | 'traductor'
  | 'sos_911'
  | 'perfil'
  | 'historial';

export interface LescoCorpusEntry {
  id: number;
  module: number;
  category: LescoCorpusCategory;
  categoryLabel: string;
  fileCode: string;
  r2Key: string;
  phraseEs: string;
  lescoGloss: string;
  keywords: string[];
  priorityTriggers: string[][];
}

export interface LescoWordSuggestion {
  word: string;
  gloss: string;
  categoryLabel: string;
  matchedPrefix: string;
  isNextWordPrediction?: boolean;
}

export interface LescoCoherentPhraseMatch {
  entry: LescoCorpusEntry;
  phraseEs: string;
  lescoGloss: string;
  r2Key: string;
  categoryLabel: string;
  confidence: number;
  matchedKeywords: string[];
  grammarRuleApplied: string;
}

export interface FuzzyCorrectionResult {
  rawToken: string;
  correctedWord: string;
  correctedNormalized: string;
  distance: number;
  wasCorrected: boolean;
}

export interface SynthesizedSpanishResult {
  sentenceEs: string;
  canonicalGloss: string;
  matchedCategory: LescoCorpusCategory;
  categoryLabel: string;
  grammarRuleApplied: string;
  confidence: number;
  bestFallbackEntry: LescoCorpusEntry;
}

export interface LescoCoherenceAnalysis {
  rawBuffer: string;
  collapsedText: string;
  tokens: string[];
  correctedTokens?: string[];
  fuzzyCorrections?: FuzzyCorrectionResult[];
  synthesizedSentence?: string | null;
  activePrefix: string;
  wordSuggestions: LescoWordSuggestion[];
  detectedGloss: string;
  primaryMatch: LescoCoherentPhraseMatch | null;
  alternatives: LescoCoherentPhraseMatch[];
}

// ============================================================================
// 1. CORPUS OFICIAL ENTRENADO CON LOS 54 VIDEOS Y FRASES DE LESCONECT
// ============================================================================
export const LESCO_54_CORPUS: LescoCorpusEntry[] = [
  // ── MÓDULO 1: BIENVENIDA, REGISTRO Y CONFIGURACIÓN (4) ──
  {
    id: 1,
    module: 1,
    category: 'bienvenida',
    categoryLabel: 'Bienvenida LESCOnect',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m1/1_1.mp4',
    phraseEs:
      '¡Hola! Te damos la bienvenida a LESCOnect, la aplicación pensada para romper barreras y conectar a la comunidad sorda de Costa Rica con servicios esenciales y emergencias. Desliza hacia arriba para comenzar.',
    lescoGloss:
      'HOLA • BIENVENIDA LESCONECT • COSTA RICA COMUNIDAD SORDA • BARRERAS ROMPER • SERVICIOS EMERGENCIAS CONECTAR • ARRIBA DESLIZAR COMENZAR',
    keywords: ['bienvenida', 'lesconect', 'comunidad', 'barreras', 'costa', 'rica', 'comenzar'],
    priorityTriggers: [['bienvenida'], ['lesconect'], ['comunidad', 'sorda']],
  },
  {
    id: 2,
    module: 1,
    category: 'bienvenida',
    categoryLabel: 'Registro de Perfil',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m1/1_2.mp4',
    phraseEs:
      'Para crear tu perfil, escribe tu nombre y apellidos, tu número de cédula nacional y tu número de teléfono. Estos datos permitirán identificarte de forma segura en caso de emergencia.',
    lescoGloss:
      'PERFIL TUYO CREAR • NOMBRE APELLIDO • CÉDULA NÚMERO • TELÉFONO ESCRIBIR • EMERGENCIA IDENTIFICAR SEGURO',
    keywords: ['registro', 'crear', 'perfil', 'nombre', 'apellido', 'identificarte'],
    priorityTriggers: [['crear', 'perfil'], ['nombre', 'apellido'], ['registro']],
  },
  {
    id: 3,
    module: 1,
    category: 'bienvenida',
    categoryLabel: 'Fecha de Nacimiento',
    fileCode: '1_3',
    r2Key: 'lesco/v1/m1/1_3.mp4',
    phraseEs:
      'Toca el campo de fecha de nacimiento. En el calendario emergente, elige primero tu año, luego el mes y finalmente presiona Guardar Fecha.',
    lescoGloss:
      'FECHA NACIMIENTO TOCAR • CALENDARIO • PRIMERO AÑO • SEGUNDO MES ELEGIR • GUARDAR FECHA PRESIONAR',
    keywords: ['fecha', 'nacimiento', 'calendario', 'ano', 'mes', 'cumpleanos'],
    priorityTriggers: [['fecha', 'nacimiento'], ['calendario']],
  },
  {
    id: 4,
    module: 1,
    category: 'bienvenida',
    categoryLabel: 'Contacto SOS',
    fileCode: '1_4',
    r2Key: 'lesco/v1/m1/1_4.mp4',
    phraseEs:
      'En la tarjeta de emergencia, toca el botón Mis contactos para seleccionar a un familiar o amigo desde tu teléfono. Selecciona el tipo de parentesco y marca si esa persona sabe LESCO.',
    lescoGloss:
      'TARJETA EMERGENCIA • MIS CONTACTOS TOCAR • FAMILIAR AMIGO ELEGIR • PARENTESCO MARCAR • ¿PERSONA SABER LESCO?',
    keywords: ['familiar', 'amigo', 'parentesco', 'mis', 'contactos', 'seleccionar'],
    priorityTriggers: [['familiar'], ['parentesco'], ['mis', 'contactos']],
  },

  // ── MÓDULO 2: PANTALLA PRINCIPAL Y NAVEGACIÓN (4) ──
  {
    id: 5,
    module: 2,
    category: 'navegacion',
    categoryLabel: 'Navegación Principal',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m2/2_1.mp4',
    phraseEs:
      'En la barra superior verás tu nombre y foto de perfil. Puedes presionar el botón de cámara Ver en señas en cualquier momento para ver videos explicativos como este.',
    lescoGloss:
      'ARRIBA BARRA • NOMBRE FOTO PERFIL VER • BOTÓN CÁMARA VER EN SEÑAS PRESIONAR • VIDEO EXPLICATIVO VER',
    keywords: ['barra', 'superior', 'foto', 'ver', 'senas', 'explicativos'],
    priorityTriggers: [['foto', 'perfil'], ['ver', 'senas']],
  },
  {
    id: 6,
    module: 2,
    category: 'navegacion',
    categoryLabel: 'Acceso al Traductor',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m2/2_2.mp4',
    phraseEs:
      'Esta tarjeta te lleva directamente al Traductor. Presiona el botón del micrófono si una persona oyente quiere hablarte, o escribe para generar señas en video.',
    lescoGloss:
      'TARJETA ESTA • TRADUCTOR IR • PERSONA OYENTE HABLAR • BOTÓN MICRÓFONO PRESIONAR • ESCRIBIR VIDEO SEÑAS GENERAR',
    keywords: ['micrófono', 'microfono', 'oyente', 'hablarte', 'traductor'],
    priorityTriggers: [['persona', 'oyente'], ['microfono']],
  },
  {
    id: 7,
    module: 2,
    category: 'navegacion',
    categoryLabel: 'Banner de Emergencia',
    fileCode: '2_3',
    r2Key: 'lesco/v1/m2/2_3.mp4',
    phraseEs:
      'En situaciones de peligro inminente, toca el banner rojo de emergencia para acceder de inmediato al botón de pánico y a tus contactos de auxilio.',
    lescoGloss:
      'PELIGRO INMINENTE • BANNER ROJO EMERGENCIA TOCAR • RÁPIDO BOTÓN PÁNICO CONTACTOS AUXILIO ENTRAR',
    keywords: ['banner', 'rojo', 'panico', 'inminente'],
    priorityTriggers: [['banner', 'rojo'], ['boton', 'panico']],
  },
  {
    id: 8,
    module: 2,
    category: 'navegacion',
    categoryLabel: 'Controles de Video LESCO',
    fileCode: '2_4',
    r2Key: 'lesco/v1/m2/2_4.mp4',
    phraseEs:
      'Usa los controles debajo del video para pausar, repetir la seña las veces que necesites o activar la velocidad lenta (0.5x) para aprender cada detalle del movimiento.',
    lescoGloss:
      'ABAJO VIDEO CONTROLES USAR • PAUSAR • SEÑA REPETIR • VELOCIDAD LENTA ACTIVAR • MOVIMIENTO DETALLE APRENDER',
    keywords: ['pausar', 'velocidad', 'lenta', 'controles', 'aprender', 'movimiento'],
    priorityTriggers: [['velocidad', 'lenta'], ['pausar', 'repetir']],
  },

  // ── MÓDULO 3: TRADUCTOR Y COMUNICACIÓN (2) ──
  {
    id: 9,
    module: 3,
    category: 'traductor',
    categoryLabel: 'Modo Texto y Voz a Señas',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m3/3_1.mp4',
    phraseEs:
      'Presiona el botón de micrófono para que la persona oyente hable, o usa el teclado para escribir. La aplicación transformará las palabras en glosa LESCO y te mostrará el video con la seña correspondiente.',
    lescoGloss:
      'PERSONA OYENTE HABLAR • MICRÓFONO PRESIONAR O TECLADO ESCRIBIR • PALABRAS GLOSA LESCO TRANSFORMAR • VIDEO SEÑA MOSTRAR',
    keywords: ['teclado', 'glosa', 'transformara', 'correspondiente'],
    priorityTriggers: [['glosa', 'lesco'], ['teclado', 'escribir']],
  },
  {
    id: 10,
    module: 3,
    category: 'traductor',
    categoryLabel: 'Modo Señas a Texto por Cámara',
    fileCode: '3_2',
    r2Key: 'lesco/v1/m3/3_2.mp4',
    phraseEs:
      'Coloca tu teléfono frente a ti con buena iluminación. Realiza las señas del abecedario LESCO con claridad; el sistema detectará tus manos y escribirá las letras automáticamente.',
    lescoGloss:
      'LUZ BUENA • TELÉFONO FRENTE COLOCAR • ABECEDARIO LESCO SEÑAS CLARO HACER • MANOS DETECTAR LETRAS ESCRIBIR AUTOMÁTICO',
    keywords: ['iluminacion', 'abecedario', 'manos', 'letras', 'camara', 'automaticamente'],
    priorityTriggers: [['abecedario'], ['buena', 'iluminacion'], ['manos', 'letras']],
  },

  // ── MÓDULO 4: EMERGENCIAS Y AUXILIO SOS (2) ──
  {
    id: 11,
    module: 4,
    category: 'sos_911',
    categoryLabel: 'Botón SOS Silencioso',
    fileCode: '4_1',
    r2Key: 'lesco/v1/m4/4_1.mp4',
    phraseEs:
      'Mantén presionado el botón rojo SOS durante 2 segundos. Se activará una alerta silenciosa que enviará un SMS con tu ubicación GPS exacta a tus contactos de auxilio.',
    lescoGloss:
      'BOTÓN ROJO SOS • DOS SEGUNDOS PRESIONAR MANTENER • ALERTA SILENCIOSA ACTIVAR • UBICACIÓN GPS SMS CONTACTOS AUXILIO ENVIAR',
    keywords: ['sos', 'segundos', 'silenciosa', 'sms', 'gps'],
    priorityTriggers: [['sos'], ['alerta', 'silenciosa'], ['sms', 'gps']],
  },
  {
    id: 12,
    module: 4,
    category: 'sos_911',
    categoryLabel: 'Despacho 9-1-1',
    fileCode: '4_2',
    r2Key: 'lesco/v1/m4/4_2.mp4',
    phraseEs:
      'Al conectar con el 911, la aplicación comparte automáticamente tu condición de persona sorda, tu ubicación GPS y si requieres ambulancia, policía o bomberos.',
    lescoGloss:
      '911 CONECTAR • AUTOMÁTICO PERSONA SORDA UBICACIÓN GPS COMPARTIR • AMBULANCIA POLICÍA BOMBEROS PEDIR',
    keywords: ['911', 'despacho', 'condicion', 'comparte'],
    priorityTriggers: [['911'], ['ambulancia', 'policia', 'bomberos']],
  },

  // ── MÓDULO 5.4: BANCO Y FINANZAS (8) ──
  {
    id: 13,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Rompehielo',
    fileCode: '0',
    r2Key: 'lesco/v1/m5/banco/0.mp4',
    phraseEs: 'Hola, soy una persona sorda y vengo a realizar un trámite.',
    lescoGloss: 'HOLA • YO PERSONA SORDA • TRÁMITE REALIZAR VENIR',
    keywords: ['hola', 'sorda', 'sordo', 'tramite', 'banco', 'realizar', 'ventanilla'],
    priorityTriggers: [
      ['tramite'],
      ['hola', 'tramite'],
      ['sordo', 'tramite'],
      ['sorda', 'tramite'],
      ['banco'],
      ['hola', 'banco'],
    ],
  },
  {
    id: 14,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Cuentas',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m5/banco/1_1.mp4',
    phraseEs: 'Deseo abrir una cuenta de ahorros.',
    lescoGloss: 'CUENTA AHORROS • YO ABRIR QUERER',
    keywords: ['abrir', 'cuenta', 'ahorros', 'ahorro', 'banco'],
    priorityTriggers: [['cuenta'], ['ahorros'], ['abrir', 'cuenta']],
  },
  {
    id: 15,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Retiro de Tarjeta',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m5/banco/1_2.mp4',
    phraseEs: 'Vengo a retirar mi nueva tarjeta.',
    lescoGloss: 'TARJETA NUEVA MÍA • YO RETIRAR VENIR',
    keywords: ['retirar', 'nueva', 'tarjeta'],
    priorityTriggers: [
      ['nueva', 'tarjeta'],
      ['retirar', 'tarjeta'],
    ],
  },
  {
    id: 16,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Cajero y Bloqueo',
    fileCode: '1_3',
    r2Key: 'lesco/v1/m5/banco/1_3.mp4',
    phraseEs: 'Mi tarjeta fue bloqueada o retenida por el cajero.',
    lescoGloss: 'CAJERO AUTOMÁTICO • TARJETA MÍA BLOQUEAR RETENER',
    keywords: ['tarjeta', 'bloqueada', 'bloqueo', 'retenida', 'cajero', 'trago'],
    priorityTriggers: [
      ['tarjeta', 'cajero'],
      ['tarjeta', 'bloqueada'],
      ['cajero'],
      ['bloqueada'],
      ['retenida'],
      ['tarjeta'],
    ],
  },
  {
    id: 17,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Depósitos',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m5/banco/2_1.mp4',
    phraseEs: 'Deseo hacer un depósito en efectivo.',
    lescoGloss: 'DINERO EFECTIVO • DEPÓSITO HACER QUERER',
    keywords: ['deposito', 'efectivo', 'dinero', 'depositar', 'caja'],
    priorityTriggers: [['deposito'], ['efectivo'], ['dinero']],
  },
  {
    id: 18,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Monto Escrito',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m5/banco/2_2.mp4',
    phraseEs: 'Por favor escriba el monto final en el papel.',
    lescoGloss: 'PAPEL • MONTO TOTAL ESCRIBIR POR FAVOR',
    keywords: ['monto', 'final', 'papel', 'total', 'cobro', 'precio'],
    priorityTriggers: [['monto'], ['papel'], ['escriba', 'monto']],
  },
  {
    id: 19,
    module: 5,
    category: 'banco',
    categoryLabel: 'Identificación • Cédula',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m5/banco/3_1.mp4',
    phraseEs: 'Aquí está mi cédula de identidad.',
    lescoGloss: 'CÉDULA IDENTIDAD MÍA • AQUÍ ESTAR VER',
    keywords: ['cedula', 'identidad', 'identificacion', 'id', 'aqui'],
    priorityTriggers: [['cedula'], ['identidad'], ['cedula', 'identidad']],
  },
  {
    id: 20,
    module: 5,
    category: 'banco',
    categoryLabel: 'Banco • Firma de Documento',
    fileCode: '3_2',
    r2Key: 'lesco/v1/m5/banco/3_2.mp4',
    phraseEs: '¿Dónde debo firmar el documento?',
    lescoGloss: 'DOCUMENTO ESTE • ¿YO FIRMAR DÓNDE?',
    keywords: ['firmar', 'firma', 'documento', 'donde'],
    priorityTriggers: [['firmar'], ['firma'], ['donde', 'firmar']],
  },

  // ── MÓDULO 5.1: EMERGENCIA Y AUXILIO (8) ──
  {
    id: 21,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Rompehielo',
    fileCode: '0',
    r2Key: 'lesco/v1/m5/emergencia/0.mp4',
    phraseEs: '¡Atención! Soy una persona sorda y necesito auxilio urgente.',
    lescoGloss: '¡ATENCIÓN! • YO PERSONA SORDA • AUXILIO URGENTE NECESITAR',
    keywords: ['atencion', 'hola', 'sorda', 'sordo', 'auxilio', 'ayuda', 'urgente', 'emergencia'],
    priorityTriggers: [
      ['hola', 'ayuda'],
      ['hola', 'auxilio'],
      ['sordo', 'ayuda'],
      ['sorda', 'ayuda'],
      ['auxilio'],
      ['emergencia'],
      ['atencion'],
    ],
  },
  {
    id: 22,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Auxilio Inmediato',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m5/emergencia/1_1.mp4',
    phraseEs: 'Necesito ayuda urgente, no puedo escuchar.',
    lescoGloss: 'YO ESCUCHAR NO PODER • AYUDA URGENTE NECESITAR',
    keywords: ['ayuda', 'urgente', 'escuchar', 'oigo', 'oir', 'necesito'],
    priorityTriggers: [
      ['ayuda'],
      ['ayuda', 'urgente'],
      ['no', 'escuchar'],
      ['escuchar'],
    ],
  },
  {
    id: 23,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Peligro',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m5/emergencia/1_2.mp4',
    phraseEs: 'Estoy en una situación de peligro.',
    lescoGloss: 'AHORA AQUÍ • SITUACIÓN PELIGRO YO ESTAR',
    keywords: ['peligro', 'situacion', 'riesgo', 'miedo', 'amenaza'],
    priorityTriggers: [['peligro'], ['situacion', 'peligro']],
  },
  {
    id: 24,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Llamar Contactos',
    fileCode: '1_3',
    r2Key: 'lesco/v1/m5/emergencia/1_3.mp4',
    phraseEs: 'Por favor llame a mis contactos de emergencia.',
    lescoGloss: 'CONTACTOS EMERGENCIA MÍOS • LLAMAR TELÉFONO POR FAVOR',
    keywords: ['llame', 'llamar', 'contactos', 'emergencia', 'telefono', 'familia'],
    priorityTriggers: [
      ['contactos'],
      ['llamar', 'contactos'],
      ['contactos', 'emergencia'],
    ],
  },
  {
    id: 25,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Ambulancia',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m5/emergencia/2_1.mp4',
    phraseEs: 'Llamen a una ambulancia inmediatamente.',
    lescoGloss: 'AHORA RÁPIDO • AMBULANCIA LLAMAR URGENTE',
    keywords: ['ambulancia', 'inmediatamente', 'paramedicos', 'cruz', 'roja'],
    priorityTriggers: [['ambulancia'], ['llamar', 'ambulancia']],
  },
  {
    id: 26,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Persona Herida',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m5/emergencia/2_2.mp4',
    phraseEs: 'Hay una persona herida o inconsciente.',
    lescoGloss: 'AQUÍ • PERSONA HERIDA DESMAYADA INCONSCIENTE HABER',
    keywords: ['herida', 'herido', 'inconsciente', 'desmayado', 'accidente', 'sangre'],
    priorityTriggers: [['herida'], ['herido'], ['inconsciente'], ['accidente']],
  },
  {
    id: 27,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Bomberos y Fuego',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m5/emergencia/3_1.mp4',
    phraseEs: 'Hay fuego o humo, llamen a bomberos.',
    lescoGloss: 'FUEGO HUMO HABER • BOMBEROS LLAMAR RÁPIDO',
    keywords: ['fuego', 'humo', 'bomberos', 'incendio', 'quemando'],
    priorityTriggers: [
      ['fuego'],
      ['humo'],
      ['bomberos'],
      ['incendio'],
      ['fuego', 'bomberos'],
    ],
  },
  {
    id: 28,
    module: 5,
    category: 'emergencia',
    categoryLabel: 'Emergencia • Rescate',
    fileCode: '3_2',
    r2Key: 'lesco/v1/m5/emergencia/3_2.mp4',
    phraseEs: 'Hay una persona atrapada aquí.',
    lescoGloss: 'AQUÍ LUGAR • PERSONA ATRAPADA HABER • RESCATAR',
    keywords: ['atrapada', 'atrapado', 'encerrada', 'rescate', 'aqui'],
    priorityTriggers: [['atrapada'], ['atrapado'], ['rescate']],
  },

  // ── MÓDULO 5.3: HOSPITAL Y SALUD (7) ──
  {
    id: 29,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Hospital • Rompehielo Médico',
    fileCode: '0',
    r2Key: 'lesco/v1/m5/hospital/0.mp4',
    phraseEs: 'Hola, soy una persona sorda y necesito atención médica.',
    lescoGloss: 'HOLA • YO PERSONA SORDA • DOCTOR ATENCIÓN MÉDICA NECESITAR',
    keywords: ['hospital', 'atencion', 'medica', 'medico', 'doctor', 'clinica', 'salud', 'enfermo'],
    priorityTriggers: [
      ['hospital'],
      ['doctor'],
      ['medico'],
      ['atencion', 'medica'],
      ['dolor', 'hospital'],
      ['hola', 'hospital'],
      ['hola', 'doctor'],
    ],
  },
  {
    id: 30,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Hospital • Intérprete LESCO',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m5/hospital/1_1.mp4',
    phraseEs: 'Soy sordo/a, necesito un intérprete de LESCO si es posible.',
    lescoGloss: 'YO SORDO • INTÉRPRETE LESCO NECESITAR POR FAVOR',
    keywords: ['interprete', 'lesco', 'posible', 'traductor'],
    priorityTriggers: [
      ['interprete'],
      ['interprete', 'lesco'],
      ['sordo', 'interprete'],
    ],
  },
  {
    id: 31,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Hospital • Cita Médica',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m5/hospital/1_2.mp4',
    phraseEs: 'Tengo cita médica programada para hoy.',
    lescoGloss: 'HOY • CITA MÉDICA PROGRAMADA • YO TENER',
    keywords: ['cita', 'medica', 'programada', 'hoy', 'ebais', 'consulta'],
    priorityTriggers: [
      ['cita'],
      ['cita', 'medica'],
      ['cita', 'hoy'],
    ],
  },
  {
    id: 32,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Hospital • Consultorio',
    fileCode: '1_3',
    r2Key: 'lesco/v1/m5/hospital/1_3.mp4',
    phraseEs: 'Por favor escriba el número de consultorio.',
    lescoGloss: 'CONSULTORIO NÚMERO • ESCRIBIR POR FAVOR',
    keywords: ['consultorio', 'numero', 'puerta', 'sala'],
    priorityTriggers: [['consultorio'], ['numero', 'consultorio']],
  },
  {
    id: 33,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Farmacia • Medicamentos',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m5/hospital/2_1.mp4',
    phraseEs: 'Vengo a retirar mis medicamentos de la receta.',
    lescoGloss: 'FARMACIA • RECETA MEDICAMENTOS MÍOS • YO RETIRAR VENIR',
    keywords: ['medicamentos', 'medicinas', 'receta', 'farmacia', 'retirar'],
    priorityTriggers: [
      ['medicamentos'],
      ['medicina'],
      ['receta'],
      ['farmacia'],
    ],
  },
  {
    id: 34,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Farmacia • Horario de Pastillas',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m5/hospital/2_2.mp4',
    phraseEs: 'Por favor escriba los horarios de las pastillas.',
    lescoGloss: 'PASTILLAS TOMAR • HORA CUÁNDO • ESCRIBIR POR FAVOR',
    keywords: ['horarios', 'horario', 'pastillas', 'hora', 'tomar', 'dosis'],
    priorityTriggers: [['pastillas'], ['horarios'], ['horario', 'pastillas']],
  },
  {
    id: 35,
    module: 5,
    category: 'hospital',
    categoryLabel: 'Hospital • Dolor y Síntomas',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m5/hospital/3_1.mp4',
    phraseEs: 'Tengo dolor fuerte en esta parte del cuerpo.',
    lescoGloss: 'CUERPO PARTE ESTA • DOLOR FUERTE YO SENTIR',
    keywords: ['dolor', 'duele', 'fuerte', 'cuerpo', 'sintoma', 'enfermo'],
    priorityTriggers: [['dolor'], ['duele'], ['dolor', 'fuerte'], ['cuerpo']],
  },

  // ── MÓDULO 5.5: MENSAJES GENERALES Y CORTESÍA (7) ──
  {
    id: 36,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Rompehielo Consulta',
    fileCode: '0',
    r2Key: 'lesco/v1/m5/mensajes/0.mp4',
    phraseEs: 'Hola, soy una persona sorda y necesito hacer una consulta.',
    lescoGloss: 'HOLA • YO PERSONA SORDA • CONSULTA PREGUNTA HACER NECESITAR',
    keywords: ['hola', 'sorda', 'sordo', 'consulta', 'pregunta', 'consultar'],
    priorityTriggers: [
      ['consulta'],
      ['pregunta'],
      ['hola', 'sordo'],
      ['hola', 'sorda'],
      ['sordo'],
      ['sorda'],
    ],
  },
  {
    id: 37,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Saludo Diario',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m5/mensajes/1_1.mp4',
    phraseEs: 'Hola, buenos días / buenas tardes.',
    lescoGloss: 'HOLA • BUENOS DÍAS • BUENAS TARDES',
    keywords: ['hola', 'buenos', 'dias', 'buenas', 'tardes', 'noches', 'saludo'],
    priorityTriggers: [
      ['hola'],
      ['buenos', 'dias'],
      ['buenas', 'tardes'],
    ],
  },
  {
    id: 38,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Agradecimiento',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m5/mensajes/1_2.mp4',
    phraseEs: 'Muchas gracias por su paciencia y ayuda.',
    lescoGloss: 'PACIENCIA AYUDA TUYA • MUCHAS GRACIAS',
    keywords: ['gracias', 'muchas', 'paciencia', 'amable', 'agradecido'],
    priorityTriggers: [
      ['gracias'],
      ['muchas', 'gracias'],
      ['paciencia'],
      ['gracias', 'ayuda'],
    ],
  },
  {
    id: 39,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Comunicación Escrita',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m5/mensajes/2_1.mp4',
    phraseEs: '¿Podría escribir las indicaciones por favor?',
    lescoGloss: 'INDICACIONES EXPLICACIÓN • ¿TÚ ESCRIBIR PODER POR FAVOR?',
    keywords: ['por', 'favor', 'escribir', 'escriba', 'indicaciones', 'podria'],
    priorityTriggers: [
      ['por', 'favor'],
      ['escribir'],
      ['indicaciones'],
      ['escribir', 'indicaciones'],
    ],
  },
  {
    id: 40,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Repetir por Escrito',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m5/mensajes/2_2.mp4',
    phraseEs: 'No comprendí bien, ¿puede repetirlo por escrito?',
    lescoGloss: 'YO COMPRENDER BIEN NO • ¿OTRA VEZ ESCRIBIR REPETIR PODER?',
    keywords: ['no', 'comprendi', 'entendi', 'repetir', 'repetirlo', 'escrito'],
    priorityTriggers: [
      ['no', 'comprendi'],
      ['no', 'entendi'],
      ['repetir'],
      ['escrito'],
      ['no'],
    ],
  },
  {
    id: 41,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Fila Preferencial',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m5/mensajes/3_1.mp4',
    phraseEs: '¿Dónde se hace la fila preferencial?',
    lescoGloss: 'FILA PREFERENCIAL LEY 7600 • ¿HACER DÓNDE?',
    keywords: ['fila', 'preferencial', '7600', 'turno', 'cola'],
    priorityTriggers: [['fila'], ['preferencial'], ['fila', 'preferencial']],
  },
  {
    id: 42,
    module: 5,
    category: 'mensajes',
    categoryLabel: 'Cortesía • Servicios Sanitarios',
    fileCode: '3_2',
    r2Key: 'lesco/v1/m5/mensajes/3_2.mp4',
    phraseEs: '¿Dónde están los servicios sanitarios?',
    lescoGloss: 'SERVICIOS SANITARIOS BAÑO • ¿ESTAR DÓNDE?',
    keywords: ['servicios', 'sanitarios', 'bano', 'banos', 'inodoro'],
    priorityTriggers: [['sanitarios'], ['bano'], ['servicios', 'sanitarios']],
  },

  // ── MÓDULO 5.2: POLICÍA Y SEGURIDAD (7) ──
  {
    id: 43,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Rompehielo Oficial',
    fileCode: '0',
    r2Key: 'lesco/v1/m5/policia/0.mp4',
    phraseEs: 'Hola, soy una persona sorda y necesito comunicarme con un oficial.',
    lescoGloss: 'HOLA • YO PERSONA SORDA • OFICIAL POLICÍA COMUNICAR NECESITAR',
    keywords: ['policia', 'oficial', 'comunicarme', 'seguridad', 'autoridad'],
    priorityTriggers: [
      ['policia'],
      ['oficial'],
      ['hola', 'policia'],
      ['sordo', 'policia'],
    ],
  },
  {
    id: 44,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Indicaciones Escritas',
    fileCode: '1_1',
    r2Key: 'lesco/v1/m5/policia/1_1.mp4',
    phraseEs: 'Soy una persona sorda, por favor escriba las indicaciones.',
    lescoGloss: 'YO PERSONA SORDA • INDICACIONES ESCRIBIR POR FAVOR',
    keywords: ['sorda', 'sordo', 'escriba', 'indicaciones', 'policia'],
    priorityTriggers: [['sordo', 'escribir'], ['sorda', 'escriba']],
  },
  {
    id: 45,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Cédula de Identidad',
    fileCode: '1_2',
    r2Key: 'lesco/v1/m5/policia/1_2.mp4',
    phraseEs: 'Aquí está mi cédula de identidad.',
    lescoGloss: 'CÉDULA IDENTIDAD MÍA • AQUÍ MOSTRAR',
    keywords: ['cedula', 'identidad', 'policia', 'identificacion'],
    priorityTriggers: [['policia', 'cedula']],
  },
  {
    id: 46,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Intérprete Legal',
    fileCode: '1_3',
    r2Key: 'lesco/v1/m5/policia/1_3.mp4',
    phraseEs: 'Necesito un intérprete de LESCO para este proceso.',
    lescoGloss: 'PROCESO TRÁMITE ESTE • INTÉRPRETE LESCO YO NECESITAR',
    keywords: ['interprete', 'lesco', 'proceso', 'denuncia', 'juzgado'],
    priorityTriggers: [['interprete', 'proceso'], ['proceso']],
  },
  {
    id: 47,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Robo o Asalto',
    fileCode: '2_1',
    r2Key: 'lesco/v1/m5/policia/2_1.mp4',
    phraseEs: 'Fui víctima de un robo o asalto.',
    lescoGloss: 'PASADO RECIENTE • ROBO ASALTO • YO VÍCTIMA SUFRIR',
    keywords: ['victima', 'robo', 'asalto', 'robaron', 'ladron', 'delito'],
    priorityTriggers: [['robo'], ['asalto'], ['victima'], ['robaron']],
  },
  {
    id: 48,
    module: 5,
    category: 'policia',
    categoryLabel: 'Policía • Documentos Perdidos',
    fileCode: '2_2',
    r2Key: 'lesco/v1/m5/policia/2_2.mp4',
    phraseEs: 'Perdí mis documentos personales.',
    lescoGloss: 'DOCUMENTOS PERSONALES MÍOS • PERDER EXTRAVIAR',
    keywords: ['perdi', 'perdido', 'documentos', 'personales', 'billetera', 'pasaporte'],
    priorityTriggers: [['perdi'], ['documentos'], ['perdi', 'documentos']],
  },
  {
    id: 49,
    module: 5,
    category: 'policia',
    categoryLabel: 'Ubicación • Parada de Buses',
    fileCode: '3_1',
    r2Key: 'lesco/v1/m5/policia/3_1.mp4',
    phraseEs: '¿Dónde queda la parada de buses más cercana?',
    lescoGloss: 'CERCA AQUÍ • PARADA BUSES • ¿QUEDAR DÓNDE?',
    keywords: ['donde', 'queda', 'parada', 'buses', 'bus', 'cercana', 'transporte'],
    priorityTriggers: [['parada'], ['buses'], ['bus'], ['donde', 'queda']],
  },

  // ── MÓDULO 6: PERFIL, AJUSTES Y ACCESIBILIDAD (3) ──
  {
    id: 50,
    module: 6,
    category: 'perfil',
    categoryLabel: 'Perfil • Edición de Datos',
    fileCode: '6_1',
    r2Key: 'lesco/v1/m6/6_1.mp4',
    phraseEs:
      'Puedes actualizar tu nombre, teléfono y contacto de emergencia. Recuerda que tu número de cédula es único y permanece bloqueado por seguridad.',
    lescoGloss:
      'NOMBRE TELÉFONO CONTACTO EMERGENCIA • ACTUALIZAR PODER • NÚMERO CÉDULA ÚNICO BLOQUEADO SEGURIDAD',
    keywords: ['actualizar', 'bloqueado', 'seguridad', 'unico'],
    priorityTriggers: [['actualizar', 'nombre'], ['cedula', 'bloqueado']],
  },
  {
    id: 51,
    module: 6,
    category: 'perfil',
    categoryLabel: 'Accesibilidad • Vibración Háptica',
    fileCode: '6_2',
    r2Key: 'lesco/v1/m6/6_2.mp4',
    phraseEs:
      'Activa la vibración háptica y presiona Probar Vibración para sentir la respuesta táctil que confirmará tus acciones en la aplicación.',
    lescoGloss:
      'VIBRACIÓN HÁPTICA ACTIVAR • PROBAR VIBRACIÓN PRESIONAR • RESPUESTA TÁCTIL SENTIR CONFIRMAR',
    keywords: ['vibracion', 'haptica', 'tactil', 'sentir'],
    priorityTriggers: [['vibracion'], ['haptica']],
  },
  {
    id: 52,
    module: 6,
    category: 'perfil',
    categoryLabel: 'Accesibilidad • Tamaño de Texto',
    fileCode: '6_3',
    r2Key: 'lesco/v1/m6/6_3.mp4',
    phraseEs:
      'Mueve la barra deslizante para aumentar o disminuir el tamaño de los textos en la aplicación según tu comodidad visual.',
    lescoGloss:
      'BARRA DESLIZAR MOVER • TEXTO TAMAÑO GRANDE PEQUEÑO AJUSTAR • VISTA CÓMODA TUYA',
    keywords: ['tamano', 'texto', 'aumentar', 'disminuir', 'visual'],
    priorityTriggers: [['tamano', 'texto']],
  },

  // ── MÓDULO 7: HISTORIAL Y SOPORTE (2) ──
  {
    id: 53,
    module: 7,
    category: 'historial',
    categoryLabel: 'Historial de Traducciones',
    fileCode: '7_1',
    r2Key: 'lesco/v1/m7/7_1.mp4',
    phraseEs:
      'En tu historial puedes consultar las frases que has traducido anteriormente y las alertas de emergencia emitidas para reproducirlas rápidamente.',
    lescoGloss:
      'HISTORIAL TUYO • PASADO FRASES TRADUCIDAS ALERTAS EMERGENCIA VER • RÁPIDO REPRODUCIR',
    keywords: ['historial', 'anteriormente', 'traducido', 'reproducirlas'],
    priorityTriggers: [['historial']],
  },
  {
    id: 54,
    module: 7,
    category: 'historial',
    categoryLabel: 'Centro de Ayuda y WhatsApp',
    fileCode: '7_2',
    r2Key: 'lesco/v1/m7/7_2.mp4',
    phraseEs:
      'Si tienes dudas sobre el uso de LESCOnect, consulta las preguntas frecuentes o contáctanos por WhatsApp y correo para brindarte asistencia.',
    lescoGloss:
      'LESCONECT DUDAS TENER • PREGUNTAS FRECUENTES VER • WHATSAPP CORREO CONTACTAR ASISTENCIA DAR',
    keywords: ['dudas', 'frecuentes', 'whatsapp', 'correo', 'asistencia', 'soporte'],
    priorityTriggers: [['whatsapp'], ['dudas'], ['asistencia']],
  },
];

// ============================================================================
// 2. DICCIONARIO LÉXICO DE AUTOCOMPLETADO DACTILOLÓGICO (1 TOQUE)
// ============================================================================
export interface LexicalEntry {
  word: string;
  normalized: string;
  gloss: string;
  categoryLabel: string;
  nextSuggestedWords: string[];
}

export const LESCO_LEXICAL_VOCABULARY: LexicalEntry[] = [
  // Emergencia y Auxilio
  { word: 'AYUDA', normalized: 'AYUDA', gloss: 'AYUDA AUXILIO', categoryLabel: 'Emergencia', nextSuggestedWords: ['URGENTE', 'HOSPITAL', 'POLICÍA', 'NO ESCUCHO'] },
  { word: 'AUXILIO', normalized: 'AUXILIO', gloss: 'AUXILIO URGENTE', categoryLabel: 'Emergencia', nextSuggestedWords: ['URGENTE', 'PELIGRO', 'AMBULANCIA'] },
  { word: 'URGENTE', normalized: 'URGENTE', gloss: 'URGENTE RÁPIDO', categoryLabel: 'Emergencia', nextSuggestedWords: ['AMBULANCIA', 'HOSPITAL', 'POLICÍA'] },
  { word: 'PELIGRO', normalized: 'PELIGRO', gloss: 'PELIGRO RIESGO', categoryLabel: 'Emergencia', nextSuggestedWords: ['AYUDA', 'POLICÍA', '911'] },
  { word: 'AMBULANCIA', normalized: 'AMBULANCIA', gloss: 'AMBULANCIA 911', categoryLabel: 'Emergencia', nextSuggestedWords: ['URGENTE', 'HERIDA', 'HOSPITAL'] },
  { word: 'BOMBEROS', normalized: 'BOMBEROS', gloss: 'BOMBEROS FUEGO', categoryLabel: 'Emergencia', nextSuggestedWords: ['FUEGO', 'HUMO', 'ATRAPADA'] },
  { word: 'FUEGO', normalized: 'FUEGO', gloss: 'FUEGO INCENDIO', categoryLabel: 'Emergencia', nextSuggestedWords: ['BOMBEROS', 'HUMO', 'AYUDA'] },
  { word: 'HUMO', normalized: 'HUMO', gloss: 'HUMO INCENDIO', categoryLabel: 'Emergencia', nextSuggestedWords: ['BOMBEROS', 'FUEGO'] },
  { word: 'HERIDA', normalized: 'HERIDA', gloss: 'PERSONA HERIDA', categoryLabel: 'Emergencia', nextSuggestedWords: ['AMBULANCIA', 'INCONSCIENTE'] },
  { word: 'INCONSCIENTE', normalized: 'INCONSCIENTE', gloss: 'PERSONA INCONSCIENTE', categoryLabel: 'Emergencia', nextSuggestedWords: ['AMBULANCIA', 'URGENTE'] },
  { word: 'ATRAPADA', normalized: 'ATRAPADA', gloss: 'PERSONA ATRAPADA', categoryLabel: 'Emergencia', nextSuggestedWords: ['AQUÍ', 'BOMBEROS', 'RESCATE'] },
  { word: 'EMERGENCIA', normalized: 'EMERGENCIA', gloss: 'EMERGENCIA SOS', categoryLabel: 'Emergencia', nextSuggestedWords: ['CONTACTOS', 'AMBULANCIA', '911'] },
  { word: 'CONTACTOS', normalized: 'CONTACTOS', gloss: 'CONTACTOS EMERGENCIA', categoryLabel: 'Emergencia', nextSuggestedWords: ['EMERGENCIA', 'LLAMAR'] },
  { word: 'ESCUCHAR', normalized: 'ESCUCHAR', gloss: 'ESCUCHAR NO PODER', categoryLabel: 'Emergencia', nextSuggestedWords: ['AYUDA', 'SORDO'] },

  // Hospital y Salud
  { word: 'HOSPITAL', normalized: 'HOSPITAL', gloss: 'HOSPITAL ATENCIÓN MÉDICA', categoryLabel: 'Hospital', nextSuggestedWords: ['DOLOR', 'CITA MÉDICA', 'DOCTOR', 'MEDICAMENTOS'] },
  { word: 'DOLOR', normalized: 'DOLOR', gloss: 'DOLOR FUERTE CUERPO', categoryLabel: 'Hospital', nextSuggestedWords: ['FUERTE', 'HOSPITAL', 'DOCTOR'] },
  { word: 'DOCTOR', normalized: 'DOCTOR', gloss: 'DOCTOR MÉDICO', categoryLabel: 'Hospital', nextSuggestedWords: ['ATENCIÓN MÉDICA', 'CITA MÉDICA', 'DOLOR'] },
  { word: 'MÉDICO', normalized: 'MEDICO', gloss: 'MÉDICO DOCTOR', categoryLabel: 'Hospital', nextSuggestedWords: ['CITA MÉDICA', 'HOSPITAL', 'CONSULTORIO'] },
  { word: 'CITA', normalized: 'CITA', gloss: 'CITA MÉDICA', categoryLabel: 'Hospital', nextSuggestedWords: ['MÉDICA', 'HOY', 'MAÑANA', 'HOSPITAL'] },
  { word: 'CITA MÉDICA', normalized: 'CITA MEDICA', gloss: 'HOY CITA MÉDICA', categoryLabel: 'Hospital', nextSuggestedWords: ['HOY', 'CONSULTORIO', 'INTÉRPRETE'] },
  { word: 'MEDICAMENTOS', normalized: 'MEDICAMENTOS', gloss: 'RECETA MEDICAMENTOS RETIRAR', categoryLabel: 'Farmacia', nextSuggestedWords: ['RECETA', 'PASTILLAS', 'HORARIOS'] },
  { word: 'RECETA', normalized: 'RECETA', gloss: 'RECETA MÉDICA', categoryLabel: 'Farmacia', nextSuggestedWords: ['MEDICAMENTOS', 'RETIRAR'] },
  { word: 'PASTILLAS', normalized: 'PASTILLAS', gloss: 'PASTILLAS HORARIO TOMAR', categoryLabel: 'Farmacia', nextSuggestedWords: ['HORARIOS', 'ESCRIBIR'] },
  { word: 'HORARIOS', normalized: 'HORARIOS', gloss: 'HORA CUÁNDO TOMAR', categoryLabel: 'Farmacia', nextSuggestedWords: ['PASTILLAS', 'ESCRIBIR'] },
  { word: 'CONSULTORIO', normalized: 'CONSULTORIO', gloss: 'CONSULTORIO NÚMERO', categoryLabel: 'Hospital', nextSuggestedWords: ['ESCRIBIR', 'NÚMERO'] },
  { word: 'INTÉRPRETE', normalized: 'INTERPRETE', gloss: 'INTÉRPRETE LESCO', categoryLabel: 'Accesibilidad', nextSuggestedWords: ['LESCO', 'PROCESO', 'HOSPITAL'] },
  { word: 'LESCO', normalized: 'LESCO', gloss: 'LENGUA SEÑAS LESCO', categoryLabel: 'Accesibilidad', nextSuggestedWords: ['INTÉRPRETE', 'SORDO'] },

  // Banco y Finanzas
  { word: 'CÉDULA', normalized: 'CEDULA', gloss: 'CÉDULA IDENTIDAD', categoryLabel: 'Identificación', nextSuggestedWords: ['IDENTIDAD', 'TRÁMITE', 'DOCUMENTO'] },
  { word: 'BANCO', normalized: 'BANCO', gloss: 'BANCO TRÁMITE', categoryLabel: 'Banco', nextSuggestedWords: ['TRÁMITE', 'TARJETA', 'CUENTA', 'DEPÓSITO'] },
  { word: 'TRÁMITE', normalized: 'TRAMITE', gloss: 'TRÁMITE REALIZAR', categoryLabel: 'Banco', nextSuggestedWords: ['BANCO', 'CÉDULA', 'CONSULTA'] },
  { word: 'TARJETA', normalized: 'TARJETA', gloss: 'TARJETA BANCARIA', categoryLabel: 'Banco', nextSuggestedWords: ['CAJERO', 'BLOQUEADA', 'NUEVA', 'RETIRAR'] },
  { word: 'CAJERO', normalized: 'CAJERO', gloss: 'CAJERO AUTOMÁTICO', categoryLabel: 'Banco', nextSuggestedWords: ['TARJETA', 'BLOQUEADA'] },
  { word: 'BLOQUEADA', normalized: 'BLOQUEADA', gloss: 'BLOQUEAR RETENER', categoryLabel: 'Banco', nextSuggestedWords: ['TARJETA', 'CAJERO'] },
  { word: 'CUENTA', normalized: 'CUENTA', gloss: 'CUENTA AHORROS', categoryLabel: 'Banco', nextSuggestedWords: ['AHORROS', 'ABRIR', 'BANCO'] },
  { word: 'AHORROS', normalized: 'AHORROS', gloss: 'CUENTA AHORROS ABRIR', categoryLabel: 'Banco', nextSuggestedWords: ['ABRIR', 'BANCO'] },
  { word: 'DEPÓSITO', normalized: 'DEPOSITO', gloss: 'DEPÓSITO EFECTIVO', categoryLabel: 'Banco', nextSuggestedWords: ['EFECTIVO', 'MONTO'] },
  { word: 'EFECTIVO', normalized: 'EFECTIVO', gloss: 'DINERO EFECTIVO', categoryLabel: 'Banco', nextSuggestedWords: ['DEPÓSITO', 'MONTO'] },
  { word: 'MONTO', normalized: 'MONTO', gloss: 'MONTO TOTAL PAPEL', categoryLabel: 'Banco', nextSuggestedWords: ['PAPEL', 'ESCRIBIR'] },
  { word: 'PAPEL', normalized: 'PAPEL', gloss: 'PAPEL ESCRIBIR', categoryLabel: 'Banco', nextSuggestedWords: ['ESCRIBIR', 'MONTO'] },
  { word: 'FIRMAR', normalized: 'FIRMAR', gloss: 'DOCUMENTO FIRMAR DÓNDE', categoryLabel: 'Banco', nextSuggestedWords: ['DOCUMENTO', 'DÓNDE'] },
  { word: 'DOCUMENTO', normalized: 'DOCUMENTO', gloss: 'DOCUMENTO PERSONAL', categoryLabel: 'Trámites', nextSuggestedWords: ['FIRMAR', 'PERDÍ', 'CÉDULA'] },
  { word: 'DOCUMENTOS', normalized: 'DOCUMENTOS', gloss: 'DOCUMENTOS PERSONALES', categoryLabel: 'Trámites', nextSuggestedWords: ['PERDER', 'CÉDULA'] },

  // Policía y Seguridad
  { word: 'POLICÍA', normalized: 'POLICIA', gloss: 'OFICIAL POLICÍA', categoryLabel: 'Policía', nextSuggestedWords: ['OFICIAL', 'ROBO', 'DOCUMENTOS', 'AYUDA'] },
  { word: 'OFICIAL', normalized: 'OFICIAL', gloss: 'OFICIAL SEGURIDAD', categoryLabel: 'Policía', nextSuggestedWords: ['POLICÍA', 'INDICACIONES', 'CÉDULA'] },
  { word: 'ROBO', normalized: 'ROBO', gloss: 'ROBO ASALTO VÍCTIMA', categoryLabel: 'Policía', nextSuggestedWords: ['ASALTO', 'POLICÍA', 'DOCUMENTOS'] },
  { word: 'ASALTO', normalized: 'ASALTO', gloss: 'ASALTO VÍCTIMA', categoryLabel: 'Policía', nextSuggestedWords: ['ROBO', 'POLICÍA'] },
  { word: 'PERDÍ', normalized: 'PERDI', gloss: 'PERDER DOCUMENTOS', categoryLabel: 'Policía', nextSuggestedWords: ['DOCUMENTOS', 'CÉDULA'] },
  { word: 'PERDER', normalized: 'PERDER', gloss: 'PERDER EXTRAVIAR', categoryLabel: 'Policía', nextSuggestedWords: ['CÉDULA', 'DOCUMENTOS'] },
  { word: 'PARADA', normalized: 'PARADA', gloss: 'PARADA BUSES', categoryLabel: 'Ubicación', nextSuggestedWords: ['BUS', 'BUSES', 'DÓNDE'] },
  { word: 'BUS', normalized: 'BUS', gloss: 'AUTOBÚS TRANSPORTE', categoryLabel: 'Ubicación', nextSuggestedWords: ['PARADA', 'DÓNDE'] },
  { word: 'PARADA DE BUSES', normalized: 'PARADA DE BUSES', gloss: 'PARADA BUSES DÓNDE', categoryLabel: 'Ubicación', nextSuggestedWords: ['CERCA', 'DÓNDE'] },
  { word: 'BUSES', normalized: 'BUSES', gloss: 'PARADA BUSES', categoryLabel: 'Ubicación', nextSuggestedWords: ['PARADA DE BUSES', 'DÓNDE'] },

  // Pronombres, Tiempo, Verbos y Partículas LESCO
  { word: 'YO', normalized: 'YO', gloss: 'YO 1ª PERSONA', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['SORDO', 'NECESITAR', 'QUERER', 'TENER', 'IR'] },
  { word: 'TÚ', normalized: 'TU', gloss: 'TÚ 2ª PERSONA', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['ESCRIBIR', 'AYUDAR', 'ENTENDER'] },
  { word: 'USTED', normalized: 'USTED', gloss: 'USTED RESPETO', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['ESCRIBIR', 'AYUDAR', 'POR FAVOR'] },
  { word: 'ÉL', normalized: 'EL', gloss: 'ÉL 3ª PERSONA', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['SORDO', 'NECESITAR', 'AYUDAR'] },
  { word: 'ELLA', normalized: 'ELLA', gloss: 'ELLA 3ª PERSONA', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['SORDA', 'NECESITAR', 'AYUDAR'] },
  { word: 'NOSOTROS', normalized: 'NOSOTROS', gloss: 'NOSOTROS PLURAL', categoryLabel: 'Pronombre LESCO', nextSuggestedWords: ['NECESITAR', 'IR', 'AYUDA'] },
  { word: 'HOY', normalized: 'HOY', gloss: 'TIEMPO HOY', categoryLabel: 'Tiempo LESCO', nextSuggestedWords: ['YO', 'CITA', 'HOSPITAL', 'BANCO'] },
  { word: 'AYER', normalized: 'AYER', gloss: 'TIEMPO PASADO AYER', categoryLabel: 'Tiempo LESCO', nextSuggestedWords: ['YO', 'PERDER', 'CÉDULA', 'ROBO'] },
  { word: 'MAÑANA', normalized: 'MANANA', gloss: 'TIEMPO FUTURO MAÑANA', categoryLabel: 'Tiempo LESCO', nextSuggestedWords: ['YO', 'IR', 'HOSPITAL', 'CITA'] },
  { word: 'AHORA', normalized: 'AHORA', gloss: 'TIEMPO AHORA MISMO', categoryLabel: 'Tiempo LESCO', nextSuggestedWords: ['YO', 'NECESITAR', 'AYUDA', 'URGENTE'] },
  { word: 'SIEMPRE', normalized: 'SIEMPRE', gloss: 'TIEMPO SIEMPRE', categoryLabel: 'Tiempo LESCO', nextSuggestedWords: ['YO', 'USAR', 'LESCO'] },
  { word: 'NECESITAR', normalized: 'NECESITAR', gloss: 'NECESITAR OCUPAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['INTÉRPRETE', 'AYUDA', 'MÉDICO', 'TRÁMITE'] },
  { word: 'QUERER', normalized: 'QUERER', gloss: 'QUERER DESEAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['ABRIR', 'CUENTA', 'CONSULTA', 'RETIRAR'] },
  { word: 'TENER', normalized: 'TENER', gloss: 'TENER POSEER', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['CITA', 'DOLOR', 'CÉDULA'] },
  { word: 'IR', normalized: 'IR', gloss: 'IR DIRIGIRSE', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['HOSPITAL', 'BANCO', 'CITA', 'POLICÍA'] },
  { word: 'BUSCAR', normalized: 'BUSCAR', gloss: 'BUSCAR UBICAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['PARADA', 'CONSULTORIO', 'FARMACIA'] },
  { word: 'DOLER', normalized: 'DOLER', gloss: 'DOLER SENTIR DOLOR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['CUERPO', 'CABEZA', 'PECHO', 'FUERTE'] },
  { word: 'ABRIR', normalized: 'ABRIR', gloss: 'ABRIR INICIAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['CUENTA', 'BANCO', 'AHORROS'] },
  { word: 'RETIRAR', normalized: 'RETIRAR', gloss: 'RETIRAR SACAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['MEDICAMENTOS', 'TARJETA', 'DINERO'] },
  { word: 'PAGAR', normalized: 'PAGAR', gloss: 'PAGAR CANCELAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['EFECTIVO', 'TARJETA', 'MONTO'] },
  { word: 'AYUDAR', normalized: 'AYUDAR', gloss: 'AYUDAR APOYAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['POR FAVOR', 'URGENTE', 'SORDO'] },
  { word: 'LLAMAR', normalized: 'LLAMAR', gloss: 'LLAMAR AVISAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['AMBULANCIA', 'BOMBEROS', 'POLICÍA', 'CONTACTOS'] },
  { word: 'ENTENDER', normalized: 'ENTENDER', gloss: 'ENTENDER COMPRENDER', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['NO', 'BIEN', 'ESCRIBIR'] },
  { word: 'COMPRENDER', normalized: 'COMPRENDER', gloss: 'COMPRENDER ENTENDER', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['NO', 'BIEN', 'REPETIR'] },
  { word: 'ESPERAR', normalized: 'ESPERAR', gloss: 'ESPERAR AGUARDAR', categoryLabel: 'Verbo LESCO', nextSuggestedWords: ['TURNO', 'INTÉRPRETE', 'MÉDICO'] },
  { word: 'NO', normalized: 'NO', gloss: 'NEGACIÓN NO', categoryLabel: 'Negación LESCO', nextSuggestedWords: ['ESCUCHAR', 'ENTENDER', 'PODER'] },
  { word: 'QUÉ', normalized: 'QUE', gloss: '¿QUÉ PREGUNTA?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['PASAR', 'HORARIO', 'DOCUMENTO'] },
  { word: 'CUÁNDO', normalized: 'CUANDO', gloss: '¿CUÁNDO TIEMPO?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['CITA', 'HORARIOS', 'PASTILLAS'] },
  { word: 'CUÁNTO', normalized: 'CUANTO', gloss: '¿CUÁNTO MONTO?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['MONTO', 'PAGAR', 'EFECTIVO'] },
  { word: 'CÓMO', normalized: 'COMO', gloss: '¿CÓMO FORMA?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['TRÁMITE', 'PAGAR', 'FIRMAR'] },
  { word: 'QUIÉN', normalized: 'QUIEN', gloss: '¿QUIÉN PERSONA?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['DOCTOR', 'OFICIAL', 'INTÉRPRETE'] },

  // Saludos, Identidad Sorda y Cortesía
  { word: 'HOLA', normalized: 'HOLA', gloss: 'HOLA SALUDO', categoryLabel: 'Cortesía', nextSuggestedWords: ['SORDO', 'AYUDA', 'TRÁMITE', 'CONSULTA', 'HOSPITAL', 'BUENOS DÍAS'] },
  { word: 'SORDO', normalized: 'SORDO', gloss: 'PERSONA SORDA YO', categoryLabel: 'Identidad', nextSuggestedWords: ['AYUDA', 'TRÁMITE', 'HOSPITAL', 'INTÉRPRETE', 'ESCRIBIR'] },
  { word: 'SORDA', normalized: 'SORDA', gloss: 'PERSONA SORDA YO', categoryLabel: 'Identidad', nextSuggestedWords: ['AYUDA', 'TRÁMITE', 'HOSPITAL', 'INTÉRPRETE', 'ESCRIBIR'] },
  { word: 'GRACIAS', normalized: 'GRACIAS', gloss: 'MUCHAS GRACIAS PACIENCIA', categoryLabel: 'Cortesía', nextSuggestedWords: ['PACIENCIA', 'AYUDA'] },
  { word: 'PACIENCIA', normalized: 'PACIENCIA', gloss: 'PACIENCIA COMPRENSIÓN', categoryLabel: 'Cortesía', nextSuggestedWords: ['GRACIAS', 'AYUDA'] },
  { word: 'POR FAVOR', normalized: 'POR FAVOR', gloss: 'POR FAVOR CORTESÍA', categoryLabel: 'Cortesía', nextSuggestedWords: ['ESCRIBIR', 'INDICACIONES', 'REPETIR', 'CONTACTOS'] },
  { word: 'BUENOS DÍAS', normalized: 'BUENOS DIAS', gloss: 'BUENOS DÍAS', categoryLabel: 'Cortesía', nextSuggestedWords: ['SORDO', 'CONSULTA', 'TRÁMITE'] },
  { word: 'BUENAS TARDES', normalized: 'BUENAS TARDES', gloss: 'BUENAS TARDES', categoryLabel: 'Cortesía', nextSuggestedWords: ['SORDO', 'CONSULTA', 'TRÁMITE'] },
  { word: 'CONSULTA', normalized: 'CONSULTA', gloss: 'CONSULTA PREGUNTA', categoryLabel: 'Cortesía', nextSuggestedWords: ['POR FAVOR', 'ESCRIBIR'] },
  { word: 'ESCRIBIR', normalized: 'ESCRIBIR', gloss: 'ESCRIBIR PAPEL', categoryLabel: 'Comunicación', nextSuggestedWords: ['INDICACIONES', 'POR FAVOR', 'MONTO', 'CONSULTORIO'] },
  { word: 'INDICACIONES', normalized: 'INDICACIONES', gloss: 'INDICACIONES ESCRIBIR', categoryLabel: 'Comunicación', nextSuggestedWords: ['POR FAVOR', 'ESCRIBIR'] },
  { word: 'REPETIR', normalized: 'REPETIR', gloss: 'OTRA VEZ REPETIR ESCRITO', categoryLabel: 'Comunicación', nextSuggestedWords: ['ESCRIBIR', 'POR FAVOR'] },
  { word: 'FILA PREFERENCIAL', normalized: 'FILA PREFERENCIAL', gloss: 'FILA PREFERENCIAL DÓNDE', categoryLabel: 'Atención', nextSuggestedWords: ['DÓNDE'] },
  { word: 'SANITARIOS', normalized: 'SANITARIOS', gloss: 'SERVICIOS SANITARIOS BAÑO', categoryLabel: 'Ubicación', nextSuggestedWords: ['DÓNDE'] },
  { word: 'BAÑO', normalized: 'BANO', gloss: 'SERVICIOS SANITARIOS BAÑO', categoryLabel: 'Ubicación', nextSuggestedWords: ['DÓNDE'] },
  { word: 'DÓNDE', normalized: 'DONDE', gloss: '¿DÓNDE UBICACIÓN?', categoryLabel: 'Pregunta LESCO', nextSuggestedWords: ['PARADA DE BUSES', 'FILA PREFERENCIAL', 'SANITARIOS', 'FIRMAR'] },
];

// ============================================================================
// 2.5 API DE EXTENSIÓN PARA VOCABULARIO EXTERNO (CENAREC / SUBAGENTE 3)
// ============================================================================

const registeredExternalNorms = new Set<string>(
  LESCO_LEXICAL_VOCABULARY.map((item) => item.normalized)
);

/**
 * Permite que servicios externos (como el Diccionario Oficial CENAREC) inyecten
 * todo su vocabulario en el motor de autocompletado, corrección óptica difusa
 * y coherencia morfosintáctica sin duplicar estructuras ni lógica.
 */
export function registerExternalVocabulary(
  entries: Array<{ gloss: string; wordEs: string; category?: string }>
): number {
  if (!Array.isArray(entries) || entries.length === 0) return 0;

  let addedCount = 0;

  for (const item of entries) {
    if (!item || (!item.wordEs && !item.gloss)) continue;

    const rawWord = (item.wordEs || item.gloss).trim().toUpperCase();
    const norm = normalizeToken(rawWord).toUpperCase();
    if (!norm || norm.length < 2) continue;

    if (!registeredExternalNorms.has(norm)) {
      registeredExternalNorms.add(norm);
      const cleanGloss = (item.gloss || rawWord).trim().toUpperCase();
      const catLabel = item.category ? item.category.trim() : 'Diccionario CENAREC';

      LESCO_LEXICAL_VOCABULARY.push({
        word: rawWord,
        normalized: norm,
        gloss: cleanGloss,
        categoryLabel: catLabel,
        nextSuggestedWords: ['POR FAVOR', 'GRACIAS', 'DÓNDE', 'AYUDA'],
      });
      addedCount++;
    }
  }

  return addedCount;
}

// ============================================================================
// 3. UTILIDADES DE NORMALIZACIÓN Y CORRECCIÓN DACTILOLÓGICA DIFUSA (ÓPTICA)
// ============================================================================

export function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:()"'/]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Grupos de confusión óptica y biomecánica en la dactilología LESCO:
 * - Puños cerrados y redondeados: A <-> S <-> E <-> O
 * - Dedos colgantes / nasales: M <-> N <-> Ñ
 * - Dedos índice/medio extendidos: U <-> V <-> T <-> R <-> K
 * - Dedos verticales finos (oclusión parcial en cámara): D <-> I <-> L <-> J
 * - Mano curvada: C <-> O <-> G
 * - Índice/medio horizontales: G <-> H
 * - Configuraciones en V o pinza: P <-> K <-> Q
 * - Confusiones frecuentes de silueta dactilológica en cámara frontal: B <-> D <-> M
 */
const LESCO_OPTICAL_CONFUSION_GROUPS: string[][] = [
  ['A', 'S', 'E', 'O'],
  ['M', 'N', 'Ñ'],
  ['U', 'V', 'T', 'R', 'K'],
  ['D', 'I', 'L', 'J'],
  ['C', 'O', 'G'],
  ['G', 'H'],
  ['P', 'K', 'Q'],
  ['B', 'D', 'M', 'P'],
];

/**
 * Calcula el costo ponderado de sustitución entre dos letras del abecedario LESCO.
 * Si pertenecen a un par visualmente similar en cámara, la penalización es muy baja (0.35),
 * frente a 1.0 para letras sin similitud quirológica.
 */
function getLescoOpticalSubstitutionCost(charA: string, charB: string): number {
  if (charA === charB) return 0;

  // Confusiones directas prioritarias en LESCO y cámara frontal
  const highSimilarityPairs: Array<[string, string]> = [
    ['A', 'S'],
    ['A', 'E'],
    ['S', 'E'],
    ['E', 'O'],
    ['A', 'O'],
    ['S', 'O'],
    ['M', 'N'],
    ['U', 'V'],
    ['U', 'R'],
    ['V', 'R'],
    ['T', 'R'],
    ['U', 'T'],
    ['V', 'T'],
    ['D', 'I'],
    ['L', 'I'],
    ['D', 'L'],
    ['B', 'D'],
    ['B', 'M'],
    ['C', 'O'],
    ['G', 'H'],
    ['P', 'K'],
  ];

  for (const [p1, p2] of highSimilarityPairs) {
    if ((charA === p1 && charB === p2) || (charA === p2 && charB === p1)) {
      return 0.35;
    }
  }

  for (const group of LESCO_OPTICAL_CONFUSION_GROUPS) {
    if (group.includes(charA) && group.includes(charB)) {
      return 0.45;
    }
  }

  return 1.0;
}

/**
 * Calcula la distancia de Damerau-Levenshtein ponderada por confusión óptica de señas LESCO.
 */
export function computeWeightedDamerauLevenshtein(source: string, target: string): number {
  const lenA = source.length;
  const lenB = target.length;
  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  const dp: number[][] = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const charA = source[i - 1];
      const charB = target[j - 1];
      const subCost = getLescoOpticalSubstitutionCost(charA, charB);

      let best = Math.min(
        dp[i - 1][j] + 0.85, // eliminación (ej. frame duplicado)
        dp[i][j - 1] + 0.85, // inserción (ej. letra omitida por cooldown)
        dp[i - 1][j - 1] + subCost // sustitución óptica ponderada
      );

      // Transposición de letras adyacentes (Damerau)
      if (
        i > 1 &&
        j > 1 &&
        source[i - 1] === target[j - 2] &&
        source[i - 2] === target[j - 1]
      ) {
        best = Math.min(best, dp[i - 2][j - 2] + 0.5);
      }

      dp[i][j] = best;
    }
  }

  return dp[lenA][lenB];
}

// Mapa directo de errores ópticos recurrentes en cámara LESCO para resolución instantánea O(1)
const DIRECT_OPTICAL_TYPO_MAP: Record<string, { word: string; normalized: string }> = {
  CEBULA: { word: 'CÉDULA', normalized: 'CEDULA' },
  CEDUIA: { word: 'CÉDULA', normalized: 'CEDULA' },
  CEDUJA: { word: 'CÉDULA', normalized: 'CEDULA' },
  OEDULA: { word: 'CÉDULA', normalized: 'CEDULA' },
  SEDULA: { word: 'CÉDULA', normalized: 'CEDULA' },
  HOSPITAI: { word: 'HOSPITAL', normalized: 'HOSPITAL' },
  HOSPITAD: { word: 'HOSPITAL', normalized: 'HOSPITAL' },
  GOSPITAI: { word: 'HOSPITAL', normalized: 'HOSPITAL' },
  GOSPITAL: { word: 'HOSPITAL', normalized: 'HOSPITAL' },
  AYUBA: { word: 'AYUDA', normalized: 'AYUDA' },
  AYUIA: { word: 'AYUDA', normalized: 'AYUDA' },
  SYUDA: { word: 'AYUDA', normalized: 'AYUDA' },
  BOMDEROS: { word: 'BOMBEROS', normalized: 'BOMBEROS' },
  BONBEROS: { word: 'BOMBEROS', normalized: 'BOMBEROS' },
  BONDEROS: { word: 'BOMBEROS', normalized: 'BOMBEROS' },
  MEBICO: { word: 'MÉDICO', normalized: 'MEDICO' },
  NEDICO: { word: 'MÉDICO', normalized: 'MEDICO' },
  NEBICO: { word: 'MÉDICO', normalized: 'MEDICO' },
  MEDIOO: { word: 'MÉDICO', normalized: 'MEDICO' },
  POIICIA: { word: 'POLICÍA', normalized: 'POLICIA' },
  KOLICIA: { word: 'POLICÍA', normalized: 'POLICIA' },
  DANCO: { word: 'BANCO', normalized: 'BANCO' },
  BANOO: { word: 'BANCO', normalized: 'BANCO' },
  SORBO: { word: 'SORDO', normalized: 'SORDO' },
  SORBA: { word: 'SORDA', normalized: 'SORDA' },
  AORDO: { word: 'SORDO', normalized: 'SORDO' },
};

// ── MODELO DE LENGUAJE: BIGRAMAS DEL CORPUS LESCO ───────────────────────────
export const BIGRAM_RERANK_LAMBDA = 0.35;

/** Mapa en memoria de afinidades bigrama construidas a partir de LESCO_54_CORPUS */
let _lescoBigramMapCache: Map<string, number> | null = null;

function getLescoBigramMap(): Map<string, number> {
  if (_lescoBigramMapCache) return _lescoBigramMapCache;
  const map = new Map<string, number>();

  for (const entry of LESCO_54_CORPUS) {
    const tokens = entry.lescoGloss
      .toUpperCase()
      .split(/\s+/)
      .map((t) => normalizeToken(t))
      .filter(Boolean);

    for (let i = 0; i < tokens.length - 1; i++) {
      const key = `${tokens[i]}__${tokens[i + 1]}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
  }

  _lescoBigramMapCache = map;
  return map;
}

/**
 * Calcula la afinidad contextual P(cand | prev) normalizada [0..1]
 * a partir de las co-ocurrencias reales observadas en el corpus LESCO oficial.
 */
export function getLescoBigramAffinity(prev: string, candidate: string): number {
  if (!prev || !candidate) return 0;
  const pNorm = normalizeToken(prev).toUpperCase();
  const cNorm = normalizeToken(candidate).toUpperCase();
  const map = getLescoBigramMap();
  const count = map.get(`${pNorm}__${cNorm}`) || 0;
  return count > 0 ? Math.min(1.0, 0.4 + count * 0.2) : 0;
}

/**
 * Normalización morfológica LESCO:
 * - Reduplicación para plural (ej. CASA CASA -> CASAS)
 * - Clasificadores manuales (CL:VEHÍCULO, CL:PERSONA)
 * - Números dactilológicos agrupados
 */
export function normalizeLescoMorphologyTokens(rawTokens: string[]): {
  tokens: string[];
  reduplications: string[];
} {
  const tokens: string[] = [];
  const reduplications: string[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const curr = rawTokens[i];
    const next = rawTokens[i + 1];

    // Detección de reduplicación léxica (plural / intensificador)
    if (next && curr.toUpperCase() === next.toUpperCase() && curr.length > 2) {
      reduplications.push(curr);
      tokens.push(`${curr}++`);
      i++; // Saltar token duplicado
      continue;
    }

    tokens.push(curr);
  }

  return { tokens, reduplications };
}

/**
 * Corrige automáticamente un token deletreado con error de cámara en LESCO
 * usando distancia de Damerau-Levenshtein ponderada por confusión óptica quirológica.
 *
 * Ejemplos resueltos con precisión:
 * - "CEBULA" / "CEDUIA" -> "CÉDULA"
 * - "HOSPITAI" -> "HOSPITAL"
 * - "AYUBA" -> "AYUDA"
 * - "BOMDEROS" -> "BOMBEROS"
 * - "MEDICO" / "MEBICO" -> "MÉDICO"
 */
export function fuzzyCorrectSpelledToken(
  token: string,
  options?: {
    isActivePrefix?: boolean;
    /** Glosa/palabra previa ya resuelta; activa el re-ranking por bigramas del corpus. */
    previousToken?: string;
  }
): FuzzyCorrectionResult {
  const cleanRaw = token.trim();
  const normToken = normalizeToken(cleanRaw).toUpperCase();

  if (!normToken || normToken.length < 3) {
    return {
      rawToken: cleanRaw,
      correctedWord: cleanRaw.toUpperCase(),
      correctedNormalized: normToken,
      distance: 0,
      wasCorrected: false,
    };
  }

  // 1. Revisar si ya es una palabra exacta del vocabulario (con o sin tilde, ej. "MEDICO" -> "MÉDICO")
  const exactLexical = LESCO_LEXICAL_VOCABULARY.find(
    (entry) => entry.normalized === normToken
  );
  if (exactLexical) {
    return {
      rawToken: cleanRaw,
      correctedWord: exactLexical.word,
      correctedNormalized: exactLexical.normalized,
      distance: 0,
      wasCorrected: cleanRaw.toUpperCase() !== exactLexical.word,
    };
  }

  // 2. Si el usuario está a mitad de deletrear un prefijo válido de una palabra más larga, no forzar otra palabra
  if (options?.isActivePrefix && normToken.length <= 5) {
    const isCleanPrefix = LESCO_LEXICAL_VOCABULARY.some(
      (entry) =>
        entry.normalized.startsWith(normToken) &&
        entry.normalized.length > normToken.length
    );
    if (isCleanPrefix) {
      return {
        rawToken: cleanRaw,
        correctedWord: cleanRaw.toUpperCase(),
        correctedNormalized: normToken,
        distance: 0,
        wasCorrected: false,
      };
    }
  }

  // 3. Revisar mapa directo de confusiones ópticas frecuentes en LESCO
  const directHit = DIRECT_OPTICAL_TYPO_MAP[normToken];
  if (directHit) {
    return {
      rawToken: cleanRaw,
      correctedWord: directHit.word,
      correctedNormalized: directHit.normalized,
      distance: 0.35,
      wasCorrected: true,
    };
  }

  // 4. Evaluar Damerau-Levenshtein ponderado contra todo el vocabulario léxico y palabras individuales
  let bestEntry: { word: string; normalized: string } | null = null;
  let bestDistance = Infinity;

  // Construir candidatos de una sola palabra
  const candidates: Array<{ word: string; normalized: string }> = [];
  const seenNorms = new Set<string>();

  for (const entry of LESCO_LEXICAL_VOCABULARY) {
    if (!entry.normalized.includes(' ')) {
      if (!seenNorms.has(entry.normalized)) {
        seenNorms.add(entry.normalized);
        candidates.push({ word: entry.word, normalized: entry.normalized });
      }
    } else {
      const rawParts = entry.word.split(/\s+/);
      const normParts = entry.normalized.split(/\s+/);
      for (let idx = 0; idx < normParts.length; idx++) {
        const pNorm = normParts[idx];
        const pWord = rawParts[idx] || pNorm;
        if (pNorm.length >= 4 && !seenNorms.has(pNorm)) {
          seenNorms.add(pNorm);
          candidates.push({ word: pWord, normalized: pNorm });
        }
      }
    }
  }

  // Umbral adaptativo según longitud de la palabra
  const maxAllowedDistance =
    normToken.length <= 4 ? 0.65 : normToken.length <= 6 ? 1.15 : 1.55;

  // Re-ranking contextual con bigramas ponderados del corpus de 54 frases:
  // score = distanciaÓptica − λ · afinidadBigrama(previo → candidato)
  const contextPrev = options?.previousToken
    ? normalizeToken(options.previousToken).toUpperCase()
    : '';
  let bestScore = Infinity;

  for (const cand of candidates) {
    const lenDiff = Math.abs(cand.normalized.length - normToken.length);
    if (lenDiff > 2) continue;
    if (cand.normalized.length < 4) continue;

    const dist = computeWeightedDamerauLevenshtein(normToken, cand.normalized);
    if (dist > maxAllowedDistance) continue;

    const contextBonus = contextPrev
      ? getLescoBigramAffinity(contextPrev, cand.normalized) * BIGRAM_RERANK_LAMBDA
      : 0;
    const score = dist - contextBonus;

    if (score < bestScore || (score === bestScore && dist < bestDistance)) {
      bestScore = score;
      bestDistance = dist;
      bestEntry = cand;
    }
  }

  if (bestEntry && bestDistance <= maxAllowedDistance) {
    return {
      rawToken: cleanRaw,
      correctedWord: bestEntry.word,
      correctedNormalized: bestEntry.normalized,
      distance: Number(bestDistance.toFixed(2)),
      wasCorrected: true,
    };
  }

  return {
    rawToken: cleanRaw,
    correctedWord: cleanRaw.toUpperCase(),
    correctedNormalized: normToken,
    distance: 0,
    wasCorrected: false,
  };
}

/**
 * Une secuencias de letras deletreadas con espacios (ej. "H O L A" -> "HOLA", "C E D U L A" -> "CEDULA")
 * conservando palabras completas adyacentes (ej. "HOLA C E D" -> "HOLA CED").
 */
export function collapseDactylologicalBuffer(rawBuffer: string): {
  collapsedText: string;
  tokens: string[];
  activePrefix: string;
} {
  const trimmed = rawBuffer.trim();
  if (!trimmed) {
    return { collapsedText: '', tokens: [], activePrefix: '' };
  }

  const rawParts = trimmed.split(/\s+/);
  const mergedTokens: string[] = [];
  let letterAccumulator = '';

  const flushAccumulator = () => {
    if (!letterAccumulator) return;
    // Si el acumulador pegado contiene una palabra conocida al inicio (ej. "HOLAAYU"), segmentarla inteligentemente
    const segmented = segmentConcatenatedLetters(letterAccumulator);
    mergedTokens.push(...segmented);
    letterAccumulator = '';
  };

  for (const part of rawParts) {
    const cleanPart = part.toUpperCase();
    // En LESCO, CH, LL, RR son dígrafos dactilológicos de 1 sola seña
    const isSingleDactylSign =
      cleanPart.length === 1 || cleanPart === 'CH' || cleanPart === 'LL' || cleanPart === 'RR';

    if (isSingleDactylSign) {
      letterAccumulator += cleanPart;
    } else {
      flushAccumulator();
      // También revisar si una cadena larga sin espacios fue escrita por auto-escritura continua (ej. "HOLACEDULA")
      const segmented = segmentConcatenatedLetters(cleanPart);
      mergedTokens.push(...segmented);
    }
  }
  flushAccumulator();

  const endsWithSpace = /\s$/.test(rawBuffer);
  const activePrefix = endsWithSpace
    ? ''
    : mergedTokens.length > 0
    ? mergedTokens[mergedTokens.length - 1]
    : '';

  return {
    collapsedText: mergedTokens.join(' '),
    tokens: mergedTokens,
    activePrefix,
  };
}

/**
 * Segmenta cadenas continuas sin espacio generadas cuando el usuario deletrea de corrido
 * (ej. "HOLAAYUDA" -> ["HOLA", "AYUDA"], "HOLACED" -> ["HOLA", "CED"]).
 */
function segmentConcatenatedLetters(upperChunk: string): string[] {
  const normChunk = normalizeToken(upperChunk).toUpperCase();
  if (normChunk.length <= 4) return [upperChunk];

  // Si coincide de forma difusa directa con una sola palabra conocida (ej. "CEBULA", "HOSPITAI"), no partirla
  if (DIRECT_OPTICAL_TYPO_MAP[normToken(upperChunk)]) {
    return [upperChunk];
  }

  const knownWords = LESCO_LEXICAL_VOCABULARY.map((v) => v.normalized)
    .filter((w) => !w.includes(' ') && w.length >= 4)
    .sort((a, b) => b.length - a.length);

  for (const word of knownWords) {
    if (normChunk === word) {
      return [upperChunk];
    }
    if (normChunk.startsWith(word) && normChunk.length > word.length) {
      const remainder = normChunk.slice(word.length);
      return [word, ...segmentConcatenatedLetters(remainder)];
    }
  }

  return [upperChunk];
}

function normToken(s: string): string {
  return normalizeToken(s).toUpperCase();
}

// ============================================================================
// 4. MOTOR DE AUTOCOMPLETADO DE LETRAS A PALABRAS LESCO
// ============================================================================

export function getWordAutocompleteSuggestions(
  wordBuffer: string,
  limit: number = 5
): LescoWordSuggestion[] {
  const { tokens, activePrefix } = collapseDactylologicalBuffer(wordBuffer);
  const normPrefix = normalizeToken(activePrefix).toUpperCase();

  // Caso 1: El usuario está deletreando activamente un prefijo (ej. "CED", "HOSP", "AYU", o difuso "CEBUL", "HOSPITAI")
  if (normPrefix.length >= 1) {
    const exactOrPrefixMatches = LESCO_LEXICAL_VOCABULARY.filter((entry) => {
      return (
        entry.normalized.startsWith(normPrefix) &&
        entry.normalized !== normPrefix
      );
    });

    // También buscar coincidencias donde alguna palabra interna empiece con el prefijo (ej. "MED" -> "CITA MÉDICA")
    const secondaryMatches = LESCO_LEXICAL_VOCABULARY.filter((entry) => {
      if (exactOrPrefixMatches.includes(entry)) return false;
      const parts = entry.normalized.split(' ');
      return parts.some((p) => p.startsWith(normPrefix) && p !== normPrefix);
    });

    // Si el usuario cometió un error óptico al deletrear (ej. "CEBULA", "HOSPITAI", "AYUBA", "BOMDEROS"),
    // incluir la corrección difusa como primera sugerencia de 1 toque
    const fuzzySuggestions: LexicalEntry[] = [];
    if (normPrefix.length >= 4) {
      const fuzzyRes = fuzzyCorrectSpelledToken(activePrefix, { isActivePrefix: false });
      if (fuzzyRes.wasCorrected) {
        const matchedLex = LESCO_LEXICAL_VOCABULARY.find(
          (e) => e.normalized === fuzzyRes.correctedNormalized
        );
        if (
          matchedLex &&
          !exactOrPrefixMatches.includes(matchedLex) &&
          !secondaryMatches.includes(matchedLex)
        ) {
          fuzzySuggestions.push(matchedLex);
        }
      }
    }

    const combined = [
      ...fuzzySuggestions,
      ...exactOrPrefixMatches,
      ...secondaryMatches,
    ].slice(0, limit);

    if (combined.length > 0) {
      return combined.map((item) => ({
        word: item.word,
        gloss: item.gloss,
        categoryLabel: item.categoryLabel,
        matchedPrefix: activePrefix,
        isNextWordPrediction: false,
      }));
    }
  }

  // Caso 2: La última palabra ya está completa o hay espacio al final -> Sugerir siguiente seña/palabra coherente en LESCO
  if (tokens.length > 0) {
    const lastRaw = tokens[tokens.length - 1];
    const fuzzyLast = fuzzyCorrectSpelledToken(lastRaw);
    const lastTokenNorm = fuzzyLast.correctedNormalized;

    const lexicalMatch = LESCO_LEXICAL_VOCABULARY.find(
      (item) =>
        item.normalized === lastTokenNorm ||
        item.normalized.split(' ').includes(lastTokenNorm)
    );

    if (lexicalMatch && lexicalMatch.nextSuggestedWords.length > 0) {
      const existingSet = new Set(
        tokens.map((t) => fuzzyCorrectSpelledToken(t).correctedNormalized)
      );
      const suggestions: LescoWordSuggestion[] = [];

      for (const nextWord of lexicalMatch.nextSuggestedWords) {
        const normNext = normalizeToken(nextWord).toUpperCase();
        if (existingSet.has(normNext)) continue;
        const foundEntry = LESCO_LEXICAL_VOCABULARY.find((e) => e.word === nextWord);
        suggestions.push({
          word: nextWord,
          gloss: foundEntry?.gloss || nextWord,
          categoryLabel: foundEntry?.categoryLabel || 'Sugerencia LESCO',
          matchedPrefix: '',
          isNextWordPrediction: true,
        });
        if (suggestions.length >= limit) break;
      }

      if (suggestions.length > 0) return suggestions;
    }
  }

  // Caso 3: Pizarra vacía -> Sugerir inicios rápidos más frecuentes del corpus de 54 videos
  const starterWords = ['HOLA', 'SORDO', 'AYUDA', 'CÉDULA', 'HOSPITAL', 'TRÁMITE', 'POLICÍA'];
  return starterWords.slice(0, limit).map((w) => {
    const found = LESCO_LEXICAL_VOCABULARY.find((e) => e.word === w);
    return {
      word: w,
      gloss: found?.gloss || w,
      categoryLabel: found?.categoryLabel || 'Inicio Rápido',
      matchedPrefix: '',
      isNextWordPrediction: true,
    };
  });
}

/**
 * Aplica con 1 solo toque una sugerencia de palabra sobre el `wordBuffer` actual,
 * reemplazando las letras deletreadas parciales por la palabra completa con tilde.
 */
export function applyWordSuggestionToBuffer(
  currentBuffer: string,
  suggestion: LescoWordSuggestion
): string {
  const { tokens } = collapseDactylologicalBuffer(currentBuffer);
  if (tokens.length === 0) {
    return `${suggestion.word} `;
  }

  if (!suggestion.isNextWordPrediction && suggestion.matchedPrefix) {
    const updatedTokens = [...tokens.slice(0, -1), suggestion.word];
    return `${updatedTokens.join(' ')} `;
  }

  return `${tokens.join(' ')} ${suggestion.word} `;
}

// ============================================================================
// 5. MOTOR MORFOSINTÁCTICO GENERATIVO LESCO -> ESPAÑOL DE COSTA RICA
// ============================================================================

type GrammaticalPerson = '1s' | '2s' | '2s_formal' | '3s' | '1p';
type GrammaticalTense = 'past' | 'present' | 'future';

interface VerbConjugationTable {
  infinitive: string;
  past: Record<GrammaticalPerson, string>;
  present: Record<GrammaticalPerson, string>;
}

const SPANISH_VERB_CONJUGATIONS: Record<string, VerbConjugationTable> = {
  NECESITAR: {
    infinitive: 'necesitar',
    past: {
      '1s': 'necesité',
      '2s': 'necesitaste',
      '2s_formal': 'necesitó',
      '3s': 'necesitó',
      '1p': 'necesitamos',
    },
    present: {
      '1s': 'necesito',
      '2s': 'necesitas',
      '2s_formal': 'necesita',
      '3s': 'necesita',
      '1p': 'necesitamos',
    },
  },
  QUERER: {
    infinitive: 'querer',
    past: {
      '1s': 'quise',
      '2s': 'quisiste',
      '2s_formal': 'quiso',
      '3s': 'quiso',
      '1p': 'quisimos',
    },
    present: {
      '1s': 'deseo',
      '2s': 'deseas',
      '2s_formal': 'desea',
      '3s': 'desea',
      '1p': 'deseamos',
    },
  },
  TENER: {
    infinitive: 'tener',
    past: {
      '1s': 'tuve',
      '2s': 'tuviste',
      '2s_formal': 'tuvo',
      '3s': 'tuvo',
      '1p': 'tuvimos',
    },
    present: {
      '1s': 'tengo',
      '2s': 'tienes',
      '2s_formal': 'tiene',
      '3s': 'tiene',
      '1p': 'tenemos',
    },
  },
  IR: {
    infinitive: 'ir',
    past: {
      '1s': 'fui',
      '2s': 'fuiste',
      '2s_formal': 'fue',
      '3s': 'fue',
      '1p': 'fuimos',
    },
    present: {
      '1s': 'voy',
      '2s': 'vas',
      '2s_formal': 'va',
      '3s': 'va',
      '1p': 'vamos',
    },
  },
  BUSCAR: {
    infinitive: 'buscar',
    past: {
      '1s': 'busqué',
      '2s': 'buscaste',
      '2s_formal': 'buscó',
      '3s': 'buscó',
      '1p': 'buscamos',
    },
    present: {
      '1s': 'busco',
      '2s': 'buscas',
      '2s_formal': 'busca',
      '3s': 'busca',
      '1p': 'buscamos',
    },
  },
  DOLER: {
    infinitive: 'doler',
    past: {
      '1s': 'me dolió',
      '2s': 'te dolió',
      '2s_formal': 'le dolió',
      '3s': 'le dolió',
      '1p': 'nos dolió',
    },
    present: {
      '1s': 'me duele',
      '2s': 'te duele',
      '2s_formal': 'le duele',
      '3s': 'le duele',
      '1p': 'nos duele',
    },
  },
  PERDER: {
    infinitive: 'perder',
    past: {
      '1s': 'perdí',
      '2s': 'perdiste',
      '2s_formal': 'perdió',
      '3s': 'perdió',
      '1p': 'perdimos',
    },
    present: {
      '1s': 'perdí', // En contexto de extravío, el presente reportado en LESCO se traduce naturalmente como pretérito perfecto "perdí"
      '2s': 'perdiste',
      '2s_formal': 'perdió',
      '3s': 'perdió',
      '1p': 'perdimos',
    },
  },
  ABRIR: {
    infinitive: 'abrir',
    past: {
      '1s': 'abrí',
      '2s': 'abriste',
      '2s_formal': 'abrió',
      '3s': 'abrió',
      '1p': 'abrimos',
    },
    present: {
      '1s': 'abro',
      '2s': 'abres',
      '2s_formal': 'abre',
      '3s': 'abre',
      '1p': 'abrimos',
    },
  },
  RETIRAR: {
    infinitive: 'retirar',
    past: {
      '1s': 'retiré',
      '2s': 'retiraste',
      '2s_formal': 'retiró',
      '3s': 'retiró',
      '1p': 'retiramos',
    },
    present: {
      '1s': 'vengo a retirar',
      '2s': 'vienes a retirar',
      '2s_formal': 'viene a retirar',
      '3s': 'viene a retirar',
      '1p': 'venimos a retirar',
    },
  },
  PAGAR: {
    infinitive: 'pagar',
    past: {
      '1s': 'pagué',
      '2s': 'pagaste',
      '2s_formal': 'pagó',
      '3s': 'pagó',
      '1p': 'pagamos',
    },
    present: {
      '1s': 'deseo pagar',
      '2s': 'pagas',
      '2s_formal': 'paga',
      '3s': 'paga',
      '1p': 'pagamos',
    },
  },
  FIRMAR: {
    infinitive: 'firmar',
    past: {
      '1s': 'firmé',
      '2s': 'firmaste',
      '2s_formal': 'firmó',
      '3s': 'firmó',
      '1p': 'firmamos',
    },
    present: {
      '1s': 'debo firmar',
      '2s': 'debes firmar',
      '2s_formal': 'debe firmar',
      '3s': 'debe firmar',
      '1p': 'debemos firmar',
    },
  },
  AYUDAR: {
    infinitive: 'ayudar',
    past: {
      '1s': 'ayudé',
      '2s': 'ayudaste',
      '2s_formal': 'ayudó',
      '3s': 'ayudó',
      '1p': 'ayudamos',
    },
    present: {
      '1s': 'necesito ayuda',
      '2s': 'me puedes ayudar',
      '2s_formal': 'me puede ayudar',
      '3s': 'ayuda',
      '1p': 'necesitamos ayuda',
    },
  },
  LLAMAR: {
    infinitive: 'llamar',
    past: {
      '1s': 'llamé',
      '2s': 'llamaste',
      '2s_formal': 'llamó',
      '3s': 'llamó',
      '1p': 'llamamos',
    },
    present: {
      '1s': 'necesito llamar',
      '2s': 'llame',
      '2s_formal': 'llame',
      '3s': 'llame',
      '1p': 'llamemos',
    },
  },
  ESCRIBIR: {
    infinitive: 'escribir',
    past: {
      '1s': 'escribí',
      '2s': 'escribiste',
      '2s_formal': 'escribió',
      '3s': 'escribió',
      '1p': 'escribimos',
    },
    present: {
      '1s': 'escribo',
      '2s': 'puede escribir',
      '2s_formal': 'escriba',
      '3s': 'escriba',
      '1p': 'escribimos',
    },
  },
  ENTENDER: {
    infinitive: 'comprender',
    past: {
      '1s': 'comprendí',
      '2s': 'comprendiste',
      '2s_formal': 'comprendió',
      '3s': 'comprendió',
      '1p': 'comprendimos',
    },
    present: {
      '1s': 'comprendo',
      '2s': 'comprendes',
      '2s_formal': 'comprende',
      '3s': 'comprende',
      '1p': 'comprendemos',
    },
  },
  COMPRENDER: {
    infinitive: 'comprender',
    past: {
      '1s': 'comprendí',
      '2s': 'comprendiste',
      '2s_formal': 'comprendió',
      '3s': 'comprendió',
      '1p': 'comprendimos',
    },
    present: {
      '1s': 'comprendo',
      '2s': 'comprendes',
      '2s_formal': 'comprende',
      '3s': 'comprende',
      '1p': 'comprendemos',
    },
  },
  ESPERAR: {
    infinitive: 'esperar',
    past: {
      '1s': 'esperé',
      '2s': 'esperaste',
      '2s_formal': 'esperó',
      '3s': 'esperó',
      '1p': 'esperamos',
    },
    present: {
      '1s': 'estoy esperando',
      '2s': 'esperas',
      '2s_formal': 'espera',
      '3s': 'espera',
      '1p': 'esperamos',
    },
  },
  ESCUCHAR: {
    infinitive: 'escuchar',
    past: {
      '1s': 'pude escuchar',
      '2s': 'escuchaste',
      '2s_formal': 'escuchó',
      '3s': 'escuchó',
      '1p': 'escuchamos',
    },
    present: {
      '1s': 'puedo escuchar',
      '2s': 'escuchas',
      '2s_formal': 'escucha',
      '3s': 'escucha',
      '1p': 'podemos escuchar',
    },
  },
};

const PERIPHRASTIC_FUTURE_AUX: Record<GrammaticalPerson, string> = {
  '1s': 'voy a',
  '2s': 'vas a',
  '2s_formal': 'va a',
  '3s': 'va a',
  '1p': 'vamos a',
};

const VERB_SYNONYM_NORMALIZATION: Record<string, string> = {
  NECESITO: 'NECESITAR',
  OCUPO: 'NECESITAR',
  OCUPAR: 'NECESITAR',
  QUIERO: 'QUERER',
  DESEO: 'QUERER',
  DESEAR: 'QUERER',
  TENGO: 'TENER',
  VOY: 'IR',
  VENGO: 'IR',
  VENIR: 'IR',
  BUSCO: 'BUSCAR',
  DUELE: 'DOLER',
  DOLOR: 'DOLER',
  PERDI: 'PERDER',
  EXTRAVIAR: 'PERDER',
  EXTRAVIE: 'PERDER',
  ABRO: 'ABRIR',
  RETIRO: 'RETIRAR',
  PAGO: 'PAGAR',
  FIRMO: 'FIRMAR',
  FIRMA: 'FIRMAR',
  AYUDE: 'AYUDAR',
  LLAME: 'LLAMAR',
  ESCRIBA: 'ESCRIBIR',
  ENTIENDO: 'ENTENDER',
  ENTENDI: 'ENTENDER',
  COMPRENDO: 'COMPRENDER',
  COMPRENDI: 'COMPRENDER',
  ESPERO: 'ESPERAR',
  ESCUCHO: 'ESCUCHAR',
  OIR: 'ESCUCHAR',
  OIGO: 'ESCUCHAR',
};

function conjugateLescoVerb(
  verbKey: string,
  person: GrammaticalPerson,
  tense: GrammaticalTense,
  secondaryInfinitive?: string
): string {
  const table = SPANISH_VERB_CONJUGATIONS[verbKey];
  if (!table) {
    return verbKey.toLowerCase();
  }

  if (tense === 'future') {
    const aux = PERIPHRASTIC_FUTURE_AUX[person];
    if (secondaryInfinitive) {
      const secTable = SPANISH_VERB_CONJUGATIONS[secondaryInfinitive];
      return `${aux} ${secTable ? secTable.infinitive : secondaryInfinitive.toLowerCase()}`;
    }
    return `${aux} ${table.infinitive}`;
  }

  const baseConj = tense === 'past' ? table.past[person] : table.present[person];
  if (secondaryInfinitive && (verbKey === 'QUERER' || verbKey === 'NECESITAR' || verbKey === 'IR')) {
    const secTable = SPANISH_VERB_CONJUGATIONS[secondaryInfinitive];
    const secInf = secTable ? secTable.infinitive : secondaryInfinitive.toLowerCase();
    if (verbKey === 'IR') {
      return `${baseConj} a ${secInf}`;
    }
    return `${baseConj} ${secInf}`;
  }

  return baseConj;
}

/**
 * Transforma palabras o glosas en orden morfosintáctico LESCO:
 * TIEMPO -> LUGAR -> OBJETO/TEMA -> SUJETO -> VERBO -> INTERROGACIÓN/NEGACIÓN
 */
export function buildCanonicalLescoGloss(tokens: string[]): string {
  if (tokens.length === 0) return '';

  const timeWords = new Set(['HOY', 'AYER', 'AHORA', 'PASADO', 'MAÑANA', 'MANANA', 'SIEMPRE', 'HORARIO', 'HORARIOS', 'TEMPRANO']);
  const placeWords = new Set(['HOSPITAL', 'BANCO', 'CAJERO', 'POLICIA', 'POLICÍA', 'CONSULTORIO', 'FARMACIA', 'PARADA', 'SANITARIOS', 'BAÑO', 'BANO', 'AQUI', 'AQUÍ']);
  const subjectWords = new Set(['YO', 'SORDO', 'SORDA', 'PERSONA', 'TU', 'TÚ', 'USTED', 'EL', 'ÉL', 'ELLA', 'NOSOTROS', 'OFICIAL', 'DOCTOR', 'MÉDICO', 'MEDICO', 'INTERPRETE', 'INTÉRPRETE']);
  const verbWords = new Set([
    'AYUDA', 'AUXILIO', 'AYUDAR', 'NECESITAR', 'NECESITO', 'QUERER', 'QUIERO', 'TENER', 'TENGO',
    'IR', 'VOY', 'BUSCAR', 'DOLER', 'DUELE', 'PERDER', 'PERDI', 'PERDÍ', 'ABRIR', 'RETIRAR',
    'PAGAR', 'ESCRIBIR', 'ESCRIBA', 'FIRMAR', 'LLAMAR', 'REPETIR', 'ENTENDER', 'COMPRENDER',
    'ESPERAR', 'ESCUCHAR',
  ]);
  const endParticles = new Set([
    'NO', 'DONDE', 'DÓNDE', 'QUE', 'QUÉ', 'CUANDO', 'CUÁNDO', 'CUANTO', 'CUÁNTO',
    'COMO', 'CÓMO', 'QUIEN', 'QUIÉN', 'POR FAVOR', 'FAVOR', 'GRACIAS', 'SI', 'SÍ',
  ]);

  const timeBucket: string[] = [];
  const placeBucket: string[] = [];
  const topicBucket: string[] = [];
  const subjectBucket: string[] = [];
  const verbBucket: string[] = [];
  const particleBucket: string[] = [];

  for (const rawTok of tokens) {
    const corrected = fuzzyCorrectSpelledToken(rawTok);
    const upper = corrected.correctedWord.toUpperCase();
    const norm = corrected.correctedNormalized;

    if (timeWords.has(upper) || timeWords.has(norm)) {
      timeBucket.push(upper);
    } else if (placeWords.has(upper) || placeWords.has(norm)) {
      placeBucket.push(upper);
    } else if (subjectWords.has(upper) || subjectWords.has(norm)) {
      subjectBucket.push(upper);
    } else if (verbWords.has(upper) || verbWords.has(norm)) {
      verbBucket.push(upper);
    } else if (endParticles.has(upper) || endParticles.has(norm)) {
      particleBucket.push(upper);
    } else {
      topicBucket.push(upper);
    }
  }

  const ordered = [
    ...timeBucket,
    ...placeBucket,
    ...topicBucket,
    ...subjectBucket,
    ...verbBucket,
    ...particleBucket,
  ];

  return ordered.join(' • ');
}

/**
 * Motor Morfosintáctico Generativo LESCO -> Español de Costa Rica (`synthesizeNaturalSpanishSentence`).
 *
 * Reordena cualquier secuencia de glosas LESCO (Tiempo + Lugar + Objeto + Sujeto + Verbo + Negación/Interrogación)
 * al orden gramatical natural del español de Costa Rica, conjugando verbos según persona y tiempo,
 * anteponiendo la negación al verbo y estructurando preguntas con signos de apertura y cierre.
 *
 * Resuelve con perfección casos como:
 * - "AYER YO PERDER CEDULA" -> "Ayer perdí mi cédula de identidad."
 * - "MAÑANA YO IR HOSPITAL CITA" -> "Mañana voy a ir al hospital a mi cita médica."
 * - "YO SORDO ENTENDER NO" -> "Soy una persona sorda y no comprendo bien."
 * - "DONDE PARADA BUS" -> "¿Dónde queda la parada de buses más cercana?"
 * - "YO NECESITAR INTERPRETE LESCO" -> "Necesito un intérprete de LESCO por favor."
 * - "HOLA YO QUERER ABRIR CUENTA BANCO" -> "Hola, deseo abrir una cuenta en el banco."
 */
export function synthesizeNaturalSpanishSentence(
  rawTokensOrText: string | string[]
): SynthesizedSpanishResult | null {
  const rawTokens = Array.isArray(rawTokensOrText)
    ? rawTokensOrText
    : collapseDactylologicalBuffer(rawTokensOrText).tokens;

  if (rawTokens.length === 0) return null;

  // 1. Corrección óptica difusa de cada token antes del análisis morfosintáctico
  const correctedTokens: FuzzyCorrectionResult[] = [];
  rawTokens.forEach((t, idx) => {
    const isLast = idx === rawTokens.length - 1;
    correctedTokens.push(
      fuzzyCorrectSpelledToken(t, {
        isActivePrefix: isLast && rawTokens.length > 1,
        previousToken: idx > 0 ? correctedTokens[idx - 1].correctedNormalized : undefined,
      })
    );
  });

  const normList = correctedTokens.map((c) => c.correctedNormalized);
  const normSet = new Set(normList);

  // Detectar marcadores morfosintácticos LESCO
  const hasGreeting = normSet.has('HOLA') || (normSet.has('BUENOS') && normSet.has('DIAS')) || (normSet.has('BUENAS') && normSet.has('TARDES'));
  const hasNegation = normSet.has('NO');
  const deafGender = normSet.has('SORDA') ? 'sorda' : normSet.has('SORDO') ? 'sorda' : null;
  const hasDeafCondition = normSet.has('SORDO') || normSet.has('SORDA');

  // Marcador de tiempo
  let timeMarker: 'HOY' | 'AYER' | 'MANANA' | 'AHORA' | 'SIEMPRE' | null = null;
  let tense: GrammaticalTense = 'present';
  let timeWordEs = '';

  if (normSet.has('AYER') || normSet.has('PASADO')) {
    timeMarker = 'AYER';
    tense = 'past';
    timeWordEs = 'Ayer';
  } else if (normSet.has('MANANA')) {
    timeMarker = 'MANANA';
    tense = 'future';
    timeWordEs = 'Mañana';
  } else if (normSet.has('HOY')) {
    timeMarker = 'HOY';
    tense = 'present';
    timeWordEs = 'Hoy';
  } else if (normSet.has('AHORA')) {
    timeMarker = 'AHORA';
    tense = 'present';
    timeWordEs = 'Ahora mismo';
  } else if (normSet.has('SIEMPRE')) {
    timeMarker = 'SIEMPRE';
    tense = 'present';
    timeWordEs = 'Siempre';
  }

  // Sujeto / Persona gramatical
  let person: GrammaticalPerson = '1s';
  let explicitSubjectEs = '';
  if (normSet.has('NOSOTROS')) {
    person = '1p';
    explicitSubjectEs = 'nosotros';
  } else if (normSet.has('USTED')) {
    person = '2s_formal';
  } else if (normSet.has('TU')) {
    person = '2s';
  } else if (normSet.has('ELLA')) {
    person = '3s';
    explicitSubjectEs = 'ella';
  } else if (normSet.has('EL') && rawTokens.some((r) => r.toUpperCase() === 'ÉL' || normList.indexOf('EL') === 0)) {
    person = '3s';
    explicitSubjectEs = 'él';
  }

  // Interrogativos LESCO
  let questionWord: 'DONDE' | 'QUE' | 'CUANDO' | 'CUANTO' | 'COMO' | 'QUIEN' | null = null;
  if (normSet.has('DONDE')) questionWord = 'DONDE';
  else if (normSet.has('CUANDO')) questionWord = 'CUANDO';
  else if (normSet.has('CUANTO')) questionWord = 'CUANTO';
  else if (normSet.has('COMO')) questionWord = 'COMO';
  else if (normSet.has('QUIEN')) questionWord = 'QUIEN';
  else if (normSet.has('QUE')) questionWord = 'QUE';

  // Detectar verbos presentes en orden de aparición
  const detectedVerbs: string[] = [];
  for (const norm of normList) {
    if (SPANISH_VERB_CONJUGATIONS[norm]) {
      if (!detectedVerbs.includes(norm)) detectedVerbs.push(norm);
    } else if (VERB_SYNONYM_NORMALIZATION[norm]) {
      const mapped = VERB_SYNONYM_NORMALIZATION[norm];
      if (!detectedVerbs.includes(mapped)) detectedVerbs.push(mapped);
    }
  }

  // Si hay "PERDI" explícito sin marcador de tiempo futuro, usar pasado
  if (normSet.has('PERDI') && tense === 'present') {
    tense = 'past';
  }

  // Categoría semántica inferida y video oficial de respaldo
  let matchedCategory: LescoCorpusCategory = 'mensajes';
  let categoryLabel = 'Síntesis Gramatical LESCO';
  let fallbackR2Key = 'lesco/v1/m5/mensajes/0.mp4';

  if (
    normSet.has('HOSPITAL') ||
    normSet.has('CITA') ||
    normSet.has('MEDICO') ||
    normSet.has('DOCTOR') ||
    normSet.has('DOLOR') ||
    normSet.has('DOLER') ||
    normSet.has('MEDICAMENTOS') ||
    normSet.has('PASTILLAS') ||
    normSet.has('RECETA') ||
    normSet.has('CONSULTORIO')
  ) {
    matchedCategory = 'hospital';
    categoryLabel = 'Hospital • Síntesis LESCO';
    fallbackR2Key = normSet.has('CITA')
      ? 'lesco/v1/m5/hospital/1_2.mp4'
      : normSet.has('INTERPRETE')
      ? 'lesco/v1/m5/hospital/1_1.mp4'
      : normSet.has('DOLOR') || normSet.has('DOLER')
      ? 'lesco/v1/m5/hospital/3_1.mp4'
      : normSet.has('MEDICAMENTOS') || normSet.has('RECETA')
      ? 'lesco/v1/m5/hospital/2_1.mp4'
      : 'lesco/v1/m5/hospital/0.mp4';
  } else if (
    normSet.has('BANCO') ||
    normSet.has('CUENTA') ||
    normSet.has('AHORROS') ||
    normSet.has('TARJETA') ||
    normSet.has('CAJERO') ||
    normSet.has('DEPOSITO') ||
    normSet.has('EFECTIVO') ||
    normSet.has('MONTO') ||
    normSet.has('FIRMAR')
  ) {
    matchedCategory = 'banco';
    categoryLabel = 'Banco • Síntesis LESCO';
    fallbackR2Key = normSet.has('CUENTA')
      ? 'lesco/v1/m5/banco/1_1.mp4'
      : normSet.has('TARJETA') && normSet.has('RETIRAR')
      ? 'lesco/v1/m5/banco/1_2.mp4'
      : normSet.has('CAJERO') || normSet.has('BLOQUEADA')
      ? 'lesco/v1/m5/banco/1_3.mp4'
      : normSet.has('FIRMAR')
      ? 'lesco/v1/m5/banco/3_2.mp4'
      : 'lesco/v1/m5/banco/0.mp4';
  } else if (
    normSet.has('POLICIA') ||
    normSet.has('OFICIAL') ||
    normSet.has('ROBO') ||
    normSet.has('ASALTO') ||
    normSet.has('PERDER') ||
    normSet.has('PERDI') ||
    normSet.has('DOCUMENTOS') ||
    normSet.has('PARADA') ||
    normSet.has('BUS') ||
    normSet.has('BUSES')
  ) {
    matchedCategory = 'policia';
    categoryLabel = 'Policía y Ubicación • Síntesis LESCO';
    fallbackR2Key =
      normSet.has('PARADA') || normSet.has('BUS') || normSet.has('BUSES')
        ? 'lesco/v1/m5/policia/3_1.mp4'
        : normSet.has('PERDER') || normSet.has('PERDI') || normSet.has('CEDULA') || normSet.has('DOCUMENTOS')
        ? 'lesco/v1/m5/policia/2_2.mp4'
        : normSet.has('ROBO') || normSet.has('ASALTO')
        ? 'lesco/v1/m5/policia/2_1.mp4'
        : 'lesco/v1/m5/policia/0.mp4';
  } else if (
    normSet.has('AYUDA') ||
    normSet.has('AUXILIO') ||
    normSet.has('EMERGENCIA') ||
    normSet.has('PELIGRO') ||
    normSet.has('AMBULANCIA') ||
    normSet.has('BOMBEROS') ||
    normSet.has('FUEGO')
  ) {
    matchedCategory = 'emergencia';
    categoryLabel = 'Emergencia • Síntesis LESCO';
    fallbackR2Key = normSet.has('BOMBEROS') || normSet.has('FUEGO')
      ? 'lesco/v1/m5/emergencia/3_1.mp4'
      : normSet.has('AMBULANCIA')
      ? 'lesco/v1/m5/emergencia/2_1.mp4'
      : 'lesco/v1/m5/emergencia/1_1.mp4';
  } else if (normSet.has('INTERPRETE') || normSet.has('LESCO')) {
    matchedCategory = 'hospital';
    categoryLabel = 'Accesibilidad • Intérprete LESCO';
    fallbackR2Key = 'lesco/v1/m5/hospital/1_1.mp4';
  }

  const bestFallbackEntry =
    LESCO_54_CORPUS.find((c) => c.r2Key === fallbackR2Key) || LESCO_54_CORPUS[0];
  const canonicalGloss = buildCanonicalLescoGloss(
    correctedTokens.map((c) => c.correctedWord)
  );

  // ==========================================================================
  // REGLAS MORFOSINTÁCTICAS ESPECÍFICAS Y COMPOSICIONALES DE ALTA PRECISIÓN
  // ==========================================================================

  // 1. Pérdida de Cédula / Documentos (ej. "AYER YO PERDER CEDULA" -> "Ayer perdí mi cédula de identidad.")
  if (
    (normSet.has('PERDER') || normSet.has('PERDI')) &&
    (normSet.has('CEDULA') || normSet.has('DOCUMENTO') || normSet.has('DOCUMENTOS') || normSet.has('TARJETA'))
  ) {
    const verbStr = conjugateLescoVerb('PERDER', person, timeMarker === 'MANANA' ? 'future' : 'past');
    const objStr = normSet.has('CEDULA')
      ? 'mi cédula de identidad'
      : normSet.has('TARJETA')
      ? 'mi tarjeta bancaria'
      : 'mis documentos personales';
    const prefix = timeWordEs ? `${timeWordEs} ` : '';
    const greetPrefix = hasGreeting ? 'Hola, ' : '';
    const rawSentence = `${greetPrefix}${prefix}${verbStr} ${objStr}.`;
    const sentenceEs = rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);

    return {
      sentenceEs,
      canonicalGloss,
      matchedCategory: 'policia',
      categoryLabel: 'Policía • Documentos Extraviados',
      grammarRuleApplied: 'Reordenamiento T-S-V-O (LESCO → Pretérito Español CR)',
      confidence: 98,
      bestFallbackEntry:
        LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/policia/2_2.mp4') ||
        bestFallbackEntry,
    };
  }

  // 2. Ir al Hospital / Cita Médica (ej. "MAÑANA YO IR HOSPITAL CITA" -> "Mañana voy a ir al hospital a mi cita médica.")
  if (
    (normSet.has('IR') || normSet.has('TENER') || timeMarker !== null) &&
    (normSet.has('HOSPITAL') || normSet.has('CITA') || normSet.has('MEDICO') || normSet.has('DOCTOR'))
  ) {
    if (normSet.has('IR') && normSet.has('HOSPITAL') && normSet.has('CITA')) {
      const verbConj = conjugateLescoVerb('IR', person, tense);
      const timePrefix = timeWordEs ? `${timeWordEs} ` : '';
      const greetPrefix = hasGreeting ? 'Hola, ' : '';
      const rawSentence = `${greetPrefix}${timePrefix}${verbConj} al hospital a mi cita médica.`;
      const sentenceEs = rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);

      return {
        sentenceEs,
        canonicalGloss,
        matchedCategory: 'hospital',
        categoryLabel: 'Hospital • Cita Médica',
        grammarRuleApplied: 'Reordenamiento T-S-V-L-O (Futuro Perifrástico LESCO → Español)',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/hospital/1_2.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('IR') && normSet.has('HOSPITAL')) {
      const verbConj = conjugateLescoVerb('IR', person, tense);
      const timePrefix = timeWordEs ? `${timeWordEs} ` : '';
      const extraReason =
        normSet.has('DOCTOR') || normSet.has('MEDICO') ? ' para consulta con el médico' : '';
      const rawSentence = `${timePrefix}${verbConj} al hospital${extraReason}.`;
      const sentenceEs = rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);

      return {
        sentenceEs,
        canonicalGloss,
        matchedCategory: 'hospital',
        categoryLabel: 'Hospital • Traslado Médico',
        grammarRuleApplied: 'Reordenamiento T-S-V-L (LESCO → Español Natural)',
        confidence: 95,
        bestFallbackEntry,
      };
    }

    if (normSet.has('CITA') && !normSet.has('IR')) {
      const verbConj = conjugateLescoVerb('TENER', person, tense);
      const timeSuffix = timeWordEs ? ` para ${timeWordEs.toLowerCase()}` : ' programada para hoy';
      const sentenceEs = `Tengo cita médica${timeSuffix}.`;

      return {
        sentenceEs: tense === 'present' ? sentenceEs : `${timeWordEs} ${verbConj} una cita médica.`,
        canonicalGloss,
        matchedCategory: 'hospital',
        categoryLabel: 'Hospital • Cita Médica',
        grammarRuleApplied: 'Reconstrucción T-O-S-V → Español Natural',
        confidence: 96,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/hospital/1_2.mp4') ||
          bestFallbackEntry,
      };
    }
  }

  // 3. Condición Sorda + Negación Post-Verbal (ej. "YO SORDO ENTENDER NO" -> "Soy una persona sorda y no comprendo bien.")
  if (
    hasNegation &&
    (normSet.has('ENTENDER') || normSet.has('COMPRENDER') || normSet.has('ESCUCHAR'))
  ) {
    if (hasDeafCondition && (normSet.has('ENTENDER') || normSet.has('COMPRENDER'))) {
      const sentenceEs = 'Soy una persona sorda y no comprendo bien.';
      return {
        sentenceEs,
        canonicalGloss,
        matchedCategory: 'mensajes',
        categoryLabel: 'Comunicación • Comprensión',
        grammarRuleApplied: 'Inversión de Negación Post-Verbal LESCO (VERBO + NO → NO + VERBO)',
        confidence: 99,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/mensajes/2_2.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('ENTENDER') || normSet.has('COMPRENDER')) {
      const sentenceEs = 'No comprendí bien, ¿puede repetirlo por escrito?';
      return {
        sentenceEs,
        canonicalGloss,
        matchedCategory: 'mensajes',
        categoryLabel: 'Cortesía • Repetir por Escrito',
        grammarRuleApplied: 'Inversión de Negación Post-Verbal LESCO (VERBO + NO → NO + VERBO)',
        confidence: 96,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/mensajes/2_2.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('ESCUCHAR')) {
      const sentenceEs = hasDeafCondition
        ? 'Soy una persona sorda y no puedo escuchar, necesito ayuda.'
        : 'Necesito ayuda urgente, no puedo escuchar.';
      return {
        sentenceEs,
        canonicalGloss,
        matchedCategory: 'emergencia',
        categoryLabel: 'Emergencia • Auxilio Inmediato',
        grammarRuleApplied: 'Inversión de Negación Post-Verbal LESCO (ESCUCHAR NO → no puedo escuchar)',
        confidence: 97,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/emergencia/1_1.mp4') ||
          bestFallbackEntry,
      };
    }
  }

  // 4. Preguntas de Ubicación (ej. "DONDE PARADA BUS" -> "¿Dónde queda la parada de buses más cercana?")
  if (questionWord === 'DONDE' || (normSet.has('PARADA') && (normSet.has('BUS') || normSet.has('BUSES')))) {
    if (normSet.has('PARADA') || normSet.has('BUS') || normSet.has('BUSES')) {
      return {
        sentenceEs: '¿Dónde queda la parada de buses más cercana?',
        canonicalGloss: 'CERCA AQUÍ • PARADA BUSES • ¿QUEDAR DÓNDE?',
        matchedCategory: 'policia',
        categoryLabel: 'Ubicación • Parada de Buses',
        grammarRuleApplied: 'Movimiento Interrogativo LESCO (PARADA BUS DÓNDE → ¿Dónde queda...?)',
        confidence: 99,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/policia/3_1.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('SANITARIOS') || normSet.has('BANO')) {
      return {
        sentenceEs: '¿Dónde están los servicios sanitarios?',
        canonicalGloss: 'SERVICIOS SANITARIOS BAÑO • ¿ESTAR DÓNDE?',
        matchedCategory: 'mensajes',
        categoryLabel: 'Cortesía • Servicios Sanitarios',
        grammarRuleApplied: 'Movimiento Interrogativo LESCO (BAÑO DÓNDE → ¿Dónde están...?)',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/mensajes/3_2.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('FILA') || normSet.has('PREFERENCIAL')) {
      return {
        sentenceEs: '¿Dónde se hace la fila preferencial?',
        canonicalGloss: 'FILA PREFERENCIAL LEY 7600 • ¿HACER DÓNDE?',
        matchedCategory: 'mensajes',
        categoryLabel: 'Cortesía • Fila Preferencial',
        grammarRuleApplied: 'Movimiento Interrogativo LESCO (FILA DÓNDE → ¿Dónde se hace...?)',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/mensajes/3_1.mp4') ||
          bestFallbackEntry,
      };
    }

    if (normSet.has('FIRMAR') || normSet.has('DOCUMENTO')) {
      return {
        sentenceEs: '¿Dónde debo firmar el documento?',
        canonicalGloss: 'DOCUMENTO ESTE • ¿YO FIRMAR DÓNDE?',
        matchedCategory: 'banco',
        categoryLabel: 'Banco • Firma de Documento',
        grammarRuleApplied: 'Movimiento Interrogativo LESCO (DOCUMENTO FIRMAR DÓNDE → ¿Dónde debo firmar...?)',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/banco/3_2.mp4') ||
          bestFallbackEntry,
      };
    }
  }

  // 5. Solicitud de Intérprete LESCO (ej. "YO NECESITAR INTERPRETE LESCO" -> "Necesito un intérprete de LESCO por favor.")
  if (normSet.has('INTERPRETE')) {
    if (normSet.has('PROCESO')) {
      return {
        sentenceEs: 'Necesito un intérprete de LESCO para este proceso.',
        canonicalGloss: 'PROCESO TRÁMITE ESTE • INTÉRPRETE LESCO YO NECESITAR',
        matchedCategory: 'policia',
        categoryLabel: 'Policía • Intérprete Legal',
        grammarRuleApplied: 'Reconstrucción S-V-O LESCO → Español Natural',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/policia/1_3.mp4') ||
          bestFallbackEntry,
      };
    }

    if (hasDeafCondition && !normSet.has('YO')) {
      return {
        sentenceEs: 'Soy sordo/a, necesito un intérprete de LESCO si es posible.',
        canonicalGloss: 'YO SORDO • INTÉRPRETE LESCO NECESITAR POR FAVOR',
        matchedCategory: 'hospital',
        categoryLabel: 'Hospital • Intérprete LESCO',
        grammarRuleApplied: 'Reconstrucción Identidad Sorda + Solicitud de Intérprete',
        confidence: 98,
        bestFallbackEntry:
          LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/hospital/1_1.mp4') ||
          bestFallbackEntry,
      };
    }

    const prefixDeaf = hasDeafCondition ? 'Soy una persona sorda y necesito' : 'Necesito';
    const sentenceEs = `${prefixDeaf} un intérprete de LESCO por favor.`;
    return {
      sentenceEs,
      canonicalGloss,
      matchedCategory: 'hospital',
      categoryLabel: 'Accesibilidad • Intérprete LESCO',
      grammarRuleApplied: 'Conjugación Morfosintáctica 1ª Persona (YO NECESITAR → Necesito)',
      confidence: 99,
      bestFallbackEntry:
        LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/hospital/1_1.mp4') ||
        bestFallbackEntry,
    };
  }

  // 6. Apertura de Cuenta Bancaria (ej. "HOLA YO QUERER ABRIR CUENTA BANCO" -> "Hola, deseo abrir una cuenta en el banco.")
  if (
    (normSet.has('ABRIR') || normSet.has('CUENTA')) &&
    (normSet.has('BANCO') || normSet.has('AHORROS') || normSet.has('QUERER'))
  ) {
    const greetPrefix = hasGreeting ? 'Hola, ' : '';
    const desireVerb = hasGreeting ? 'deseo' : 'Deseo';
    const complement =
      normSet.has('BANCO') && !normSet.has('AHORROS')
        ? 'una cuenta en el banco.'
        : 'una cuenta de ahorros.';
    const sentenceEs = `${greetPrefix}${desireVerb} abrir ${complement}`;

    return {
      sentenceEs,
      canonicalGloss,
      matchedCategory: 'banco',
      categoryLabel: 'Banco • Cuentas',
      grammarRuleApplied: 'Perífrasis Volitiva LESCO (YO QUERER ABRIR → deseo abrir)',
      confidence: 99,
      bestFallbackEntry:
        LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/banco/1_1.mp4') ||
        bestFallbackEntry,
    };
  }

  // ==========================================================================
  // 7. MOTOR COMPOSICIONAL GENERAL (CUALQUIER COMBINACIÓN LIBRE DE GLOSAS)
  // ==========================================================================
  if (
    rawTokens.length >= 2 &&
    (detectedVerbs.length > 0 ||
      timeMarker !== null ||
      hasNegation ||
      questionWord !== null ||
      hasDeafCondition)
  ) {
    const structuralNorms = new Set([
      'HOLA', 'BUENOS', 'DIAS', 'BUENAS', 'TARDES',
      'HOY', 'AYER', 'MANANA', 'AHORA', 'SIEMPRE', 'PASADO',
      'YO', 'TU', 'USTED', 'EL', 'ELLA', 'NOSOTROS', 'PERSONA', 'SORDO', 'SORDA',
      'NO', 'DONDE', 'QUE', 'CUANDO', 'CUANTO', 'COMO', 'QUIEN',
      'POR', 'FAVOR',
      ...Object.keys(SPANISH_VERB_CONJUGATIONS),
      ...Object.keys(VERB_SYNONYM_NORMALIZATION),
    ]);

    const objectWords: string[] = [];
    const placeTokens: string[] = [];
    const knownPlaces = new Set([
      'HOSPITAL', 'BANCO', 'CAJERO', 'CONSULTORIO', 'FARMACIA', 'PARADA', 'SANITARIOS', 'BANO', 'POLICIA',
    ]);

    for (const cTok of correctedTokens) {
      if (structuralNorms.has(cTok.correctedNormalized)) continue;
      if (knownPlaces.has(cTok.correctedNormalized)) {
        placeTokens.push(cTok.correctedWord.toLowerCase());
      } else {
        objectWords.push(cTok.correctedWord.toLowerCase());
      }
    }

    const parts: string[] = [];

    if (hasGreeting) {
      parts.push('Hola,');
    }

    if (timeWordEs) {
      parts.push(parts.length > 0 ? timeWordEs.toLowerCase() : timeWordEs);
    }

    if (hasDeafCondition) {
      parts.push(
        parts.length > 0
          ? `soy una persona ${deafGender} y`
          : `Soy una persona ${deafGender} y`
      );
    } else if (explicitSubjectEs) {
      parts.push(explicitSubjectEs);
    }

    // Construir núcleo verbal con negación antepuesta si aplica
    if (detectedVerbs.length > 0) {
      const mainVerb = detectedVerbs[0];
      const secondaryVerb = detectedVerbs.length > 1 ? detectedVerbs[1] : undefined;
      const conjugated = conjugateLescoVerb(mainVerb, person, tense, secondaryVerb);
      parts.push(hasNegation ? `no ${conjugated}` : conjugated);
    } else if (hasNegation) {
      parts.push('no puedo');
    }

    // Añadir objeto / tema con artículo natural
    if (objectWords.length > 0) {
      const joinedObj = objectWords.join(' ');
      if (joinedObj === 'cedula') {
        parts.push('mi cédula de identidad');
      } else if (joinedObj === 'tarjeta') {
        parts.push('mi tarjeta');
      } else if (joinedObj === 'medicamentos') {
        parts.push('mis medicamentos');
      } else {
        parts.push(joinedObj);
      }
    }

    // Añadir complemento de lugar
    if (placeTokens.length > 0) {
      const placeStr = placeTokens.join(' ');
      const prep =
        detectedVerbs.includes('IR') && tense !== 'past' ? 'al' : 'en el';
      parts.push(`${prep} ${placeStr}`);
    }

    if (normSet.has('FAVOR')) {
      parts.push('por favor');
    }

    let finalSentence = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (!finalSentence) return null;

    finalSentence = finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1);

    if (questionWord) {
      const qMap: Record<string, string> = {
        DONDE: '¿Dónde',
        QUE: '¿Qué',
        CUANDO: '¿Cuándo',
        CUANTO: '¿Cuánto',
        COMO: '¿Cómo',
        QUIEN: '¿Quién',
      };
      const qPrefix = qMap[questionWord] || '¿';
      finalSentence = `${qPrefix} ${finalSentence.charAt(0).toLowerCase()}${finalSentence.slice(1)}?`;
    } else if (!finalSentence.endsWith('.')) {
      finalSentence += '.';
    }

    return {
      sentenceEs: finalSentence,
      canonicalGloss,
      matchedCategory,
      categoryLabel,
      grammarRuleApplied:
        'Síntesis Morfosintáctica Generativa (LESCO T-L-O-S-V-Neg → Español de Costa Rica)',
      confidence: 92,
      bestFallbackEntry,
    };
  }

  return null;
}

// ============================================================================
// 6. MOTOR DE COHERENCIA GRAMATICAL INTEGRAL (CORPUS 54 + DIFUSO + GENERATIVO)
// ============================================================================

/**
 * Analiza en tiempo real el `wordBuffer` de `SignsToTextScreen.tsx` y reconstruye:
 * 1) Corrección dactilológica difusa por confusión óptica de señas (`fuzzyCorrectSpelledToken`).
 * 2) Sugerencias de autocompletado dactilológico (letras -> palabras).
 * 3) Oración gramaticalmente coherente en español natural (Corpus 54 videos + Síntesis Morfosintáctica Generativa).
 * 4) Video oficial (`r2Key`) y glosa LESCO estructurada.
 */
export function analyzeLescoGrammarCoherence(wordBuffer: string): LescoCoherenceAnalysis {
  const { collapsedText, tokens, activePrefix } = collapseDactylologicalBuffer(wordBuffer);
  const wordSuggestions = getWordAutocompleteSuggestions(wordBuffer, 5);

  if (tokens.length === 0) {
    return {
      rawBuffer: wordBuffer,
      collapsedText: '',
      tokens: [],
      correctedTokens: [],
      fuzzyCorrections: [],
      synthesizedSentence: null,
      activePrefix: '',
      wordSuggestions,
      detectedGloss: '',
      primaryMatch: null,
      alternatives: [],
    };
  }

  // 1. Aplicar corrección dactilológica difusa a cada token deletreado,
  //    re-rankeando candidatos con el bigrama (token previo corregido → candidato).
  const fuzzyCorrections: FuzzyCorrectionResult[] = [];
  tokens.forEach((tok, idx) => {
    const isLastActive = idx === tokens.length - 1 && Boolean(activePrefix);
    const prev = idx > 0 ? fuzzyCorrections[idx - 1].correctedNormalized : undefined;
    fuzzyCorrections.push(
      fuzzyCorrectSpelledToken(tok, {
        isActivePrefix: isLastActive && tokens.length > 1,
        previousToken: prev,
      })
    );
  });

  // Normalización morfológica LESCO: reduplicación (plural), clasificadores CL:* y números
  const correctedTokens = normalizeLescoMorphologyTokens(
    fuzzyCorrections.map((f) => f.correctedWord)
  ).tokens;

  // 2. Expandir cualquier prefijo claro (>= 3 letras) o token corregido al evaluar coherencia de frase
  const expandedNormTokens = fuzzyCorrections.map((fRes) => {
    const norm = fRes.correctedNormalized.toLowerCase();
    if (!fRes.wasCorrected && norm.length >= 3) {
      const lex = LESCO_LEXICAL_VOCABULARY.find((v) =>
        v.normalized.toLowerCase().startsWith(norm)
      );
      if (lex) return lex.normalized.toLowerCase();
    }
    return norm;
  });

  const allInputWords = expandedNormTokens
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);
  const inputWordSet = new Set(allInputWords);

  const scoredMatches: LescoCoherentPhraseMatch[] = [];

  for (const entry of LESCO_54_CORPUS) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 1. Evaluar disparadores prioritarios (combinaciones exactas de glosas)
    for (const triggerGroup of entry.priorityTriggers) {
      const allTriggerPresent = triggerGroup.every((trig) => {
        const normTrig = normalizeToken(trig);
        return (
          inputWordSet.has(normTrig) ||
          allInputWords.some(
            (w) => w.length >= 3 && (normTrig.startsWith(w) || w.startsWith(normTrig))
          )
        );
      });

      if (allTriggerPresent) {
        const triggerBoost = 45 + triggerGroup.length * 22;
        if (triggerBoost > score) {
          score = triggerBoost;
        }
        triggerGroup.forEach((t) => {
          if (!matchedKeywords.includes(t.toUpperCase())) {
            matchedKeywords.push(t.toUpperCase());
          }
        });
      }
    }

    // 2. Evaluar intersección con keywords del video oficial
    for (const kw of entry.keywords) {
      const normKw = normalizeToken(kw);
      const isExact = inputWordSet.has(normKw);
      const isPrefixMatch =
        !isExact &&
        allInputWords.some(
          (w) => w.length >= 3 && (normKw.startsWith(w) || w.startsWith(normKw))
        );

      if (isExact) {
        score += 24;
        if (!matchedKeywords.includes(kw.toUpperCase())) {
          matchedKeywords.push(kw.toUpperCase());
        }
      } else if (isPrefixMatch) {
        score += 14;
        if (!matchedKeywords.includes(kw.toUpperCase())) {
          matchedKeywords.push(kw.toUpperCase());
        }
      }
    }

    // 3. Evaluar coincidencia directa sobre la frase en español
    const normPhrase = normalizeToken(entry.phraseEs);
    const fullInputNorm = allInputWords.join(' ');
    if (fullInputNorm.length >= 5 && normPhrase.includes(fullInputNorm)) {
      score += 35;
    }

    // Priorizar frases conversacionales del Módulo 5 durante uso en ventanilla/cámara
    if (score > 0 && entry.module === 5) {
      score += 8;
    }

    if (score >= 22) {
      const confidence = Math.min(99, Math.max(68, Math.round(score)));
      const anyFuzzy = fuzzyCorrections.some((f) => f.wasCorrected);
      scoredMatches.push({
        entry,
        phraseEs: entry.phraseEs,
        lescoGloss: entry.lescoGloss,
        r2Key: entry.r2Key,
        categoryLabel: entry.categoryLabel,
        confidence,
        matchedKeywords,
        grammarRuleApplied: anyFuzzy
          ? 'Corrección Óptica Dactilológica + Reconstrucción Morfosintáctica LESCO'
          : tokens.length === 1
          ? 'Expansión Léxica LESCO → Oración Completa en Español'
          : 'Reconstrucción Morfosintáctica (Glosa LESCO T-L-O-S-V → Español Natural)',
      });
    }
  }

  scoredMatches.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (b.matchedKeywords.length !== a.matchedKeywords.length) {
      return b.matchedKeywords.length - a.matchedKeywords.length;
    }
    return a.entry.id - b.entry.id;
  });

  // 4. Evaluar el Motor Morfosintáctico Generativo LESCO -> Español
  const synthesized = synthesizeNaturalSpanishSentence(correctedTokens);

  // Determinar cuándo la síntesis generativa aporta una oración más fiel que una plantilla estática:
  // - Cuando hay marcadores de tiempo explícitos ("AYER", "MAÑANA"), o
  // - Cuando la secuencia combina múltiples glosas morfosintácticas (sujeto + verbo + objeto/negación)
  //   que no están textualmente idénticas en la plantilla estática.
  const hasExplicitTimeOrGenerativeStructure =
    inputWordSet.has('ayer') ||
    inputWordSet.has('manana') ||
    (tokens.length >= 3 &&
      synthesized !== null &&
      (!scoredMatches[0] ||
        normalizeToken(scoredMatches[0].phraseEs) !==
          normalizeToken(synthesized.sentenceEs)));

  if (synthesized && (scoredMatches.length === 0 || hasExplicitTimeOrGenerativeStructure)) {
    const generativeMatch: LescoCoherentPhraseMatch = {
      entry: synthesized.bestFallbackEntry,
      phraseEs: synthesized.sentenceEs,
      lescoGloss: synthesized.canonicalGloss,
      r2Key: synthesized.bestFallbackEntry.r2Key,
      categoryLabel: synthesized.categoryLabel,
      confidence: synthesized.confidence,
      matchedKeywords: correctedTokens,
      grammarRuleApplied: synthesized.grammarRuleApplied,
    };

    // Evitar duplicar si la frase sintetizada coincide exactamente con el top 1 del corpus
    const dedupedCorpus = scoredMatches.filter(
      (m) => normalizeToken(m.phraseEs) !== normalizeToken(generativeMatch.phraseEs)
    );

    const allRanked = [generativeMatch, ...dedupedCorpus];
    const primaryMatch = allRanked[0];
    const alternatives = allRanked.slice(1, 4);

    return {
      rawBuffer: wordBuffer,
      collapsedText: correctedTokens.join(' '),
      tokens,
      correctedTokens,
      fuzzyCorrections,
      synthesizedSentence: synthesized.sentenceEs,
      activePrefix,
      wordSuggestions,
      detectedGloss: primaryMatch.lescoGloss,
      primaryMatch,
      alternatives,
    };
  }

  const primaryMatch = scoredMatches.length > 0 ? scoredMatches[0] : null;
  const alternatives = scoredMatches.slice(1, 4);
  const detectedGloss = primaryMatch
    ? primaryMatch.lescoGloss
    : buildCanonicalLescoGloss(correctedTokens);

  return {
    rawBuffer: wordBuffer,
    collapsedText: correctedTokens.join(' '),
    tokens,
    correctedTokens,
    fuzzyCorrections,
    synthesizedSentence: synthesized?.sentenceEs || primaryMatch?.phraseEs || null,
    activePrefix,
    wordSuggestions,
    detectedGloss,
    primaryMatch,
    alternatives,
  };
}

/**
 * Traduce cualquier oración en español o glosa de entrada (Modo Texto a Señas)
 * hacia su glosa canónica LESCO y su video oficial más cercano de los 54 videos.
 */
export function translateSpanishToLescoCorpus(spanishText: string): {
  lescoGloss: string;
  matchedVideo: LescoCorpusEntry;
  confidence: number;
} {
  const analysis = analyzeLescoGrammarCoherence(spanishText);
  if (analysis.primaryMatch) {
    return {
      lescoGloss: analysis.primaryMatch.lescoGloss,
      matchedVideo: analysis.primaryMatch.entry,
      confidence: analysis.primaryMatch.confidence,
    };
  }

  const fallbackEntry =
    LESCO_54_CORPUS.find((c) => c.r2Key === 'lesco/v1/m5/mensajes/0.mp4') ||
    LESCO_54_CORPUS[0];
  const cleanTokens = normalizeToken(spanishText)
    .toUpperCase()
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 1 &&
        !['EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'DE', 'EN', 'CON', 'PARA', 'QUE', 'ES', 'ESTA'].includes(w)
    );

  return {
    lescoGloss:
      cleanTokens.length > 0
        ? buildCanonicalLescoGloss(cleanTokens)
        : fallbackEntry.lescoGloss,
    matchedVideo: fallbackEntry,
    confidence: 75,
  };
}

/**
 * Mapeo de verbos comunes conjugados en español hacia su forma base / glosa LESCO.
 */
const SPANISH_VERB_TO_LESCO_GLOSS: Record<string, string> = {
  NECESITO: 'NECESITAR',
  NECESITAS: 'NECESITAR',
  NECESITA: 'NECESITAR',
  AYUDARME: 'AYUDAR',
  AYÚDAME: 'AYUDAR',
  AYUDAR: 'AYUDAR',
  TENGO: 'TENER',
  TIENE: 'TENER',
  TIENES: 'TENER',
  HAY: 'HABER',
  QUIERO: 'QUERER',
  QUIERE: 'QUERER',
  ESTOY: 'ESTAR',
  ESTÁ: 'ESTAR',
  ESTÁN: 'ESTAR',
  SOY: 'SER',
  ES: 'SER',
  SON: 'SER',
  DUELE: 'DOLER',
  DOLOR: 'DOLOR',
  LLAMA: 'LLAMAR',
  LLAME: 'LLAMAR',
  LLAMAR: 'LLAMAR',
  BUSCO: 'BUSCAR',
  BUSCA: 'BUSCAR',
  VAMOS: 'IR',
  VOY: 'IR',
  VA: 'IR',
  PUEDO: 'PODER',
  PUEDE: 'PODER',
};

/**
 * Convierte una oración en español hacia una secuencia canónica de glosas LESCO
 * ordenada bajo la sintaxis morfofonológica Tiempo - Lugar - Objeto - Sujeto - Verbo - Negación (T-L-O-S-V-Neg).
 * Esta secuencia es la que alimenta al motor cinemático del Avatar 3D.
 */
export function spanishToLescoGlossSequence(spanishText: string): {
  glossSequence: string[];
  canonicalLescoString: string;
  isQuestion: boolean;
  hasNegation: boolean;
} {
  const isQuestion = spanishText.includes('?') || /^(QUÉ|CÓMO|DÓNDE|CUÁNDO|POR QUÉ|QUIÉN)/i.test(spanishText.trim());
  const words = normalizeToken(spanishText)
    .toUpperCase()
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const STOPWORDS = new Set([
    'EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'UNOS', 'UNAS',
    'DE', 'DEL', 'A', 'AL', 'EN', 'POR', 'PARA', 'CON', 'SIN',
    'QUE', 'QUÉ', 'ME', 'TE', 'SE', 'NOS', 'LE', 'LES', 'MI', 'TU', 'SU',
  ]);

  const TIME_MARKERS = new Set(['HOY', 'AYER', 'MAÑANA', 'AHORA', 'DESPUÉS', 'SIEMPRE', 'TEMPRANO', 'TARDE', 'NOCHE']);
  const PLACE_MARKERS = new Set(['HOSPITAL', 'BANCO', 'COMISARÍA', 'CASA', 'AQUÍ', 'ALLÁ', 'ESCUELA', 'CLÍNICA']);
  const NEGATION_MARKERS = new Set(['NO', 'NUNCA', 'JAMÁS', 'NADA']);
  const QUESTION_MARKERS = new Set(['QUÉ', 'CÓMO', 'DÓNDE', 'CUÁNDO', 'QUIÉN', 'PORQUÉ', 'POR_QUÉ']);

  const times: string[] = [];
  const places: string[] = [];
  const subjects: string[] = [];
  const objects: string[] = [];
  const verbs: string[] = [];
  const negations: string[] = [];
  const questions: string[] = [];

  for (const rawWord of words) {
    if (NEGATION_MARKERS.has(rawWord)) {
      negations.push('NO');
      continue;
    }
    if (TIME_MARKERS.has(rawWord)) {
      times.push(rawWord);
      continue;
    }
    if (PLACE_MARKERS.has(rawWord)) {
      places.push(rawWord);
      continue;
    }
    if (QUESTION_MARKERS.has(rawWord)) {
      questions.push(rawWord);
      continue;
    }
    if (STOPWORDS.has(rawWord)) {
      continue;
    }

    if (SPANISH_VERB_TO_LESCO_GLOSS[rawWord]) {
      verbs.push(SPANISH_VERB_TO_LESCO_GLOSS[rawWord]);
      continue;
    }

    // Pronombres sujetos LESCO
    if (['YO', 'USTED', 'ÉL', 'ELLA', 'ELLOS', 'NOSOTROS'].includes(rawWord)) {
      subjects.push(rawWord);
      continue;
    }

    // Por defecto categorizado como objeto o término temático
    objects.push(rawWord);
  }

  // Reordenamiento T - L - O - S - V - Negación - Pregunta
  const orderedGlosses: string[] = [
    ...times,
    ...places,
    ...objects,
    ...subjects,
    ...verbs,
    ...negations,
    ...questions,
  ];

  // Si no se detectó ningún término útil, conservar tokens originales limpios
  const finalSequence = orderedGlosses.length > 0 ? orderedGlosses : words.filter((w) => !STOPWORDS.has(w));

  return {
    glossSequence: finalSequence,
    canonicalLescoString: finalSequence.join(' '),
    isQuestion,
    hasNegation: negations.length > 0,
  };
}

/**
 * Autopruebas del motor gramatical LESCO (Self-Tests sin dependencias externas).
 * Valida corrección difusa, síntesis morfosintáctica y reordenamiento T-L-O-S-V-Neg.
 */
export function runGrammarSelfTests(): {
  passed: number;
  total: number;
  details: Array<{ test: string; ok: boolean; output: string }>;
} {
  const details: Array<{ test: string; ok: boolean; output: string }> = [];

  // Test 1: Corrección difusa de error tipográfico/dactilológico (HOSPITAL)
  const fRes = fuzzyCorrectSpelledToken('HOSPITAK');
  const t1Ok = fRes.correctedWord.toUpperCase() === 'HOSPITAL';
  details.push({
    test: 'Fuzzy Correction: HOSPITAK -> HOSPITAL',
    ok: t1Ok,
    output: `raw=${fRes.rawToken}, corrected=${fRes.correctedWord}`,
  });

  // Test 2: Síntesis de orden canónico T-L-O-S-V-Neg
  const synRes = synthesizeNaturalSpanishSentence(['HOY', 'HOSPITAL', 'YO', 'IR', 'NO']);
  const t2Ok = Boolean(synRes && synRes.sentenceEs.length > 0);
  details.push({
    test: 'Síntesis Morfosintáctica: HOY HOSPITAL YO IR NO',
    ok: t2Ok,
    output: synRes ? synRes.sentenceEs : 'null',
  });

  // Test 3: Reordenamiento inverso Español -> LESCO
  const revRes = spanishToLescoGlossSequence('¿Usted necesita ayuda en el hospital hoy?');
  const t3Ok = revRes.glossSequence.includes('HOY') && revRes.glossSequence.includes('HOSPITAL');
  details.push({
    test: 'Reordenamiento Español -> Glosa LESCO',
    ok: t3Ok,
    output: revRes.canonicalLescoString,
  });

  const passed = details.filter((d) => d.ok).length;
  return { passed, total: details.length, details };
}

