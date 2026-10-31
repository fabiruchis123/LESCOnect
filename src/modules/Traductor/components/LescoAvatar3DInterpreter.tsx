import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';

export type AvatarGender = 'senor' | 'senorita';
export type CameraAngle3D = 'frontal' | 'perspectiva' | 'zoom_manos';

export type SpatialLocation =
  | 'sien_frente'
  | 'menton_boca'
  | 'pecho'
  | 'espacio_neutro'
  | 'dactilologico';

export type HandShapeConfig =
  | '5'
  | 'A'
  | 'S'
  | '1'
  | 'D'
  | 'L'
  | 'V'
  | 'Y'
  | 'C'
  | 'O'
  | 'F'
  | 'B';

export type SignMovementType =
  | 'oscilante_lateral'
  | 'avance_frontal'
  | 'circular'
  | 'vertical_repetido'
  | 'bimanual_elevacion';

export type NonManualExpression = 'cordial' | 'pregunta' | 'urgencia' | 'neutral';

export interface LescoKinematicSign {
  id: string;
  token: string;
  displayLabel: string;
  location: SpatialLocation;
  locationLabel: string;
  rightHandShape: HandShapeConfig;
  leftHandShape: HandShapeConfig | 'reposo';
  movement: SignMovementType;
  movementLabel: string;
  expression: NonManualExpression;
  expressionLabel: string;
  isFingerspelled?: boolean;
  letter?: string;
}

export interface LescoAvatar3DInterpreterProps {
  /** Género del intérprete de los videos oficiales de LESCOnect */
  avatarGender?: AvatarGender;
  /** Callback opcional cuando el usuario cambia entre El Señor y La Señorita */
  onChangeGender?: (gender: AvatarGender) => void;
  /** Texto libre en español ingresado o dictado por el usuario */
  inputText?: string;
  /** Glosa LESCO estructurada (ej. "HOLA • YO PERSONA SORDA • AYUDA NECESITAR") */
  glossText?: string;
  /** Velocidad de ejecución cinemática */
  playbackRate?: 0.5 | 0.75 | 1.0;
  /** Control de reproducción activa */
  isPlaying?: boolean;
  /** Callback para alternar al modo de Video Real LESCO (.mp4) */
  onSwitchToRealVideo?: () => void;
  /** Indica si existe un video oficial coincidente en el catálogo de 54 videos */
  matchedVideoTitle?: string;
}

interface FingerPose {
  thumb: number; // 0 = cerrado, 1 = abierto
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  spread: number;
}

const HAND_SHAPE_POSES: Record<HandShapeConfig, FingerPose> = {
  '5': { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, spread: 1 },
  B: { thumb: 0.15, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0.15 },
  A: { thumb: 0.85, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1, spread: 0.1 },
  S: { thumb: 0.25, index: 0.08, middle: 0.08, ring: 0.08, pinky: 0.08, spread: 0.05 },
  '1': { thumb: 0.2, index: 1, middle: 0.12, ring: 0.12, pinky: 0.12, spread: 0.2 },
  D: { thumb: 0.45, index: 1, middle: 0.35, ring: 0.35, pinky: 0.35, spread: 0.25 },
  L: { thumb: 1, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1, spread: 0.9 },
  V: { thumb: 0.2, index: 1, middle: 1, ring: 0.12, pinky: 0.12, spread: 0.85 },
  Y: { thumb: 1, index: 0.12, middle: 0.12, ring: 0.12, pinky: 1, spread: 0.95 },
  C: { thumb: 0.65, index: 0.62, middle: 0.62, ring: 0.62, pinky: 0.62, spread: 0.4 },
  O: { thumb: 0.5, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45, spread: 0.15 },
  F: { thumb: 0.48, index: 0.45, middle: 0.98, ring: 0.98, pinky: 0.98, spread: 0.65 },
};

const LETTER_TO_HAND_SHAPE: Record<string, HandShapeConfig> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'S',
  F: 'F',
  G: '1',
  H: 'V',
  I: 'Y',
  J: 'Y',
  K: 'V',
  L: 'L',
  M: 'S',
  N: 'S',
  Ñ: 'V',
  O: 'O',
  P: 'V',
  Q: '1',
  R: 'V',
  S: 'S',
  T: '1',
  U: 'B',
  V: 'V',
  W: '5',
  X: '1',
  Y: 'Y',
  Z: '1',
};

function normalizeToken(raw: string): string {
  return raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:()"']/g, '')
    .trim();
}

/**
 * Clasifica cualquier glosa o palabra en su cinemática espacial LESCO real:
 * ubicación corporal, configuración de 5 dedos articulados, trayectoria y expresión facial.
 */
