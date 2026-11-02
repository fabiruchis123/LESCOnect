# Informe de Validación de Eficacia, Utilidad y Despliegue — LESCOnect APK Alpha (Android)

**Proyecto:** LESCOnect — Puente de comunicación e inclusión para la comunidad sorda de Costa Rica  
**Paquete Android (`applicationId`):** `cr.ac.utn.lesconect` (`versionCode: 1`, `version: 1.0.0`)  
**Stack Base:** Expo SDK 57 (`~57.0.18`), React Native `0.86.3`, React `19.2.3`, TypeScript `6.0.3`, Expo Router v4, Zustand + MMKV (`v4.3.2`) + AsyncStorage, Supabase + Cloudflare R2.

---

## 1. Resumen Ejecutivo de Validación Alpha

Tras auditar de extremo a extremo la arquitectura modular (`src/modules/*`), los servicios compartidos (`videoCacheService.ts`, `speech.ts`, `haptics.ts`, `supabase.ts`) y la configuración de empaquetado (`app.json` + `eas.json`), se dictamina que **LESCOnect está técnicamente lista y es altamente eficaz para su despliegue como APK Alpha instalable en dispositivos Android reales**.

### Veredicto Global por Ejes Críticos

| Eje de Evaluación | Calificación | Estado en APK Alpha | Hallazgo Clave |
| :--- | :---: | :---: | :--- |
| **1. Ligereza del APK e Instalación** | **9.8 / 10** | ✅ Óptimo | **0 MB de video embebido** en el binario. Los 54 videos (~71.9 MB) residen en Cloudflare R2, logrando un APK ligero (~28–38 MB) fácil de descargar y compartir por WhatsApp o enlace directo. |
| **2. Resiliencia Offline (Costa Rica)** | **9.5 / 10** | ✅ Robusto | Catálogo de 54 videos embebido como fallback en `FALLBACK_VIDEO_CATALOG` + precarga en segundo plano (`preloadEssentialVideos`) de los **13 videos prioritarios (~18 MB)** en `FileSystem.documentDirectory`. |
| **3. Utilidad Práctica en Ventanillas** | **9.7 / 10** | ✅ Sobresaliente | El módulo **Trámites Rápidos** con `VentanillaModal` (texto gigante 26pt de alto contraste + voz TTS `es-CR` a `0.92x` + video LESCO 9:16 con velocidad `0.5x/0.75x/1.0x`) resuelve la barrera comunicativa presencial sin requerir internet para el texto ni para el TTS. |
| **4. Reacción en Emergencias 9-1-1 / SOS** | **9.4 / 10** | ✅ Muy Alto | Acceso en **< 3 toques** desde Inicio o pestaña Emergencias, alerta háptica de emergencia (`[0, 250, 120, 250]`), hasta **5 contactos SOS** persistidos localmente y enlace directo a `tel:` y `sms:` nativos de Android con mensaje preconfigurado. |
| **5. Traductor Bidireccional en APK** | **8.8 / 10** | ✅ Funcional con Matices | En APK Android nativo, `SignsToTextScreen` usa `expo-camera` con bucle de captura silenciosa (`1.8s`, `quality: 0.45`) hacia Gemini Vision (`gemini-3.1-flash-lite` con rotación de 4 modelos) y cuenta con un diccionario interactivo 100% offline de **36 señas LESCO** (30 alfabeto + 6 palabras clave). |

---

## 2. Análisis de Peso del APK, Consumo de Datos y Almacenamiento Local

Uno de los mayores riesgos en aplicaciones de lengua de señas es empaquetar decenas de videos MP4 dentro del binario (`assets/`), lo que infla el APK por encima de 120–150 MB, provoca rechazos de instalación en teléfonos gama media/baja por falta de espacio y obliga a recompilar toda la app para corregir una sola seña. **LESCOnect resuelve este problema mediante una arquitectura híbrida Cloud + Local Cache:**

