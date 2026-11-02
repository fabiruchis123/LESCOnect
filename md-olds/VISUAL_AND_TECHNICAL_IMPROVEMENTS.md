# LESCOnect — Catálogo Maestro de Mejoras Visuales (Deaf-First UI/UX) y Técnicas

> **Lema Oficial:** *"Puente de comunicación e inclusión"*  
> **Estándar:** Deaf-First UX • WCAG AAA • 60fps Native Micro-Interactions • Offline-First R2/Supabase

---

## 1. Resumen Ejecutivo

Este documento consolida el análisis profundo y las mejoras de alto impacto implementadas en los módulos principales de experiencia de usuario (**Inicio**, **Historial** y **Ayuda LESCO**), junto con la hoja de ruta priorizada de vanguardia visual y técnica para **LESCOnect**.

Todas las mejoras respetan la **Paleta Cálida Costarricense** (`#FBF6EE` Crema Cálido, `#B5551A` Terracota Principal, `#5C7A5C` Verde Salvia Inclusión y `#C0392B` Coral/Rojo SOS 9-1-1) y el principio de **Cero Dependencia Auditiva (Zero-Audio Dependency)**.

---

## 2. Mejoras Visuales y Técnicas Implementadas

### 2.1 Módulo Inicio (`src/modules/Home/screens/HomeScreen.tsx`)
1. **Barra de Estado Deaf-First y Modo Offline (`deafStatusStrip`)**:
   - Indicador visual con punto verde de actividad (`54 Videos LESCO • CC Listo`) que confirma visualmente al usuario sordo que el catálogo completo y los subtítulos sincronizados están listos sin depender de alertas auditivas.
2. **Acceso Rápido al Tutorial de Controles de Video (`lesco/v1/m2/2_4.mp4`)**:
   - Incorporación del chip interactivo **`🐢 Controles LESCO`** en el encabezado de inicio para abrir de inmediato el video oficial `2_4.mp4` (*"Usa los controles debajo del video para pausar, repetir la seña las veces que necesites o activar la velocidad lenta (0.5x)..."*) además del video de bienvenida `2_1.mp4`.
3. **Resolución Determinista de `r2Key` en Todos los Accesos**:
   - Vinculación explícita de cada botón de cámara (`📹`) de la pantalla de inicio con su clave oficial en Cloudflare R2 (`2_1.mp4`, `2_2.mp4`, `2_3.mp4`, `2_4.mp4`, `3_1.mp4`, `3_2.mp4`, `7_1.mp4`, `7_2.mp4`), eliminando latencias de búsqueda difusa.
4. **Escalado Tipográfico Dinámico (`useSettingsStore.fontScale`)**:
   - Conexión reactiva con `fontScale` (`0.875x` a `1.5x`) y `vibrationEnabled`, mostrando además un banner de estado accesible cuando el usuario activa una escala personalizada (`🔍 Escala visual 125% / 150% activa`) con acceso directo a los ajustes de Perfil.

### 2.2 Módulo Historial (`src/modules/Historial/screens/HistoryScreen.tsx`)
1. **Doble Acción Primaria por Registro (`📱 Ventanilla` + `🤟 Señas`)**:
   - Cada tarjeta del historial incorpora ahora tanto el botón directo **`📱 Ventanilla`** (abre `VentanillaModal` en pantalla gigante de alto contraste para mostrar al funcionario) como el botón **`🤟 Señas`** (abre `LescoVideoModal` con el video en LESCO y subtítulos `CC` correspondientes a la frase), además de **`🔊 Hablar`** (TTS) y eliminación individual.
2. **Integración del Video Tutorial del Módulo 7 (`lesco/v1/m7/7_1.mp4`)**:
   - Botón `📹 En señas` en la barra superior de navegación que reproduce la guía oficial en LESCO sobre el uso del historial.
3. **Corrección de Codificación UTF-8, Haptics y Escalado `fontScale`**:
   - Saneamiento completo de caracteres acentuados y emojis, escalado dinámico de todas las fuentes mediante `scaleFont(size)` y confirmación háptica (`haptics.light()` / `haptics.medium()`) en filtros, tarjetas, diálogos y modales.