export function buildKinematicSequence(
  inputText?: string,
  glossText?: string
): LescoKinematicSign[] {
  const source = (glossText && glossText.trim().length > 0 ? glossText : inputText || '').trim();
  const isQuestionContext = /[¿?]/.test(inputText || '') || /[¿?]/.test(glossText || '');
  const isUrgentContext =
    /AUXILIO|EMERGENCIA|PELIGRO|FUEGO|BOMBEROS|AMBULANCIA|DOLOR|HERID|ROBO|ASALTO|911/i.test(
      source
    );

  if (!source) {
    return [
      {
        id: 'default-hola',
        token: 'HOLA',
        displayLabel: 'HOLA',
        location: 'sien_frente',
        locationLabel: 'Sien / Frente',
        rightHandShape: '5',
        leftHandShape: 'reposo',
        movement: 'oscilante_lateral',
        movementLabel: 'Oscilante lateral',
        expression: 'cordial',
        expressionLabel: 'Saludo cordial',
      },
      {
        id: 'default-lesconect',
        token: 'LESCONECT',
        displayLabel: 'LESCONECT',
        location: 'espacio_neutro',
        locationLabel: 'Espacio neutro',
        rightHandShape: 'L',
        leftHandShape: '5',
        movement: 'bimanual_elevacion',
        movementLabel: 'Conexión bimanual',
        expression: 'cordial',
        expressionLabel: 'Expresión cálida',
      },
      {
        id: 'default-ayuda',
        token: 'AYUDA',
        displayLabel: 'AYUDA',
        location: 'espacio_neutro',
        locationLabel: 'Espacio neutro',
        rightHandShape: 'A',
        leftHandShape: '5',
        movement: 'bimanual_elevacion',
        movementLabel: 'Elevación sobre palma',
        expression: 'cordial',
        expressionLabel: 'Atención activa',
      },
    ];
  }

  // Dividir por separadores de glosa (•, /, |) o espacios
  const rawChunks = source
    .replace(/[•/|]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Filtrar conectores gramaticales mudos en LESCO cuando hay más palabras
  const stopWords = new Set(['EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'DE', 'DEL', 'AL', 'Y', 'A', 'EN', 'CON']);
  const filteredChunks =
    rawChunks.length > 2
      ? rawChunks.filter((w) => !stopWords.has(normalizeToken(w)))
      : rawChunks;

  const sequence: LescoKinematicSign[] = [];

  filteredChunks.forEach((rawWord, idx) => {
    const clean = normalizeToken(rawWord);
    if (!clean) return;

    // 1. Sien / Frente: HOLA, PENSAR, SABER, RECORDAR, COMPRENDER, ENTENDER, CONOCER, DOCTOR, MÉDICO
    if (
      ['HOLA', 'PENSAR', 'SABER', 'COMPRENDER', 'ENTENDER', 'IDEA', 'CONOCER', 'POLICIA', 'OFICIAL'].includes(
        clean
      )
    ) {
      sequence.push({
        id: `sign-${idx}-${clean}`,
        token: clean,
        displayLabel: rawWord.toUpperCase(),
        location: 'sien_frente',
        locationLabel: 'Sien / Frente',
        rightHandShape: clean === 'HOLA' ? '5' : clean === 'POLICIA' || clean === 'OFICIAL' ? 'C' : '1',
        leftHandShape: 'reposo',
        movement: clean === 'HOLA' ? 'oscilante_lateral' : 'circular',
        movementLabel: clean === 'HOLA' ? 'Saludo oscilante' : 'Toque en sien',
        expression: isUrgentContext ? 'urgencia' : 'cordial',
        expressionLabel: isUrgentContext ? 'Urgencia LESCO' : 'Saludo cordial',
      });
      return;
    }

    // 2. Mentón / Boca: GRACIAS, BUENOS, DÍAS, TARDES, COMER, HABLAR, SORDO, SORDA, DECIR, AGUA, PASTILLAS, MEDICAMENTOS
    if (
      [
        'GRACIAS',
        'MUCHAS',
        'BUENOS',
        'BUENAS',
        'DIAS',
        'TARDES',
        'COMER',
        'HABLAR',
        'SORDO',
        'SORDA',
        'PASTILLAS',
        'MEDICAMENTOS',
        'ESCUCHAR',
      ].includes(clean)
    ) {
      const isDeafSign = clean === 'SORDO' || clean === 'SORDA' || clean === 'ESCUCHAR';
      sequence.push({
        id: `sign-${idx}-${clean}`,
        token: clean,
        displayLabel: rawWord.toUpperCase(),
        location: 'menton_boca',
        locationLabel: 'Mentón / Boca',
        rightHandShape: isDeafSign ? '1' : clean === 'PASTILLAS' ? 'F' : 'B',
        leftHandShape: clean === 'BUENOS' || clean === 'BUENAS' ? 'B' : 'reposo',
        movement: isDeafSign ? 'oscilante_lateral' : 'avance_frontal',
        movementLabel: isDeafSign ? 'Índice oído → mentón' : 'Avance frontal desde mentón',
        expression: 'cordial',
        expressionLabel: 'Expresión cordial',
      });
      return;
    }

    // 3. Pecho: POR, FAVOR, YO, MI, MÍA, MÍOS, SENTIR, CORAZÓN, DOLOR, PACIENCIA, PELIGRO, MIEDO, PERSONA
    if (
      [
        'POR',
        'FAVOR',
        'YO',
        'MI',
        'MIA',
        'MIOS',
        'SENTIR',
        'CORAZON',
        'DOLOR',
        'DUELE',
        'PACIENCIA',
        'PELIGRO',
        'HERIDA',
        'HERIDO',
        'VICTIMA',
      ].includes(clean)
    ) {
      const isPainOrEmergency = ['DOLOR', 'DUELE', 'PELIGRO', 'HERIDA', 'HERIDO', 'VICTIMA'].includes(
        clean
      );
      sequence.push({
        id: `sign-${idx}-${clean}`,
        token: clean,
        displayLabel: rawWord.toUpperCase(),
        location: 'pecho',
        locationLabel: 'Pecho / Torso',
        rightHandShape: clean === 'YO' ? '1' : isPainOrEmergency ? '5' : 'B',
        leftHandShape: isPainOrEmergency ? '5' : 'reposo',
        movement: isPainOrEmergency ? 'vertical_repetido' : 'circular',
        movementLabel: isPainOrEmergency ? 'Tensión sobre pecho' : 'Rotación circular en pecho',
        expression: isPainOrEmergency || isUrgentContext ? 'urgencia' : 'cordial',
        expressionLabel: isPainOrEmergency ? 'Expresión de dolor/urgencia' : 'Cortesía LESCO',
      });
      return;
    }

    // 4. Preguntas LESCO: DÓNDE, QUÉ, CUÁNDO, CÓMO, QUIÉN, CUÁL, PODRÍA, PUEDE
    if (
      [
        'DONDE',
        'QUE',
        'CUANDO',
        'COMO',
        'QUIEN',
        'CUAL',
        'PODRIA',
        'PUEDE',
        'CONSULTA',
        'PREGUNTA',
      ].includes(clean)
    ) {
      sequence.push({
        id: `sign-${idx}-${clean}`,
        token: clean,
        displayLabel: `¿${clean}?`,
        location: 'espacio_neutro',
        locationLabel: 'Espacio neutro',
        rightHandShape: clean === 'DONDE' ? '5' : '1',
        leftHandShape: '5',
        movement: 'oscilante_lateral',
        movementLabel: 'Oscilación interrogativa',
        expression: 'pregunta',
        expressionLabel: 'Cejas elevadas (¿...?)',
      });
      return;
    }

    // 5. Emergencias y Servicios en Espacio Neutro: AYUDA, AUXILIO, BANCO, HOSPITAL, CÉDULA, TARJETA, FUEGO, BOMBEROS, AMBULANCIA, ESCRIBIR, DOCUMENTO
    const knownNeutralLexicon = new Set([
      'AYUDA',
      'AUXILIO',
      'URGENTE',
      'BANCO',
      'HOSPITAL',
      'CEDULA',
      'IDENTIDAD',
      'TARJETA',
      'CAJERO',
      'CUENTA',
      'AHORROS',
      'DEPOSITO',
      'EFECTIVO',
      'DINERO',
      'PAPEL',
      'MONTO',
      'FIRMAR',
      'DOCUMENTO',
      'DOCUMENTOS',
      'TRAMITE',
      'REALIZAR',
      'VENIR',
      'ABRIR',
      'RETIRAR',
      'BLOQUEAR',
      'ESCRIBIR',
      'ESCRIBA',
      'INDICACIONES',
      'REPETIR',
      'FILA',
      'PREFERENCIAL',
      'SANITARIOS',
      'BANO',
      'FUEGO',
      'HUMO',
      'BOMBEROS',
      'AMBULANCIA',
      'LLAMAR',
      'CONTACTOS',
      'EMERGENCIA',
      'ATENCION',
      'MEDICA',
      'DOCTOR',
      'MEDICO',
      'INTERPRETE',
      'LESCO',
      'LESCONECT',
      'CITA',
      'HOY',
      'CONSULTORIO',
      'NUMERO',
      'RECETA',
      'FARMACIA',
      'HORARIOS',
      'ROBO',
      'ASALTO',
      'PERDER',
      'PERDI',
      'PARADA',
      'BUSES',
      'SI',
      'NO',
      'NECESITAR',
      'NECESITO',
      'AQUI',
    ]);

    if (knownNeutralLexicon.has(clean)) {
      const isHelpOrUrgent = [
        'AYUDA',
        'AUXILIO',
        'URGENTE',
        'FUEGO',
        'HUMO',
        'BOMBEROS',
        'AMBULANCIA',
        'EMERGENCIA',
        'ROBO',
        'ASALTO',
      ].includes(clean);

      let rightShape: HandShapeConfig = '5';
      let leftShape: HandShapeConfig | 'reposo' = '5';
      let mov: SignMovementType = 'bimanual_elevacion';
      let movLabel = 'Ejecución bimanual';

      if (clean === 'AYUDA' || clean === 'AUXILIO') {
        rightShape = 'A';
        leftShape = '5';
        mov = 'bimanual_elevacion';
        movLabel = 'Puño "A" sobre palma elevándose';
      } else if (clean === 'CEDULA' || clean === 'TARJETA' || clean === 'BANCO') {
        rightShape = 'C';
        leftShape = 'B';
        mov = 'avance_frontal';
        movLabel = 'Muestra de documento "C"';
      } else if (clean === 'HOSPITAL' || clean === 'DOCTOR' || clean === 'MEDICA' || clean === 'CITA') {
        rightShape = 'V';
        leftShape = 'B';
        mov = 'vertical_repetido';
        movLabel = 'Cruz de salud sobre antebrazo';
      } else if (clean === 'ESCRIBIR' || clean === 'ESCRIBA' || clean === 'FIRMAR' || clean === 'PAPEL') {
        rightShape = 'F';
        leftShape = 'B';
        mov = 'oscilante_lateral';
        movLabel = 'Trazo de escritura sobre palma';
      } else if (clean === 'FUEGO' || clean === 'BOMBEROS' || clean === 'HUMO') {
        rightShape = '5';
        leftShape = '5';
        mov = 'vertical_repetido';
        movLabel = 'Llamas ascendentes bimanuales';
      } else if (clean === 'LESCO' || clean === 'LESCONECT' || clean === 'INTERPRETE') {
        rightShape = 'L';
        leftShape = 'L';
        mov = 'circular';
        movLabel = 'Rotación alternada en "L"';
      } else if (clean === 'NO') {
        rightShape = 'V';
        leftShape = 'reposo';
        mov = 'oscilante_lateral';
        movLabel = 'Pinza negativa LESCO';
      } else if (clean === 'SI' || clean === 'NECESITAR' || clean === 'NECESITO') {
        rightShape = 'A';
        leftShape = 'reposo';
        mov = 'vertical_repetido';
        movLabel = 'Asentimiento vertical';
      }

      sequence.push({
        id: `sign-${idx}-${clean}`,
        token: clean,
        displayLabel: rawWord.toUpperCase(),
        location: 'espacio_neutro',
        locationLabel: 'Espacio neutro',
        rightHandShape: rightShape,
        leftHandShape: leftShape,
        movement: mov,
        movementLabel: movLabel,
        expression: isHelpOrUrgent || isUrgentContext
          ? 'urgencia'
          : isQuestionContext
          ? 'pregunta'
          : 'cordial',
        expressionLabel:
          isHelpOrUrgent || isUrgentContext
            ? 'Expresión de urgencia'
            : isQuestionContext
            ? 'Cejas elevadas (¿...?)'
            : 'Expresión natural LESCO',
      });
      return;
    }

    // 6. Cualquier palabra libre / nombre propio fuera del diccionario léxico:
    // Primero se presenta la palabra y se ejecuta deletreo dactilológico letra por letra (A-Z)
    const letters = clean.replace(/[^A-ZÑ]/g, '').split('').slice(0, 8);
    if (letters.length === 0) return;

    letters.forEach((char, charIdx) => {
      const shape = LETTER_TO_HAND_SHAPE[char] || '5';
      sequence.push({
        id: `dactyl-${idx}-${charIdx}-${char}`,
        token: `${clean} [${char}]`,
        displayLabel: `${rawWord.toUpperCase()} (${char})`,
        location: 'dactilologico',
        locationLabel: 'Zona dactilológica',
        rightHandShape: shape,
        leftHandShape: 'reposo',
        movement: 'avance_frontal',
        movementLabel: `Deletreo LESCO letra "${char}"`,
        expression: isQuestionContext ? 'pregunta' : 'neutral',
        expressionLabel: isQuestionContext ? 'Interrogación LESCO' : 'Foco dactilológico',
        isFingerspelled: true,
        letter: char,
      });
    });
  });

  return sequence.length > 0 ? sequence : buildKinematicSequence(undefined, undefined);
}

/**
 * Renderiza una mano articulada en 3D con sus 21 puntos anatómicos (muñeca + 4 articulaciones por cada uno de los 5 dedos)
 * y sombreado volumétrico realista sobre el SVG.
 */
function renderArticulatedHand21Points(params: {
  side: 'left' | 'right';
  cx: number;
  cy: number;
  shape: HandShapeConfig;
  scale: number;
  rotationDeg: number;
  skinBase: string;
  skinHighlight: string;
  skinShadow: string;
  showJointsOverlay: boolean;
}) {
  const {
    side,
    cx,
    cy,
    shape,
    scale,
    rotationDeg,
    skinBase,
    skinHighlight,
    skinShadow,
    showJointsOverlay,
  } = params;

  const pose = HAND_SHAPE_POSES[shape] || HAND_SHAPE_POSES['5'];
  const dir = side === 'right' ? 1 : -1;

  // Coordenadas relativas a la muñeca (Punto 0)
  const wristX = 0;
  const wristY = 12;

  // Nudillos base (MCP: Puntos 1, 5, 9, 13, 17)
  const spreadFactor = 4.5 + pose.spread * 3.5;
  const fingerSpecs = [
    {
      name: 'index',
      ext: pose.index,
      baseX: -1.4 * spreadFactor * dir,
      baseY: -9,
      len: 21,
      angleRad: -0.22 * pose.spread * dir,
      width: 5.2,
    },
    {
      name: 'middle',
      ext: pose.middle,
      baseX: -0.45 * spreadFactor * dir,
      baseY: -11,
      len: 23.5,
      angleRad: -0.05 * pose.spread * dir,
      width: 5.4,
    },
    {
      name: 'ring',
      ext: pose.ring,
      baseX: 0.55 * spreadFactor * dir,
      baseY: -10,
      len: 21.5,
      angleRad: 0.1 * pose.spread * dir,
      width: 5.0,
    },
    {
      name: 'pinky',
      ext: pose.pinky,
      baseX: 1.45 * spreadFactor * dir,
      baseY: -7.5,
      len: 17.5,
      angleRad: 0.28 * pose.spread * dir,
      width: 4.5,
    },
  ];

  // Pulgar articulado (Puntos 1, 2, 3, 4)
  const thumbExt = pose.thumb;
  const thumbMcpX = -13.5 * dir;
  const thumbMcpY = 2;
  const thumbIpX = thumbMcpX + (-8 * thumbExt + 3 * (1 - thumbExt)) * dir;
  const thumbIpY = thumbMcpY - (6 + 5 * thumbExt);
  const thumbTipX = thumbIpX + (-7 * thumbExt + 5 * (1 - thumbExt)) * dir;
  const thumbTipY = thumbIpY - (6 * thumbExt - 2 * (1 - thumbExt));

  const jointPoints: Array<{ x: number; y: number; isTip?: boolean }> = [
    { x: wristX, y: wristY }, // 0: Muñeca
    { x: thumbMcpX, y: thumbMcpY }, // 1: CMC/MCP Pulgar
    { x: (thumbMcpX + thumbIpX) / 2, y: (thumbMcpY + thumbIpY) / 2 }, // 2: MCP Pulgar
    { x: thumbIpX, y: thumbIpY }, // 3: IP Pulgar
    { x: thumbTipX, y: thumbTipY, isTip: true }, // 4: Punta Pulgar
  ];

  const fingerPaths: Array<{
    key: string;
    mcpX: number;
    mcpY: number;
    pipX: number;
    pipY: number;
    dipX: number;
    dipY: number;
    tipX: number;
    tipY: number;
    width: number;
    ext: number;
  }> = [];

  fingerSpecs.forEach((f) => {
    // Cuando el dedo se flexiona (ext -> 0), las falanges se pliegan hacia la palma
    const effectiveLen = f.len * (0.28 + 0.72 * f.ext);
    const sinA = Math.sin(f.angleRad);
    const cosA = Math.cos(f.angleRad);

    const pipX = f.baseX + sinA * (effectiveLen * 0.38);
    const pipY = f.baseY - cosA * (effectiveLen * 0.38);

    const dipX = f.baseX + sinA * (effectiveLen * 0.72);
    const dipY =
      f.ext < 0.35
        ? f.baseY - 2.5
        : f.baseY - cosA * (effectiveLen * 0.72);

    const tipX = f.baseX + sinA * effectiveLen;
    const tipY =
      f.ext < 0.35
        ? f.baseY + 2.8
        : f.baseY - cosA * effectiveLen;

    jointPoints.push(
      { x: f.baseX, y: f.baseY }, // MCP
      { x: pipX, y: pipY }, // PIP
      { x: dipX, y: dipY }, // DIP
      { x: tipX, y: tipY, isTip: true } // TIP
    );

    fingerPaths.push({
      key: f.name,
      mcpX: f.baseX,
      mcpY: f.baseY,
      pipX,
      pipY,
      dipX,
      dipY,
      tipX,
      tipY,
      width: f.width,
      ext: f.ext,
    });
  });

  return (
    <G
      transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${scale.toFixed(2)}) rotate(${rotationDeg.toFixed(1)})`}
    >
      {/* Sombra proyectada 3D de la mano */}
      <Ellipse cx={2 * dir} cy={4} rx={16} ry={17} fill="rgba(0,0,0,0.28)" />

      {/* Volumen de la Palma 3D */}
      <Path
        d="M -12 11 C -15 2, -14 -9, -10 -12 L 10 -12 C 14 -9, 15 2, 12 11 Z"
        fill={skinBase}
        stroke={skinShadow}
        strokeWidth={1.2}
      />
      {/* Iluminación central de la palma */}
      <Ellipse cx={-1 * dir} cy={0} rx={8.5} ry={7.5} fill={skinHighlight} opacity={0.45} />

      {/* 4 Dedos Articulados */}
      {fingerPaths.map((fp) => (
        <G key={fp.key}>
          <Path
            d={`M ${fp.mcpX.toFixed(1)} ${fp.mcpY.toFixed(1)} Q ${fp.pipX.toFixed(1)} ${fp.pipY.toFixed(1)} ${fp.tipX.toFixed(1)} ${fp.tipY.toFixed(1)}`}
            stroke={skinShadow}
            strokeWidth={fp.width + 1.6}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M ${fp.mcpX.toFixed(1)} ${fp.mcpY.toFixed(1)} Q ${fp.pipX.toFixed(1)} ${fp.pipY.toFixed(1)} ${fp.tipX.toFixed(1)} ${fp.tipY.toFixed(1)}`}
            stroke={skinBase}
            strokeWidth={fp.width}
            strokeLinecap="round"
            fill="none"
          />
          {/* Pliegue de falange para realismo 3D */}
          <Circle cx={fp.pipX} cy={fp.pipY} r={1.6} fill={skinHighlight} opacity={0.6} />
          <Circle cx={fp.tipX} cy={fp.tipY} r={1.9} fill={skinHighlight} opacity={0.85} />
        </G>
      ))}

      {/* Pulgar Articulado (3 Falanges) */}
      <Path
        d={`M ${thumbMcpX.toFixed(1)} ${thumbMcpY.toFixed(1)} Q ${thumbIpX.toFixed(1)} ${thumbIpY.toFixed(1)} ${thumbTipX.toFixed(1)} ${thumbTipY.toFixed(1)}`}
        stroke={skinShadow}
        strokeWidth={7.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M ${thumbMcpX.toFixed(1)} ${thumbMcpY.toFixed(1)} Q ${thumbIpX.toFixed(1)} ${thumbIpY.toFixed(1)} ${thumbTipX.toFixed(1)} ${thumbTipY.toFixed(1)}`}
        stroke={skinBase}
        strokeWidth={5.6}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={thumbTipX} cy={thumbTipY} r={2} fill={skinHighlight} opacity={0.85} />

      {/* Malla Cinemática de 21 Puntos (MediaPipe Hand Rig) */}
      {showJointsOverlay &&
        jointPoints.map((pt, idx) => (
          <Circle
            key={`joint-${side}-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={pt.isTip ? 2.1 : 1.45}
            fill={pt.isTip ? '#F5B041' : '#5EEAD4'}
            stroke="#0F172A"
            strokeWidth={0.5}
            opacity={0.92}
          />
        ))}
    </G>
  );
}