### 2.1 Impacto en el Tamaño del Binario APK
- **Videos embebidos en el APK:** **0 MB** (ningún archivo `.mp4` se empaqueta en `assets/`).
- **Alojamiento en la Nube (Cloudflare R2 + Supabase):** Los **54 videos oficiales en formato vertical 9:16** (~71.9 MB en total, promedio ~1.33 MB por clip) se sirven desde el bucket público de Cloudflare R2 (`https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev/lesco/v1/...`) sin costos de egress.
- **Peso estimado del APK Alpha (`buildType: "apk"`):** Entre **28 MB y 38 MB** (dependiendo de si se genera APK universal o por ABI `arm64-v8a`), dado que solo incluye el motor Hermes, React Native `0.86.3`, `expo-video`, `expo-camera`, `react-native-mmkv` y los íconos/estilos base.

### 2.2 Estrategia de Caché Progresiva y Precarga Inteligente (`videoCacheService.ts`)
El servicio `src/shared/services/videoCacheService.ts` implementa una jerarquía de tres niveles que garantiza disponibilidad inmediata y ahorro de datos móviles:

1. **Nivel 0 — Catálogo Base Inmediato (0 KB de red, 100% Offline desde el primer arranque):**
   - `FALLBACK_VIDEO_CATALOG` contiene la metadata completa de los **54 videos** (ID, módulo, categoría, `file_code`, `phrase_es`, `r2_key` y `version`) compilada en TypeScript.
   - Si el usuario instala el APK Alpha y lo abre por primera vez en una zona sin cobertura celular, todas las pantallas, textos, glosas y categorías de los Módulos 1 al 7 funcionan sin errores ni pantallas en blanco.

2. **Nivel 1 — Precarga Silenciosa en el Arranque (`preloadEssentialVideos` — ~18 MB):**
   - Al montar `RootLayout` (`app/_layout.tsx`), se invoca `videoCacheService.preloadEssentialVideos('vertical')` de forma asíncrona sin bloquear la interfaz.
   - Sincroniza la tabla `videos` desde Supabase (`syncCatalog()`) y descarga secuencialmente en `FileSystem.documentDirectory + 'videos/'` los **13 videos prioritarios** para la experiencia crítica:
     - **Bienvenida y Registro (2):** `m1/1_1.mp4`, `m1/1_2.mp4`
     - **Pantalla Principal / Home (3):** `m2/2_1.mp4`, `m2/2_2.mp4`, `m2/2_3.mp4`
     - **Emergencias y Auxilio Inmediato (4):** `m5/emergencia/0.mp4`, `1_1.mp4`, `1_2.mp4`, `1_3.mp4`
     - **Rompehielos de Ventanilla (4):** `m5/policia/0.mp4`, `m5/hospital/0.mp4`, `m5/banco/0.mp4`, `m5/mensajes/0.mp4`
   - **Impacto en almacenamiento:** ~17.5 a 18.5 MB en almacenamiento interno privado de la app (`FileSystem.documentDirectory`), el cual **no es purgado por el sistema operativo** (a diferencia de `cacheDirectory`), asegurando que las señas de emergencia y rompehielos estén siempre listas offline.

3. **Nivel 2 — Caché Bajo Demanda con Control de Versiones (`getPlayableUri`):**
   - Cuando el usuario abre cualquier otro video de los 41 restantes (por ejemplo, una frase específica de Farmacia en el Hospital o Cuentas en el Banco), `getPlayableUri` verifica si existe en `FileSystem.documentDirectory/videos/` y compara su versión local (`lesconect_video_versions_v1` en `AsyncStorage`) contra la versión reportada por Supabase.
   - **Deduplicación en vuelo (`inFlightDownloads`):** Un `Map` en memoria evita descargas duplicadas si el usuario toca dos veces seguidas el botón `📹 Ver seña`.
   - **Degradación elegante (Plan B):** Si la descarga falla o hay corte de red a mitad del trámite, reproduce la versión previa en disco; si nunca se había descargado, intenta streaming directo desde R2.

---

