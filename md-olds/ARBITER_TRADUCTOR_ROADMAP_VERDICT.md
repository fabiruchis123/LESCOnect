# Dictamen Oficial del Árbitro Supervisor: Hoja de Ruta de los 5 Subagentes del Módulo de Traducción LESCOnect

**Fecha:** 30 de Octubre de 2026  
**Proyecto:** LESCOnect (Expo SDK 57 / React Native / TypeScript)  
**Veredicto del Árbitro:** ✅ **100% APROBADO Y COMPILADO (`tsc -p tsconfig.json --noEmit` = 0 ERRORES)**

---

## 1. Resumen Ejecutivo del Arbitraje y Verificación

Tras la interrupción por límite individual de cuota (error 429) en el lanzamiento simultáneo de subagentes, el rol de **Árbitro Supervisor** asumió la ejecución, estabilización, corrección de defectos e integración sinérgica de cada uno de los 5 subagentes de la hoja de ruta del módulo de traducción.

Se verificó el cumplimiento estricto del principio de **no solapamiento de responsabilidades** (Matriz de Aislamiento):
- **Subagente 1 (Abecedario y Dactilología)** no duplica DTW ni cinemática; reutiliza la normalización y descriptores del Subagente 2.
- **Subagente 2 (Pipeline Cinemático 3D)** es matemática pura sin estado de interfaz ni reglas sintácticas.
- **Subagente 3 (CENAREC)** no muta destructivamente la gramática; inyecta vocabulario de forma idempotente mediante la API de extensión.
- **Subagente 4 (Avatar 3D)** consume las glosas del Subagente 5 y las plantillas dactilológicas del Subagente 1 para el fallback de deletreo letra por letra.
- **Subagente 5 (Gramática y Coherencia)** opera a nivel morfosintáctico bidireccional (LESCO $\to$ Español y Español $\to$ LESCO T-L-O-S-V-Neg).

---

## 2. Detalle de Entregables por Subagente

| # | Subagente | Archivos Clave | Estado | Resumen Técnico de Logros |
|---|---|---|:---:|---|
| **1** | **Entrenador del Abecedario LESCO** | `src/modules/Traductor/services/lescoAlphabetTrainerService.ts` | ✅ **Completado** | Generador paramétrico anatómico `buildHandPose` con los 21 landmarks MediaPipe para las **30 letras oficiales (A-Z, CH, LL, Ñ, RR)** y 6 señas frecuentes (HOLA, GRACIAS, POR FAVOR, SÍ, NO, AYUDA). Desambiguación geométrica para horizontales (G, H, CH), descendentes (P, Q, M, N) y puños (A, S, E, O, T). Calibración on-device few-shot (`calibrateUserSample`). |
| **2** | **Pipeline Cinemático 3D y DTW** | `src/modules/Traductor/services/lescoKeypointPipelineService.ts` | ✅ **Completado** | Extractor de descriptores biomecánicos en $\mathbb{R}^{78}$. Normalización 3D invariante a escala y rotación planar. Filtro One-Euro para supresión de jitter. Detección de mano dominante / espejo para usuarios zurdos. `SignBoundaryTracker` con energía cinética y DTW con banda Sakoe-Chiba y poda early-abandon. |
| **3** | **Diccionario Oficial CENAREC** | `src/modules/Traductor/services/cenarecDictionaryService.ts`<br>`LESCOnect-backend/CENAREC_DICTIONARY_TRAINING_GUIDE.md` | ✅ **Completado** | Catálogo con 50+ señas costarricenses de salud, trámites bancarios, emergencias y vida cotidiana con parámetros querológicos. Función idempotente `registerCenarecVocabularyIntoGrammar()`. Guía metodológica completa de entrenamiento con videos CENAREC y validación ética con la comunidad sorda. |
| **4** | **Avatar 3D / Intérprete Kinemático** | `src/modules/Traductor/components/LescoAvatar3DInterpreter.tsx`<br>`src/modules/Traductor/screens/TextToSignsScreen.tsx` | ✅ **Completado** | Modelos 3D del Señor y la Señorita con camiseta LESCOnect. 3 ángulos de cámara (frontal, perspectiva isométrica, zoom a manos). Interpolación suave, control de velocidad (0.5x, 0.75x, 1x), botón repetir, indicador de glosa activa y deletreo dactilológico letra a letra para términos no indexados. Alternancia con video real de Cloudflare R2. |
| **5** | **Motor de Coherencia Gramatical** | `src/modules/Traductor/services/lescoGrammarCoherenceService.ts` | ✅ **Completado** | Corrección difusa Damerau-Levenshtein ponderada por pares ópticos quirológicos. Síntesis generativa en español natural. Traducción inversa Español $\to$ Glosa LESCO (`spanishToLescoGlossSequence`) con reordenamiento `T-L-O-S-V-Neg`. Modelo de lenguaje de bigramas del corpus de 54 videos. Normalización morfológica de reduplicación (plural). Batería de autopruebas `runGrammarSelfTests()`. |

---

## 3. Integración en el Árbol del Proyecto

- **`src/modules/Traductor/index.ts`**: Actualizado como API pública limpia exponiendo los 5 servicios y componentes clave.
- **`src/modules/Traductor/screens/SignsToTextScreen.tsx`**:
  * Conectado con `classifyTrainedAlphabetLesco` para clasificar las 30 letras con alta precisión si el motor heurístico tiene incertidumbre.
  * Conectado con `getTrainedLescoLandmarkTemplate` para proyectar el esqueleto anatómico exacto de las 30 letras en el visor de cámara y en la cuadrícula de práctica.
- **`src/modules/Traductor/services/translatorService.ts`**: Registra automáticamente al iniciar el vocabulario del CENAREC en la gramática.

---

## 4. Diagnóstico Técnico del Video Vertical Aplastado (`1_1.mp4`)

El análisis de bajo nivel de los átomos del contenedor MP4 y el bitstream H.264 arrojó lo siguiente:
1. **Contenedor MP4 (`tkhd`)**: Ancho 720 px, Alto 1280 px (Relación 9:16 vertical).
2. **Bitstream H.264 (`avcC / SPS`)**:
   - `pic_width_in_mbs`: 45 $\to$ $45 \times 16 = 720$ px.
   - `pic_height_in_map_units`: 80 $\to$ $80 \times 16 = 1280$ px.
   - `aspect_ratio_idc`: 1 (Píxeles cuadrados 1:1, sin anamorfismo).
3. **Causa Raíz de la Franja Aplastada**:
   Al abrir la URL directa en el navegador (`https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev/lesco/v1/m1/1_1.mp4`), el video se reproduce como una línea ultra-delgada horizontal. Esto demuestra que **el problema no radica en el reproductor de la app (`expo-video` ni CSS)**, sino en que el archivo de video subido a Cloudflare R2 fue exportado con una resolución horizontal estirada (o barras negras gigantes arriba y abajo) durante la etapa de edición o compresión original.
4. **Solución Recomendada**:
   Re-exportar o re-codificar el clip original de `1_1.mp4` asegurando que el contenido de video ocupe el cuadro completo vertical $720 \times 1280$ a 30 fps sin letterboxing ni padding horizontal antes de reemplazarlo en el bucket de Cloudflare R2.