export const LescoAvatar3DInterpreter: React.FC<LescoAvatar3DInterpreterProps> = ({
  avatarGender: propGender = 'senorita',
  onChangeGender,
  inputText = '',
  glossText = '',
  playbackRate = 1.0,
  isPlaying: externalPlaying = true,
  onSwitchToRealVideo,
  matchedVideoTitle,
}) => {
  const [selectedGender, setSelectedGender] = useState<AvatarGender>(propGender);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle3D>('frontal');
  const [show21PointsRig, setShow21PointsRig] = useState<boolean>(true);
  const [currentSignIndex, setCurrentSignIndex] = useState<number>(0);
  const [phase, setPhase] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [internalPlaying, setInternalPlaying] = useState<boolean>(externalPlaying);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedGender(propGender);
  }, [propGender]);

  useEffect(() => {
    setInternalPlaying(externalPlaying);
  }, [externalPlaying]);

  const glossSequence = useMemo(
    () => buildKinematicSequence(inputText, glossText),
    [inputText, glossText]
  );

  // Reiniciar al primer signo cuando cambia la frase o glosa
  useEffect(() => {
    setCurrentSignIndex(0);
    setPhase(0);
  }, [glossSequence]);

  // Motor de animación a 60fps compatible con Android/iOS y Web
  useEffect(() => {
    if (!internalPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let mounted = true;
    lastFrameRef.current = Date.now();

    const tick = () => {
      if (!mounted) return;
      const now = Date.now();
      const dt = Math.min(64, now - lastFrameRef.current);
      lastFrameRef.current = now;

      // Duración base por seña (~1.65s a 1.0x, ~0.95s para deletreo individual)
      const currentSign = glossSequence[currentSignIndex] || glossSequence[0];
      const baseDurationMs = currentSign?.isFingerspelled ? 980 : 1650;
      const effectiveDurationMs = baseDurationMs / playbackRate;

      setPhase((prev) => {
        const next = prev + dt / effectiveDurationMs;
        if (next >= 1) {
          setCurrentSignIndex((prevIdx) => (prevIdx + 1) % glossSequence.length);
          return 0;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [internalPlaying, playbackRate, glossSequence, currentSignIndex]);

  // Parpadeo natural cada 3.4 segundos (Rasgo No Manual LESCO)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 3400);
    return () => clearInterval(blinkInterval);
  }, []);

  const currentSign: LescoKinematicSign =
    glossSequence[currentSignIndex] || glossSequence[0];

  const handleSelectGender = (gender: AvatarGender) => {
    haptics.light();
    setSelectedGender(gender);
    onChangeGender?.(gender);
  };

  const handleSelectCamera = (angle: CameraAngle3D) => {
    haptics.light();
    setCameraAngle(angle);
  };

  // ============================================================================
  // PROYECCIÓN 3D PERSPECTIVA Y PARALAJE MULTICAPA
  // ============================================================================
  const yawDeg = cameraAngle === 'perspectiva' ? 25 : 0;
  const yawRad = (yawDeg * Math.PI) / 180;
  const parallaxX = Math.sin(yawRad) * 18;
  const breathOffset = Math.sin(phase * Math.PI * 2) * 1.8;

  // Transformación de cámara (Frontal 0°, Perspectiva 3D +25°, Zoom Manos)
  const stageScale = cameraAngle === 'zoom_manos' ? 1.34 : cameraAngle === 'perspectiva' ? 1.04 : 1.0;
  const stageTranslateY = cameraAngle === 'zoom_manos' ? -36 : 0;
  const stageTranslateX = cameraAngle === 'perspectiva' ? -6 : 0;

  // Coordenadas espaciales objetivo de la mano derecha e izquierda según la ubicación LESCO
  const waveSin = Math.sin(phase * Math.PI * 4);
  const waveCos = Math.cos(phase * Math.PI * 4);
  const pulseLift = Math.sin(phase * Math.PI * 2);

  let rightTargetX = 112;
  let rightTargetY = 175;
  let rightHandRot = -12;

  let leftTargetX = 188;
  let leftTargetY = 212;
  let leftHandRot = 14;

  switch (currentSign.location) {
    case 'sien_frente':
      rightTargetX = 104 - parallaxX * 0.6;
      rightTargetY = 82;
      rightHandRot = -18;
      break;
    case 'menton_boca':
      rightTargetX = 136 - parallaxX * 0.5;
      rightTargetY = 122;
      rightHandRot = -8;
      break;
    case 'pecho':
      rightTargetX = 142 - parallaxX * 0.4;
      rightTargetY = 166;
      rightHandRot = -22;
      break;
    case 'dactilologico':
      rightTargetX = 108 - parallaxX * 0.5;
      rightTargetY = 136;
      rightHandRot = -6;
      break;
    case 'espacio_neutro':
    default:
      rightTargetX = 118 - parallaxX * 0.45;
      rightTargetY = 168;
      rightHandRot = -10;
      break;
  }

  // Aplicar trayectoria cinemática del movimiento LESCO
  switch (currentSign.movement) {
    case 'oscilante_lateral':
      rightTargetX += waveSin * 12;
      rightHandRot += waveSin * 16;
      break;
    case 'avance_frontal':
      rightTargetY += pulseLift * 10;
      rightTargetX -= pulseLift * 6;
      break;
    case 'circular':
      rightTargetX += waveCos * 9;
      rightTargetY += waveSin * 8;
      rightHandRot += waveSin * 10;
      break;
    case 'vertical_repetido':
      rightTargetY += waveSin * 11;
      break;
    case 'bimanual_elevacion':
      rightTargetY -= Math.abs(pulseLift) * 14;
      break;
  }

  // Posición de la mano izquierda (activa en señas bimanuales o en postura de reposo natural)
  const isLeftActive = currentSign.leftHandShape !== 'reposo';
  if (isLeftActive) {
    leftTargetX = 172 - parallaxX * 0.35 + (currentSign.movement === 'oscilante_lateral' ? -waveSin * 10 : 0);
    leftTargetY =
      currentSign.location === 'pecho'
        ? 172 + waveSin * 6
        : 176 - (currentSign.movement === 'bimanual_elevacion' ? Math.abs(pulseLift) * 12 : 0);
    leftHandRot = 14 - waveSin * 10;
  } else {
    leftTargetX = 198 + parallaxX * 0.25;
    leftTargetY = 224 + breathOffset;
    leftHandRot = 18;
  }

  // Cinemática Inversa (IK) de 2 segmentos para Hombros -> Codos -> Muñecas
  const isSenor = selectedGender === 'senor';
  const shoulderRightX = (isSenor ? 94 : 102) + parallaxX * 0.25;
  const shoulderRightY = 152 + breathOffset;
  const shoulderLeftX = (isSenor ? 206 : 198) + parallaxX * 0.25;
  const shoulderLeftY = 152 + breathOffset;

  const elbowRightX = (shoulderRightX + rightTargetX) * 0.5 - 18;
  const elbowRightY = Math.max(shoulderRightY + 34, (shoulderRightY + rightTargetY) * 0.5 + 24);

  const elbowLeftX = (shoulderLeftX + leftTargetX) * 0.5 + 18;
  const elbowLeftY = Math.max(shoulderLeftY + 34, (shoulderLeftY + leftTargetY) * 0.5 + 24);

  // Paleta de piel con sombreado 3D cálido (Fiel al Señor y la Señorita de los videos tutoriales)
  const skinBase = isSenor ? '#D59B72' : '#E8B896';
  const skinHighlight = isSenor ? '#EAC09E' : '#F7D7BE';
  const skinShadow = isSenor ? '#A66E46' : '#BE8A66';

  // Rasgos No Manuales (Expresión Facial LESCO)
  const eyebrowLift =
    currentSign.expression === 'pregunta'
      ? -4.5
      : currentSign.expression === 'urgencia'
      ? 2.5
      : -1.0;

  return (
    <View style={styles.wrapper}>
      {/* Barra Superior del Estudio 3D: Selector Señor / Señorita + Ángulo de Cámara */}
      <View style={styles.topControlsContainer}>
        {/* Selector de Intérprete Oficial */}
        <View style={styles.genderToggleRow}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              selectedGender === 'senor' && styles.genderBtnActive,
            ]}
            onPress={() => handleSelectGender('senor')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar intérprete Señor de los videos tutoriales"
          >
            <Text style={styles.genderEmoji}>👨🏽‍🏫</Text>
            <Text
              style={[
                styles.genderBtnText,
                selectedGender === 'senor' && styles.genderBtnTextActive,
              ]}
            >
              Señor (Intérprete)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderBtn,
              selectedGender === 'senorita' && styles.genderBtnActive,
            ]}
            onPress={() => handleSelectGender('senorita')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar intérprete Señorita de los videos tutoriales"
          >
            <Text style={styles.genderEmoji}>👩🏻‍🏫</Text>
            <Text
              style={[
                styles.genderBtnText,
                selectedGender === 'senorita' && styles.genderBtnTextActive,
              ]}
            >
              Señorita (Intérprete)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controles de Ángulo de Cámara 3D + Rig 21 Puntos */}
        <View style={styles.cameraAngleRow}>
          {(
            [
              { id: 'frontal', label: 'Frontal 0°' },
              { id: 'perspectiva', label: 'Perspectiva 3D +25°' },
              { id: 'zoom_manos', label: 'Zoom Manos' },
            ] as const
          ).map((cam) => (
            <TouchableOpacity
              key={cam.id}
              style={[
                styles.cameraChip,
                cameraAngle === cam.id && styles.cameraChipActive,
              ]}
              onPress={() => handleSelectCamera(cam.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cameraChipText,
                  cameraAngle === cam.id && styles.cameraChipTextActive,
                ]}
              >
                {cam.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.rigBadgeBtn,
              show21PointsRig && styles.rigBadgeBtnActive,
            ]}
            onPress={() => {
              haptics.light();
              setShow21PointsRig((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.rigBadgeText,
                show21PointsRig && styles.rigBadgeTextActive,
              ]}
            >
              21 Pts 3D
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Escenario de Estudio con Iluminación Volumétrica 3D */}
      <View style={styles.viewportBox}>
        <Svg width="100%" height="100%" viewBox="0 0 300 280">
          <Defs>
            {/* Iluminación de estudio de los videos tutoriales de LESCOnect */}
            <RadialGradient id="studioGlow" cx="50%" cy="38%" rx="58%" ry="58%">
              <Stop offset="0%" stopColor="#334155" stopOpacity="0.95" />
              <Stop offset="55%" stopColor="#1E293B" stopOpacity="0.98" />
              <Stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
            </RadialGradient>

            <RadialGradient id="terracottaRim" cx="50%" cy="22%" rx="45%" ry="40%">
              <Stop offset="0%" stopColor="#B5551A" stopOpacity="0.32" />
              <Stop offset="100%" stopColor="#B5551A" stopOpacity="0" />
            </RadialGradient>

            <LinearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#262930" />
              <Stop offset="50%" stopColor="#17191E" />
              <Stop offset="100%" stopColor="#0D0F12" />
            </LinearGradient>

            <LinearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#2C221E" />
              <Stop offset="100%" stopColor="#140F0D" />
            </LinearGradient>
          </Defs>

          {/* Fondo de Estudio Oficial */}
          <Rect x="0" y="0" width="300" height="280" fill="url(#studioGlow)" />
          <Ellipse cx={150 - parallaxX * 0.5} cy={95} rx={125} ry={95} fill="url(#terracottaRim)" />

          {/* Grilla de Perspectiva 3D en el Piso del Estudio */}
          <G opacity={0.22}>
            <Path
              d={`M ${30 - parallaxX} 265 L ${270 - parallaxX} 265`}
              stroke="#94A3B8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <Path
              d={`M ${65 + parallaxX * 0.4} 240 L ${235 + parallaxX * 0.4} 240`}
              stroke="#64748B"
              strokeWidth="0.8"
            />
          </G>

          {/* Grupo Principal con Transformación de Cámara 3D */}
          <G
            transform={`translate(150, 140) scale(${stageScale}) translate(${
              -150 + stageTranslateX
            }, ${-140 + stageTranslateY})`}
          >
            {/* 1. CABELLO POSTERIOR (La Señorita lleva el cabello largo recogido detrás de los hombros para despejar 100% la zona de señas) */}
            {!isSenor && (
              <G transform={`translate(${-parallaxX * 0.55}, ${breathOffset * 0.6})`}>
                <Path
                  d="M 116 74 C 102 98, 104 134, 114 152 L 186 152 C 196 134, 198 98, 184 74 Z"
                  fill="url(#hairGrad)"
                />
                {/* Moño/recogido posterior alto de intérprete LESCO */}
                <Circle cx={150 + parallaxX * 0.35} cy={52} r={16} fill="#181210" />
              </G>
            )}

            {/* 2. CUELLO Y SOMBRA DE BARBILLA (Despejado para señas en mentón/garganta) */}
            <G transform={`translate(${-parallaxX * 0.35}, ${breathOffset * 0.8})`}>
              <Rect
                x={isSenor ? 135 : 138}
                y={108}
                width={isSenor ? 30 : 24}
                height={34}
                rx={10}
                fill={skinBase}
              />
              <Path
                d={
                  isSenor
                    ? 'M 135 112 Q 150 124 165 112 L 165 125 Q 150 132 135 125 Z'
                    : 'M 138 112 Q 150 122 162 112 L 162 123 Q 150 130 138 123 Z'
                }
                fill={skinShadow}
                opacity={0.55}
              />
            </G>

            {/* 3. TORSO Y CAMISETA OFICIAL NEGRA CON EMBLEMA DE MANOS LESCONECT */}
            <G transform={`translate(${-parallaxX * 0.25}, ${breathOffset})`}>
              {/* Silueta de hombros (anchos en el Señor, estilizados en la Señorita) */}
              <Path
                d={
                  isSenor
                    ? 'M 78 275 L 84 156 C 86 138, 112 132, 134 132 L 166 132 C 188 132, 214 138, 216 156 L 222 275 Z'
                    : 'M 88 275 L 94 158 C 96 140, 118 134, 136 134 L 164 134 C 182 134, 204 140, 206 158 L 212 275 Z'
                }
                fill="url(#shirtGrad)"
                stroke="#334155"
                strokeWidth="1.2"
              />

              {/* Cuello de la camiseta oficial + escote limpio */}
              <Path
                d={
                  isSenor
                    ? 'M 131 132 Q 150 148 169 132'
                    : 'M 133 134 Q 150 152 167 134'
                }
                fill={skinBase}
                stroke="#B5551A"
                strokeWidth="2"
              />

              {/* Pliegues volumétricos 3D en el pecho */}
              <Path
                d="M 112 158 Q 124 195 118 245"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
                fill="none"
              />
              <Path
                d="M 188 158 Q 176 195 182 245"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2.5"
                fill="none"
              />

              {/* Emblema Oficial LESCOnect en el Pecho */}
              <G transform={`translate(${150 - parallaxX * 0.15}, 182)`}>
                <Circle
                  cx="0"
                  cy="0"
                  r="15"
                  fill="#1E293B"
                  stroke="#B5551A"
                  strokeWidth="1.5"
                />
                {/* Manos entrelazadas del isotipo LESCOnect */}
                <Path
                  d="M -6 3 C -8 -2, -4 -7, 0 -4 C 4 -7, 8 -2, 6 3 C 4 7, -4 7, -6 3 Z"
                  fill="#B5551A"
                />
                <Circle cx="-3" cy="-5" r="1.5" fill="#FBF6EE" />
                <Circle cx="3" cy="-5" r="1.5" fill="#5C7A5C" />
                <SvgText
                  x="0"
                  y="24"
                  fill="#EAE0D0"
                  fontSize="6.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.6"
                >
                  LESCOnect
                </SvgText>
              </G>
            </G>

            {/* 4. CABEZA Y ROSTRO EXPRESIVO 3D (RASGOS NO MANUALES LESCO) */}
            <G transform={`translate(${-parallaxX * 0.5}, ${breathOffset * 0.7})`}>
              {/* Orejas (y aretes sutiles en la Señorita) */}
              <Ellipse cx="115" cy="84" rx="5" ry="9" fill={skinShadow} />
              <Ellipse cx="185" cy="84" rx="5" ry="9" fill={skinShadow} />
              {!isSenor && (
                <>
                  <Circle cx="114" cy="93" r="2.3" fill="#F5B041" />
                  <Circle cx="186" cy="93" r="2.3" fill="#F5B041" />
                </>
              )}

              {/* Contorno craneal y mandíbula (masculina definida vs femenina cálida) */}
              <Path
                d={
                  isSenor
                    ? 'M 117 68 C 117 42, 183 42, 183 68 C 183 92, 176 112, 150 116 C 124 112, 117 92, 117 68 Z'
                    : 'M 119 69 C 119 44, 181 44, 181 69 C 181 92, 172 111, 150 115 C 128 111, 119 92, 119 69 Z'
                }
                fill={skinBase}
                stroke={skinShadow}
                strokeWidth="1.1"
              />

              {/* Iluminación 3D en pómulos y frente */}
              <Ellipse cx={142 - parallaxX * 0.15} cy={72} rx={21} ry={18} fill={skinHighlight} opacity={0.32} />

              {/* Cabello Superior */}
              {isSenor ? (
                /* El Señor: corte degradado limpio masculino */
                <Path
                  d="M 116 70 C 115 44, 132 36, 150 36 C 168 36, 185 44, 184 70 C 180 56, 168 51, 150 51 C 132 51, 120 56, 116 70 Z"
                  fill="url(#hairGrad)"
                />
              ) : (
                /* La Señorita: cabello peinado con raya suave hacia atrás de las orejas */
                <Path
                  d="M 117 74 C 116 44, 134 37, 150 37 C 166 37, 184 44, 183 74 C 177 56, 162 50, 148 52 C 133 53, 122 60, 117 74 Z"
                  fill="url(#hairGrad)"
                />
              )}

              {/* Cejas Expresivas (Rasgo No Manual clave en preguntas y urgencias LESCO) */}
              <Path
                d={`M ${127 - parallaxX * 0.15} ${67 + eyebrowLift} Q ${136 - parallaxX * 0.15} ${
                  62 + eyebrowLift
                } ${144 - parallaxX * 0.15} ${66 + (currentSign.expression === 'urgencia' ? 2 : eyebrowLift)}`}
                stroke="#1F1612"
                strokeWidth={isSenor ? 3.1 : 2.4}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={`M ${156 - parallaxX * 0.15} ${
                  66 + (currentSign.expression === 'urgencia' ? 2 : eyebrowLift)
                } Q ${164 - parallaxX * 0.15} ${62 + eyebrowLift} ${173 - parallaxX * 0.15} ${
                  67 + eyebrowLift
                }`}
                stroke="#1F1612"
                strokeWidth={isSenor ? 3.1 : 2.4}
                strokeLinecap="round"
                fill="none"
              />

              {/* Ojos con parpadeo natural */}
              {isBlinking ? (
                <>
                  <Path
                    d={`M ${130 - parallaxX * 0.15} 77 Q ${136 - parallaxX * 0.15} 79 ${
                      142 - parallaxX * 0.15
                    } 77`}
                    stroke="#1F1612"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d={`M ${158 - parallaxX * 0.15} 77 Q ${164 - parallaxX * 0.15} 79 ${
                      170 - parallaxX * 0.15
                    } 77`}
                    stroke="#1F1612"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : (
                <>
                  <Ellipse cx={136 - parallaxX * 0.15} cy={76} rx={5.2} ry={3.4} fill="#FFFFFF" />
                  <Circle cx={136 - parallaxX * 0.2} cy={76} r={2.4} fill="#2B1D14" />
                  <Circle cx={135 - parallaxX * 0.2} cy={75} r={0.9} fill="#FFFFFF" />

                  <Ellipse cx={164 - parallaxX * 0.15} cy={76} rx={5.2} ry={3.4} fill="#FFFFFF" />
                  <Circle cx={164 - parallaxX * 0.2} cy={76} r={2.4} fill="#2B1D14" />
                  <Circle cx={163 - parallaxX * 0.2} cy={75} r={0.9} fill="#FFFFFF" />
                </>
              )}

              {/* Nariz con relieve 3D */}
              <Path
                d={`M ${150 - parallaxX * 0.22} 76 L ${148 - parallaxX * 0.28} 89 Q ${
                  150 - parallaxX * 0.22
                } 91 ${153 - parallaxX * 0.2} 89`}
                stroke={skinShadow}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Boca expresiva según el Rasgo No Manual LESCO */}
              {currentSign.expression === 'urgencia' ? (
                <Ellipse
                  cx={150 - parallaxX * 0.18}
                  cy={99}
                  rx={6.5}
                  ry={4.2}
                  fill="#7F1D1D"
                  stroke={skinShadow}
                  strokeWidth="1"
                />
              ) : currentSign.expression === 'pregunta' ? (
                <Path
                  d={`M ${142 - parallaxX * 0.18} 99 Q ${150 - parallaxX * 0.18} 102 ${
                    158 - parallaxX * 0.18
                  } 98`}
                  stroke={isSenor ? '#6E3B2B' : '#B85D52'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <Path
                  d={`M ${140 - parallaxX * 0.18} 97 Q ${150 - parallaxX * 0.18} 104 ${
                    160 - parallaxX * 0.18
                  } 97`}
                  stroke={isSenor ? '#6E3B2B' : '#B85D52'}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </G>

            {/* 5. BRAZO Y MANO IZQUIERDA ARTICULADA (21 PUNTOS) */}
            <G>
              {/* Brazo superior izquierdo (manga corta oficial + piel) */}
              <Path
                d={`M ${shoulderLeftX.toFixed(1)} ${shoulderLeftY.toFixed(1)} L ${elbowLeftX.toFixed(
                  1
                )} ${elbowLeftY.toFixed(1)}`}
                stroke="#14161B"
                strokeWidth={isSenor ? 22 : 19}
                strokeLinecap="round"
              />
              {/* Antebrazo izquierdo */}
              <Path
                d={`M ${elbowLeftX.toFixed(1)} ${elbowLeftY.toFixed(1)} L ${leftTargetX.toFixed(
                  1
                )} ${leftTargetY.toFixed(1)}`}
                stroke={skinShadow}
                strokeWidth={isSenor ? 16.5 : 14.5}
                strokeLinecap="round"
              />
              <Path
                d={`M ${elbowLeftX.toFixed(1)} ${elbowLeftY.toFixed(1)} L ${leftTargetX.toFixed(
                  1
                )} ${leftTargetY.toFixed(1)}`}
                stroke={skinBase}
                strokeWidth={isSenor ? 14 : 12}
                strokeLinecap="round"
              />

              {renderArticulatedHand21Points({
                side: 'left',
                cx: leftTargetX,
                cy: leftTargetY,
                shape:
                  currentSign.leftHandShape === 'reposo'
                    ? 'B'
                    : currentSign.leftHandShape,
                scale: 0.92,
                rotationDeg: leftHandRot,
                skinBase,
                skinHighlight,
                skinShadow,
                showJointsOverlay: show21PointsRig,
              })}
            </G>

            {/* 6. ESTELA DE TRAYECTORIA CINEMÁTICA LESCO */}
            <Path
              d={`M ${(rightTargetX - 16).toFixed(1)} ${(rightTargetY + 8).toFixed(
                1
              )} Q ${rightTargetX.toFixed(1)} ${(rightTargetY - 14).toFixed(1)} ${(
                rightTargetX + 16
              ).toFixed(1)} ${(rightTargetY + 6).toFixed(1)}`}
              stroke="#F5B041"
              strokeWidth="2"
              strokeDasharray="3 3"
              fill="none"
              opacity={0.75}
            />

            {/* 7. BRAZO Y MANO DERECHA DOMINANTE ARTICULADA (21 PUNTOS) */}
            <G>
              {/* Brazo superior derecho */}
              <Path
                d={`M ${shoulderRightX.toFixed(1)} ${shoulderRightY.toFixed(
                  1
                )} L ${elbowRightX.toFixed(1)} ${elbowRightY.toFixed(1)}`}
                stroke="#14161B"
                strokeWidth={isSenor ? 22 : 19}
                strokeLinecap="round"
              />
              {/* Antebrazo derecho con sombreado 3D */}
              <Path
                d={`M ${elbowRightX.toFixed(1)} ${elbowRightY.toFixed(1)} L ${rightTargetX.toFixed(
                  1
                )} ${rightTargetY.toFixed(1)}`}
                stroke={skinShadow}
                strokeWidth={isSenor ? 17 : 15}
                strokeLinecap="round"
              />
              <Path
                d={`M ${elbowRightX.toFixed(1)} ${elbowRightY.toFixed(1)} L ${rightTargetX.toFixed(
                  1
                )} ${rightTargetY.toFixed(1)}`}
                stroke={skinBase}
                strokeWidth={isSenor ? 14.5 : 12.5}
                strokeLinecap="round"
              />

              {renderArticulatedHand21Points({
                side: 'right',
                cx: rightTargetX,
                cy: rightTargetY,
                shape: currentSign.rightHandShape,
                scale: 1.05,
                rotationDeg: rightHandRot,
                skinBase,
                skinHighlight,
                skinShadow,
                showJointsOverlay: show21PointsRig,
              })}
            </G>
          </G>
        </Svg>

        {/* HUD Superior Izquierdo: Seña Activa y Configuración Manual */}
        <View style={styles.hudTopLeft} pointerEvents="none">
          <View style={styles.liveBadgeRow}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>
              MOTOR 3D 60FPS • {currentSignIndex + 1}/{glossSequence.length}
            </Text>
          </View>
          <Text style={styles.hudActiveSignText}>{currentSign.displayLabel}</Text>
          <Text style={styles.hudMetaText}>
            ✋ Mano &apos;{currentSign.rightHandShape}&apos; • 📍 {currentSign.locationLabel}
          </Text>
        </View>

        {/* HUD Inferior dentro del Viewport: Movimiento + Rasgo Facial + Pausa */}
        <View style={styles.hudBottomBar}>
          <View style={styles.hudSpecPills}>
            <View style={styles.hudSpecPill}>
              <Text style={styles.hudSpecPillText}>〰️ {currentSign.movementLabel}</Text>
            </View>
            <View style={styles.hudSpecPill}>
              <Text style={styles.hudSpecPillText}>😊 {currentSign.expressionLabel}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.hudPlayPauseBtn}
            onPress={() => {
              haptics.light();
              setInternalPlaying((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.hudPlayPauseText}>{internalPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Línea de Tiempo de Glosas Activas (Resaltando en Terracota #B5551A la seña exacta en ejecución) */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineHeaderTitle}>
            LÍNEA DE TIEMPO DE GLOSAS LESCO EN VIVO
          </Text>
          {onSwitchToRealVideo && (
            <TouchableOpacity
              style={styles.switchVideoPill}
              onPress={() => {
                haptics.medium();
                onSwitchToRealVideo();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.switchVideoPillText}>
                🎬 Ver Video Oficial{matchedVideoTitle ? '' : ' LESCO'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineChipsScroll}
        >
          {glossSequence.map((item, idx) => {
            const isActive = idx === currentSignIndex;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.glossStepChip,
                  isActive && styles.glossStepChipActive,
                ]}
                onPress={() => {
                  haptics.light();
                  setCurrentSignIndex(idx);
                  setPhase(0);
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.glossStepToken,
                    isActive && styles.glossStepTokenActive,
                  ]}
                >
                  {item.displayLabel}
                </Text>
                <Text
                  style={[
                    styles.glossStepSub,
                    isActive && styles.glossStepSubActive,
                  ]}
                >
                  Mano &apos;{item.rightHandShape}&apos; • {item.locationLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  topControlsContainer: {
    backgroundColor: '#18130E',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: '#33291F',
    gap: 6,
  },
  genderToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  genderBtnActive: {
    backgroundColor: Colors.primary.main,
    borderColor: '#F5B041',
  },
  genderEmoji: {
    fontSize: 15,
  },
  genderBtnText: {
    fontSize: 11.5,
    fontWeight: Typography.weights.bold,
    color: 'rgba(251, 246, 238, 0.78)',
  },
  genderBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.black,
  },
  cameraAngleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  cameraChip: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraChipActive: {
    backgroundColor: Colors.secondary.main,
  },
  cameraChipText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.bold,
    color: 'rgba(251, 246, 238, 0.72)',
  },
  cameraChipTextActive: {
    color: '#FFFFFF',
  },
  rigBadgeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  rigBadgeBtnActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.45)',
    borderColor: '#5EEAD4',
  },
  rigBadgeText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.bold,
    color: 'rgba(251, 246, 238, 0.65)',
  },
  rigBadgeTextActive: {
    color: '#5EEAD4',
  },
  viewportBox: {
    width: '100%',
    height: 276,
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#33291F',
  },
  hudTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 176, 65, 0.35)',
    maxWidth: '68%',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5B041',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F5B041',
    letterSpacing: 0.4,
  },
  hudActiveSignText: {
    fontSize: 15,
    fontWeight: Typography.weights.black,
    color: '#FFFFFF',
  },
  hudMetaText: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: '#EAE0D0',
    marginTop: 1,
  },
  hudBottomBar: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  hudSpecPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  hudSpecPill: {
    backgroundColor: 'rgba(24, 19, 14, 0.84)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(234, 224, 208, 0.22)',
  },
  hudSpecPillText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.bold,
    color: '#FBF6EE',
  },
  hudPlayPauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5B041',
  },
  hudPlayPauseText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
  },
  timelineCard: {
    backgroundColor: '#231C15',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderTopWidth: 1,
    borderColor: '#33291F',
    ...Shadows.card,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  timelineHeaderTitle: {
    fontSize: 9.5,
    fontWeight: Typography.weights.black,
    color: '#E6B08A',
    letterSpacing: 0.5,
    flex: 1,
  },
  switchVideoPill: {
    backgroundColor: 'rgba(92, 122, 92, 0.28)',
    borderWidth: 1,
    borderColor: '#5C7A5C',
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  switchVideoPillText: {
    fontSize: 9.5,
    fontWeight: Typography.weights.bold,
    color: '#EBF2EB',
  },
  timelineChipsScroll: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: Spacing.sm,
  },
  glossStepChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 224, 208, 0.16)',
  },
  glossStepChipActive: {
    backgroundColor: '#B5551A',
    borderColor: '#F5B041',
  },
  glossStepToken: {
    fontSize: 11.5,
    fontWeight: Typography.weights.black,
    color: '#FBF6EE',
  },
  glossStepTokenActive: {
    color: '#FFFFFF',
  },
  glossStepSub: {
    fontSize: 9,
    fontWeight: Typography.weights.medium,
    color: 'rgba(251, 246, 238, 0.68)',
    marginTop: 1,
  },
  glossStepSubActive: {
    color: '#FBF6EE',
    fontWeight: Typography.weights.bold,
  },
});