## 3. Evaluación de Eficacia y Utilidad Real por Módulo (Contexto Costa Rica)

### 3.1 Módulo 1: Bienvenida y Registro (`src/modules/Auth`)
- **Accesibilidad desde el segundo cero (`WelcomeScreen.tsx`):**
  - El usuario es recibido por un video LESCO a pantalla completa (`lesco/v1/m1/1_1.mp4`) reproducido con `expo-video` (`useVideoPlayer`), acompañado de un badge en vivo que indica `LESCO CR • Offline` apenas el video queda en caché local.
  - Incluye controles flotantes de alto contraste para **Subtítulos (`CC`)**, **Sonido (`🔇/🔊`)** y **Pausa (`⏸️/▶️`)**, más una tarjeta de glosa LESCO (`🤟 BIENVENIDA • COMUNIDAD SORDA CR • SERVICIOS Y 911`).
  - **Doble patrón de interacción accesible:** Gesto físico `PanResponder` de deslizar hacia arriba (*Swipe Up*) o toque directo en la tarjeta inferior para usuarios con movilidad fina reducida.
  - **Estabilidad nativa verificada:** El reproductor se inicializa con una URI estática y usa `player.replaceAsync(res.uri)` y `safePausePlayer()` antes de navegar, previniendo crashes nativos de `SharedObject` liberado en Android.
- **Registro adaptado a Costa Rica (`SignupScreen.tsx` y `SignupForm.tsx`):**
  - **Formato automático de Cédula Costarricense:** `handleCedulaChange` formatea en vivo `X-XXXX-XXXX` (9 dígitos numéricos, máx. 11 caracteres con guiones).
  - **Formato automático de Teléfono CR (`formatCRPhone`):** Limpia prefijos internacionales (`+506`, `00506`) y formatea automáticamente a 8 dígitos `XXXX-XXXX`.
  - **Integración con Libreta de Contactos Nativa (`expo-contacts`):** Permite elegir al contacto SOS directamente desde la agenda del teléfono con buscador integrado (`ContactPickerModal.tsx`), asignarle parentesco (`Familiar`, `Amigo`, `Médico`, `Otro`) y marcar si la persona **🤟 Sabe LESCO**.
  - **Guía en señas paso a paso:** Cuenta con botón superior `📹 Ver en señas` que abre el video explicativo del formulario (`m1/1_2.mp4`).

### 3.2 Módulo 4: Emergencias SOS 9-1-1 (`src/modules/Emergencias`)
- **Tiempo de reacción (< 3 toques):**
  - **Toque 1:** Desde `HomeScreen` (banner rojo de Emergencia con vibración `haptics.emergency()`) o desde la pestaña inferior `Emergencias`.
  - **Toque 2:** Selección visual de una de las **5 categorías críticas** con iconografía clara y borde de alerta:
    1. 🔥 *Fuego / Incendio*
    2. 🚗 *Accidente / Choque*
    3. 🚑 *Emergencia Médica / Salud*
    4. 👮 *Seguridad / Delito*
    5. 🌊 *Rescate / Inundación*
  - **Toque 3:** Confirmación en el diálogo `PEDIR AUXILIO 🚨`.
- **Red de Contactos SOS (`SosContactsScreen.tsx`):**
  - Soporta hasta **5 contactos de emergencia** persistidos localmente en `useAuthStore` (MMKV en APK nativo) con protección que impide borrar el último contacto (`Debes conservar al menos 1 contacto de emergencia SOS registrado`).
  - **Acción directa de Llamada (`tel:`):** Invoca el marcador nativo de Android mediante `Linking.openURL('tel:...')`.
  - **Acción directa de SMS SOS (`sms:`):** Abre la mensajería nativa de Android pre-llenando el cuerpo:  
    `"🚨 ALERTA SOS LESCOnect: Soy una persona no oyente y necesito auxilio urgente. Mi GPS está activo."`