### 2.3 Módulo Ayuda LESCO (`src/modules/Ayuda/screens/HelpScreen.tsx`)
1. **Catálogo Ampliado de Guías Oficiales en LESCO**:
   - Inclusión del tutorial **`🐢 Controles de Video (0.5x y CC)` (`lesco/v1/m2/2_4.mp4`)** y acceso directo al video de soporte **`lesco/v1/m7/7_2.mp4`** desde el banner principal y el encabezado superior, junto con Abecedario (`3_2.mp4`), Saludos (`m5/mensajes/0.mp4`) y Emergencias 9-1-1 (`4_1.mp4`).
2. **Acordeón FAQ Accesible con Retroalimentación Háptica y Escalado Visual**:
   - Preguntas frecuentes actualizadas con estados de accesibilidad (`accessibilityState={{ expanded }}`), respuesta táctil `haptics.light()` en cada interacción y soporte completo para `fontScale`.

---

## 3. Hoja de Ruta Priorizada de Vanguardia (Visual y Técnica)

### Prioridad 1 — Accesibilidad WCAG AAA para Personas Sordas y Sordo-Ciegas
| Mejora Propuesta | Impacto Deaf-First / Sordo-Ciego | Módulo Objetivo |
| :--- | :--- | :--- |
| **Gramática Háptica Diferenciada (Tactile Sign Feedback)** | Patrones de vibración únicos según contexto: pulso doble corto para confirmación (`[40ms, 60ms, 40ms]`), pulso rítmico continuo durante cuenta regresiva SOS 9-1-1, y micro-pulso al cambiar de segmento de subtítulo `CC`. | `src/shared/utils/haptics.ts` |
| **Modo Alto Contraste Nocturno / Sordo-Ciego (WCAG AAA > 10:1)** | Tema opcional de máximo contraste (fondo `#120E0A`, texto `#FFFDF9`, bordes `#F5B041` de `2.5px`) para usuarios con baja visión asociada (Síndrome de Usher). | `src/shared/theme/colors.ts` |
| **Indicador Luminoso deBorde (Edge Flash Alert)** | Destello perimetral suave en color Coral (`#C0392B`) o Salvia (`#5C7A5C`) cuando se completa una traducción por voz o se despacha una alerta SOS. | `Traductor`, `Emergencias` |

### Prioridad 2 — Optimización de Memoria de Video y Motor Multimedia (`expo-video`)
| Mejora Propuesta | Beneficio Técnico | Módulo Objetivo |
| :--- | :--- | :--- |
| ** Instancia Única Reutilizable (`SharedObject` Pool)** | Mantener una única instancia nativa de `useVideoPlayer` en `LescoVideoModal` reutilizada mediante `player.replaceAsync(uri)` evita fugas de decodificadores de hardware (`MediaCodec` en Android / `AVPlayer` en iOS). | `LescoVideoModal.tsx` |
| **Política LRU en Caché de Archivos (`videoCacheService`)** | Límite inteligente de almacenamiento local (p. ej. 150 MB) con preservación garantizada (pinning) de los videos de Emergencia (`m4/*`, `m5/emergencia/*`) y Bienvenida (`m1/*`, `m2/*`). | `videoCacheService.ts` |
| **Pre-fetching Predictivo por Categoría** | Al entrar a una categoría de `Trámites Rápidos` (ej. Hospital), iniciar en segundo plano la descarga del siguiente video de la lista mientras el usuario visualiza el rompehielos `0.mp4`. | `TramitesRapidos` |

### Prioridad 3 — Micro-Interacciones a 60fps y Ergonomía en Ventanilla
| Mejora Propuesta | Beneficio UX | Módulo Objetivo |
| :--- | :--- | :--- |
| **Rotación Automática / Modo Paisaje en `VentanillaModal`** | Permitir girar la tarjeta de texto gigante a horizontal con un solo toque para mostrar frases largas a través de vidrios de atención bancaria o médica. | `VentanillaModal.tsx` |
| **Resaltado de Palabra Clave en Glosa LESCO** | Sincronizar el bloque `SEÑAS EN ESTE VIDEO` con el `currentTime` del reproductor para iluminar la glosa activa al mismo tiempo que el subtítulo `CC`. | `LescoVideoModal.tsx` |
| **Persistencia MMKV del Historial Real** | Conectar las frases utilizadas en `Traductor` y `TramitesRapidos` a un store persistente `useHistoryStore` con `MMKV` para que cada interacción real se agregue automáticamente al historial. | `Historial` |