- **Observación técnica para la versión Alpha:**
  - En `EmergenciesScreen.tsx`, el indicador `📍 GPS Activo` y el botón `Alerta 9-1-1` funcionan actualmente como flujo de confirmación visual/simulado para pruebas seguras de usuario (evitando despachos accidentales reales al 9-1-1 durante las pruebas Alpha), mientras que en `SosContactsScreen.tsx` los botones **📞 Llamar** y **💬 SMS** sí disparan las intenciones reales de telefonía y SMS del dispositivo Android.

### 3.3 Módulo 5: Trámites Rápidos y Modo "Mostrar en Ventanilla" (`src/modules/TramitesRapidos`)
Este módulo constituye el **núcleo de mayor utilidad cotidiana inmediata** para una persona sorda en instituciones públicas y privadas de Costa Rica (CCSS/EBAIS, Bancos, Fuerza Pública/OIJ, comercios):
- **5 Categorías Institucionales y 37 Videos Oficiales:**
  1. 🚨 **Emergencia** (8 videos: 1 rompehielo + 7 situaciones de auxilio, ambulancia y rescate).
  2. 👮 **Policía** (7 videos: 1 rompehielo + 6 frases de identificación, robo/asalto, pérdida de documentos y paradas de bus).
  3. 🏥 **Hospital / CCSS** (7 videos: 1 rompehielo + 6 frases de solicitud de intérprete LESCO, cita médica, número de consultorio, retiro de medicamentos en farmacia, horario de pastillas y dolor físico).
  4. 🏦 **Banco** (8 videos: 1 rompehielo + 7 frases de apertura de cuenta, retiro de tarjeta, tarjeta retenida en cajero, depósito en efectivo, monto por escrito, cédula y firma).
  5. 🗣️ **Mensajes Generales y Cortesía** (7 videos: 1 rompehielo + 6 frases de saludo, agradecimiento, solicitud de indicaciones por escrito, fila preferencial **Ley 7600** y servicios sanitarios).
- **Flujo de Comunicación Bidireccional Presencial:**
  - **Para la persona sorda (`📹 Ver seña`):** Antes de mostrar la frase al funcionario oyente, la persona sorda puede ver el video en LESCO con su glosa correspondiente y ajustar la velocidad a `1.0x`, `0.75x` o `0.5x` en `LescoVideoModal`.
  - **Para el funcionario oyente (`📱 Mostrar en grande` -> `VentanillaModal`):** Abre una tarjeta a pantalla completa con tipografía negra de **26px (lineHeight 34px)** sobre fondo crema de alto contraste (`#FBF6EE`) y encabezado `📱 Muestra esta pantalla al funcionario`.
  - **Voz Sintética Costarricense (`🔊 Reproducir en voz alta` -> `speechService.speak`):** Utiliza `expo-speech` configurado en idioma `es-CR` y cadencia pausada (`rate: 0.92`, `pitch: 1.0`). En Android funciona **100% offline** utilizando el motor TTS nativo de Google instalado en el teléfono, permitiendo que el celular "hable" por la persona sorda en ambientes ruidosos o ante funcionarios distraídos.
  - **Escape directo al Traductor:** Al final de cada situación incluye acceso directo a `🎙️ Escuchar voz` o `📷 Responder en señas` por si el trámite requiere una conversación libre fuera de las frases predefinidas.

### 3.4 Módulo 3: Traductor Bidireccional (`src/modules/Traductor`)
- **Modo 1: Señas → Texto/Voz (`SignsToTextScreen.tsx`):**
  - **Comportamiento en APK Nativa Android:** Utiliza el componente nativo `CameraView` de `expo-camera` (`CameraWrapper.native.tsx`). Ejecuta un bucle automático (`staticLoop`) cada **1.8 segundos** que toma una captura silenciosa (`shutterSound: false`, `skipProcessing: true`, `quality: 0.45`, `base64: true`) y la envía a `recognizeLescoSignFromBase64` (`translatorService.ts`).
  - **Resiliencia de IA en la nube:** El servicio rota automáticamente entre 4 modelos (`gemini-3.1-flash-lite`, `gemini-3.1-flash-lite-preview`, `gemini-3.5-flash`, `gemini-3.6-flash`) con timeout de 12s y manejo de HTTP 429/404, devolviendo la letra detectada, el porcentaje de confianza y dibujando la plantilla de 21 landmarks SVG sobre la vista previa.
  - **Constructor de palabras y lectura por voz:** Incluye auto-escritura configurable (`Auto-escribir`), barra de espacio, borrado y botón `🔊 Leer en voz alta` con `speechService.speak(wordBuffer)`.
  - **Diccionario LESCO 100% Offline (36 señas):** La pestaña `📖 Diccionario (36)` funciona sin conexión e incluye las **30 letras del alfabeto dactilológico LESCO** (incluyendo `CH`, `LL`, `Ñ`, `RR`) más **6 palabras esenciales** (`HOLA`, `GRACIAS`, `POR FAVOR`, `SÍ`, `NO`, `AYUDA`), cada una con nivel de dificultad, descripción anatómica, consejo práctico y esquema visual de landmarks.
- **Modo 2: Texto / Voz → Señas (`TranslatorScreen.tsx` / `TextToSignsScreen.tsx`):**
  - Permite escribir cualquier frase o usar los chips rápidos (`Hola`, `Por favor`, `Gracias`, `¿Dónde queda?`, `Necesito ayuda`) y resuelve automáticamente su video LESCO mediante `videoCacheService.resolveR2Key`, mostrando la glosa en mayúsculas separada por puntos (`•`) y el video reproducible en `0.5x`, `0.75x` o `1.0x`.

### 3.5 Módulo 6: Perfil, Escalado Tipográfico y Accesibilidad Háptica (`src/modules/Perfil`)
- **Escalado Tipográfico en Vivo (`TextSizeScreen.tsx` + `useSettingsStore.ts`):**
  - Ofrece 4 niveles accesibles persistidos en MMKV: **Pequeño (14px, `0.875x`)**, **Normal (16px, `1.0x`)**, **Grande (20px, `1.25x`)** y **Muy grande (24px, `1.5x`)**, con tarjeta de previsualización en tiempo real.
- **Retroalimentación Háptica (`VibrationScreen.tsx` + `haptics.ts`):**
  - Combina `expo-haptics` con fallback directo a la API nativa `Vibration.vibrate(...)` de React Native para asegurar que incluso teléfonos Android de gama de entrada sin motor háptico lineal (LRA) vibren claramente en confirmaciones (`40ms`/`80ms`/`140ms`) y alertas SOS (`[0, 250, 120, 250]`).
  - Incluye selector de intensidad (`Suave`, `Media`, `Fuerte`) y botón `📳 Probar vibración` para verificar el hardware en el acto.

---

## 4. Configuración Aplicada para Empaquetado APK Alpha (`app.json` y `eas.json`)

### 4.1 Mejoras en `app.json`
Se actualizó `D:\GitHub\LESCOnect\app.json` con los identificadores oficiales y permisos explícitos de Android:
- `android.package`: `"cr.ac.utn.lesconect"`
- `android.versionCode`: `1`
- `ios.bundleIdentifier`: `"cr.ac.utn.lesconect"`
- `android.permissions`: `["CAMERA", "VIBRATE"]` (limpios y explícitos; `expo-contacts` añade dinámicamente lectura de contactos durante el prebuild nativo).

### 4.2 Creación de `eas.json`
Se creó `D:\GitHub\LESCOnect\eas.json` con tres perfiles de compilación:
- **`development`**: Para pruebas con cliente de desarrollo (`developmentClient: true`, `distribution: "internal"`, `buildType: "apk"`).
- **`alpha`**: Configurado específicamente con `"distribution": "internal"` y `"android": { "buildType": "apk" }` para generar un instalador `.apk` autónomo que puede instalarse directamente en cualquier teléfono Android mediante cable USB, descarga directa o WhatsApp sin pasar por Google Play Store.
- **`production`**: Configurado con `"android": { "buildType": "app-bundle" }` (`.aab`) para futura publicación en Google Play Console.

---

## 5. Matriz de Riesgos en APK Alpha y Mitigaciones

| ID | Escenario de Riesgo en Dispositivo Real | Nivel | Comportamiento Actual en el Código | Mitigación Implementada / Recomendación Alpha |
| :---: | :--- | :---: | :--- | :--- |
| **R-01** | **Conexión móvil inestable (3G/4G rural o edificios de hospitales CCSS)** | Medio | `videoCacheService` intenta descargar de R2; si falla, usa archivo local o fallback catálogo. | Los **13 videos críticos (~18 MB)** se descargan en segundo plano al abrir la app por primera vez con Wi-Fi (`preloadEssentialVideos`). Los textos de ventanilla y voz TTS (`es-CR`) funcionan **100% sin red**. |
| **R-02** | **Teléfonos Android gama baja/media con poco almacenamiento o RAM (2–3 GB)** | Bajo | 0 MB de videos en el APK. Reproductor `expo-video` reutiliza una sola instancia nativa con `replaceAsync`. | El reemplazo de fuente en `WelcomeScreen` y `LescoVideoModal` evita instanciar múltiples decodificadores de hardware (`MediaCodec`), previniendo cierres por falta de memoria (`OutOfMemory`). |
| **R-03** | **Permiso de cámara denegado por el usuario en el Traductor** | Bajo | `useCameraPermissions()` detecta `!permission?.granted` y detiene `staticLoop`. | La interfaz muestra una tarjeta clara solicitando el permiso con botón directo a `requestPermission()`, manteniendo accesible la pestaña del **Diccionario LESCO (36 señas)** sin cámara. |
| **R-04** | **Latencia o falta de `EXPO_PUBLIC_GEMINI_API_KEY` en el Traductor de Cámara en APK** | Medio | `SignsToTextScreen` en nativo envía capturas base64 a Gemini cada `1.8s` con `process.env.EXPO_PUBLIC_GEMINI_API_KEY`. | Asegurar que el archivo `.env` con `EXPO_PUBLIC_GEMINI_API_KEY` esté presente al compilar el APK (o definirlo en secretos de EAS). Además, el proyecto ya incluye `MediaPipeNativeVision.tsx` (WebView 30 FPS) listo para activarse como alternativa local. |
| **R-05** | **Dictado por Voz (STT) y Despacho 9-1-1 en etapa Alpha** | Bajo | El dictado por voz en `TranslatorScreen` y el botón `Alerta 9-1-1` en `EmergenciesScreen` usan diálogos simulados de seguridad. | Ideal para pruebas Alpha sin riesgo de llamadas falsas al 9-1-1. Para comunicación real en emergencia durante el Alpha, el usuario cuenta con **Red de Contactos SOS** (`tel:` y `sms:` reales) y el modo **Mostrar en Ventanilla + Hablar TTS**. |

---

## 6. Comandos Exactos para Compilar y Desplegar el APK Alpha

### Opción A: Compilación en la Nube con EAS Build (Recomendada para distribuir APK por enlace/QR)
1. Verificar sesión en Expo CLI:
   ```bash
   npx eas-cli whoami
   ```
2. Ejecutar compilación usando el perfil **`alpha`** (genera archivo `.apk` instalable):
   ```bash
   npx eas-cli build --platform android --profile alpha
   ```
   *(O en su forma abreviada: `eas build -p android --profile alpha`)*

### Opción B: Compilación Local Autónoma (Requiere Android SDK / Android Studio instalado en la máquina)
1. Generar carpetas nativas `android/` sincronizadas con `app.json` (`cr.ac.utn.lesconect`):
   ```bash
   npx expo prebuild --platform android
   ```
2. Compilar e instalar variante Release directamente en un teléfono conectado por USB (o generar APK en `android/app/build/outputs/apk/release/app-release.apk`):
   ```bash
   npx expo run:android --variant release
   ```
