# Auditoría Oficial de Ubicación Exacta de los 54 Videos LESCO (PDF vs Aplicación)

**Documento de referencia auditado:** `C:\Users\cfmor\Downloads\Frases_Grabacion_LESCOnect (1).pdf` (*Guía de Diálogos y Frases para Grabación en LESCO — Lista oficial de textos organizados por módulos y situaciones para interpretación en Lengua de Señas Costarricense*).  
**Catálogo técnico sincronizado:** `FALLBACK_VIDEO_CATALOG` (`src/shared/services/videoCacheService.ts`) + Cloudflare R2 (`lesco/v1/...`).

---

## Resumen Ejecutivo de la Auditoría

- **Total de videos en el PDF oficial:** **54 videos** distribuidos en **7 módulos** (Módulo 1: `4`, Módulo 2: `4`, Módulo 3: `2`, Módulo 4: `2`, Módulo 5: `37`, Módulo 6: `3`, Módulo 7: `2`).
- **Coincidencia de frases (`phrase_es`) y claves (`r2_key`):** **54 / 54 (100% exactos)**.
- **Mejoras y disparadores activados durante esta auditoría:**
  1. **Video `1_3.mp4` (Selector de Fecha de Nacimiento - DatePicker):** Se añadió el botón accesible `📹 Ver en señas` junto al campo **Fecha de nacimiento** tanto en `SignupForm.tsx` como en `EditProfileScreen.tsx`.
  2. **Video `1_4.mp4` (Selector de Contacto de Emergencia SOS - ContactPicker):** Se activó el botón `📹 Ver en señas` en la barra superior de `SosContactsScreen.tsx` y se añadió el botón `📹 Señas` en el encabezado de la tarjeta **Contacto SOS** tanto en `SignupForm.tsx` como en `EditProfileScreen.tsx`.
  3. **Videos `2_2.mp4` y `2_4.mp4` (Tarjeta Principal del Traductor y Controles del Reproductor de Video):** Se aseguró el mapeo explícito en `videoCacheService.resolveR2Key` y su inclusión en la precarga prioritaria (`preloadEssentialVideos`).
  4. **Videos `4_1.mp4` y `4_2.mp4` (Centro de Emergencias / Botón SOS y Conexión y Despacho con el 911):** Se agregó la barra de guías en señas en la parte superior de `EmergenciesScreen.tsx` (`📹 Botón SOS en señas` para `4_1.mp4` y `📹 Despacho 911 en señas` para `4_2.mp4`) y se corrigió `resolveR2Key` para distinguir `4_1.mp4` de `4_2.mp4`.
  5. **Video `6_1.mp4` (Edición de Perfil de Usuario):** Se añadió el botón `📹 Ver en señas` en la barra superior de `EditProfileScreen.tsx` (además del acceso ya existente en `ProfileScreen.tsx`).

---

## Tabla Maestra de los 54 Videos del PDF Oficial

### 1. MÓDULO: BIENVENIDA, REGISTRO Y CONFIGURACIÓN (4 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **1.1** (`1_1`) | Pantalla de Bienvenida (Welcome Screen) | *"¡Hola! Te damos la bienvenida a LESCOnect, la aplicación pensada para romper barreras y conectar a la comunidad sorda de Costa Rica con servicios esenciales y emergencias. Desliza hacia arriba para comenzar."* | `lesco/v1/m1/1_1.mp4` | `WelcomeScreen.tsx` — Reproducción automática a pantalla completa con controles de subtítulos (`CC`), sonido y pausa. | ✅ Validado 100% |
| 2 | **1.2** (`1_2`) | Formulario de Registro de Usuario (Signup Screen) | *"Para crear tu perfil, escribe tu nombre y apellidos, tu número de cédula nacional y tu número de teléfono. Estos datos permitirán identificarte de forma segura en caso de emergencia."* | `lesco/v1/m1/1_2.mp4` | `SignupScreen.tsx` — Botón superior derecho `📹 Ver en señas`. | ✅ Validado 100% |
| 3 | **1.3** (`1_3`) | Selector de Fecha de Nacimiento (DatePicker) | *"Toca el campo de fecha de nacimiento. En el calendario emergente, elige primero tu año, luego el mes y finalmente presiona 'Guardar Fecha'."* | `lesco/v1/m1/1_3.mp4` | `SignupForm.tsx` y `EditProfileScreen.tsx` — Botón `📹 Ver en señas` junto a la etiqueta del campo **Fecha de nacimiento**. | ✅ Activado y Validado |
| 4 | **1.4** (`1_4`) | Selector de Contacto de Emergencia SOS (ContactPicker) | *"En la tarjeta de emergencia, toca el botón 'Mis contactos' para seleccionar a un familiar o amigo desde tu teléfono. Selecciona el tipo de parentesco y marca si esa persona sabe LESCO."* | `lesco/v1/m1/1_4.mp4` | `SignupForm.tsx` (encabezado tarjeta `🚨 Contacto SOS` botón `📹 Señas`), `SosContactsScreen.tsx` (barra superior `📹 Ver en señas`) y `EditProfileScreen.tsx` (encabezado tarjeta `🚨 Contacto SOS` botón `📹 Señas`). | ✅ Activado y Validado |

---

### 2. MÓDULO: PANTALLA PRINCIPAL Y NAVEGACIÓN (4 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 5 | **2.1** (`2_1`) | Encabezado y Barra Superior (Home Header) | *"En la barra superior verás tu nombre y foto de perfil. Puedes presionar el botón de cámara 'Ver en señas' en cualquier momento para ver videos explicativos como este."* | `lesco/v1/m2/2_1.mp4` | `HomeScreen.tsx` → `HomeHeader.tsx` — Botón `📹` en la esquina superior derecha junto al avatar del perfil. | ✅ Validado 100% |
| 6 | **2.2** (`2_2`) | Tarjeta Principal del Traductor (Translator Hero) | *"Esta tarjeta te lleva directamente al Traductor. Presiona el botón del micrófono si una persona oyente quiere hablarte, o escribe para generar señas en video."* | `lesco/v1/m2/2_2.mp4` | `HomeScreen.tsx` → `TranslatorHeroCard.tsx` y `videoCacheService.resolveR2Key` (`Tarjeta Principal del Traductor` / `Translator Hero`). | ✅ Validado 100% |
| 7 | **2.3** (`2_3`) | Banner de Emergencia Rápida (Emergency Banner) | *"En situaciones de peligro inminente, toca el banner rojo de emergencia para acceder de inmediato al botón de pánico y a tus contactos de auxilio."* | `lesco/v1/m2/2_3.mp4` | `HomeScreen.tsx` → `EmergencyBanner.tsx` — Botón `📹` dentro del banner rojo de **Emergencias**. | ✅ Validado 100% |
| 8 | **2.4** (`2_4`) | Controles del Reproductor de Video (Lesco Video Player) | *"Usa los controles debajo del video para pausar, repetir la seña las veces que necesites o activar la velocidad lenta (0.5x) para aprender cada detalle del movimiento."* | `lesco/v1/m2/2_4.mp4` | `LescoVideoModal.tsx` y `videoCacheService.resolveR2Key` (`Controles del Reproductor de Video` / `Lesco Video Player`). | ✅ Validado 100% |

---

### 3. MÓDULO: TRADUCTOR Y COMUNICACIÓN (2 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 9 | **3.1** (`3_1`) | Modo Texto y Voz a Señas (TextToSigns) | *"Presiona el botón de micrófono para que la persona oyente hable, o usa el teclado para escribir. La aplicación transformará las palabras en glosa LESCO y te mostrará el video con la seña correspondiente."* | `lesco/v1/m3/3_1.mp4` | `TranslatorScreen.tsx` (pestaña `💬 Texto → Señas` / acción **Traducir a señas**) y `TranslatorHeroCard.tsx` (botón `📹` en **Voz a Señas**). | ✅ Validado 100% |
| 10 | **3.2** (`3_2`) | Modo Señas a Texto por Cámara (SignsToText) | *"Coloca tu teléfono frente a ti con buena iluminación. Realiza las señas del abecedario LESCO con claridad; el sistema detectará tus manos y escribirá las letras automáticamente."* | `lesco/v1/m3/3_2.mp4` | `TranslatorScreen.tsx` (pestaña `📷 Señas → Texto` / `SignsToTextScreen.tsx`), `TranslatorHeroCard.tsx` (botón `📹` en **Señas a Voz**) y `HelpScreen.tsx` (tarjeta **Abecedario Dactilológico**). | ✅ Validado 100% |

---

### 4. MÓDULO: EMERGENCIAS Y AUXILIO SOS (2 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 11 | **4.1** (`4_1`) | Centro de Emergencias y Botón de Pánico SOS (Emergencies Screen) | *"Mantén presionado el botón rojo SOS durante 2 segundos. Se activará una alerta silenciosa que enviará un SMS con tu ubicación GPS exacta a tus contactos de auxilio."* | `lesco/v1/m4/4_1.mp4` | `EmergenciesScreen.tsx` (botón superior `📹 Botón SOS en señas`) y `HelpScreen.tsx` (tarjeta **Señas de Emergencia 9-1-1**). | ✅ Activado y Validado |
| 12 | **4.2** (`4_2`) | Conexión y Despacho con el 911 (Dispatch 911) | *"Al conectar con el 911, la aplicación comparte automáticamente tu condición de persona sorda, tu ubicación GPS y si requieres ambulancia, policía o bomberos."* | `lesco/v1/m4/4_2.mp4` | `EmergenciesScreen.tsx` (botón superior `📹 Despacho 911 en señas`). | ✅ Activado y Validado |

---

### 5. MÓDULO: TRÁMITES RÁPIDOS Y VENTANILLAS INSTITUCIONALES (37 videos)

#### 5.1 Categoría: Emergencia y Auxilio (Rojo) — 8 videos

| # | Código PDF | Situación / Orden | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Botón en la App (`QuickMessagesScreen.tsx` y `tramitesData.ts`) | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 13 | **5.1-0** (`0`) | Frase Rompehielo Inicial | *"¡Atención! Soy una persona sorda y necesito auxilio urgente."* | `lesco/v1/m5/emergencia/0.mp4` | Categoría **Emergencia** → Botón `📹` en tarjeta de categoría y botón `📹 Ver seña` en tarjeta **Presentación en ventanilla**. | ✅ Validado 100% |
| 14 | **5.1-1.1** (`1_1`) | Situación 1: Auxilio Inmediato (1) | *"Necesito ayuda urgente, no puedo escuchar."* | `lesco/v1/m5/emergencia/1_1.mp4` | **Emergencia** → *Auxilio Inmediato* → Frase 1 (`📹 Ver seña`) y chip rápido en `TranslatorScreen.tsx`. | ✅ Validado 100% |
| 15 | **5.1-1.2** (`1_2`) | Situación 1: Auxilio Inmediato (2) | *"Estoy en una situación de peligro."* | `lesco/v1/m5/emergencia/1_2.mp4` | **Emergencia** → *Auxilio Inmediato* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 16 | **5.1-1.3** (`1_3`) | Situación 1: Auxilio Inmediato (3) | *"Por favor llame a mis contactos de emergencia."* | `lesco/v1/m5/emergencia/1_3.mp4` | **Emergencia** → *Auxilio Inmediato* → Frase 3 (`📹 Ver seña`). | ✅ Validado 100% |
| 17 | **5.1-2.1** (`2_1`) | Situación 2: Ambulancia y Salud (1) | *"Llamen a una ambulancia inmediatamente."* | `lesco/v1/m5/emergencia/2_1.mp4` | **Emergencia** → *Ambulancia y Salud* → Frase 1 (`📹 Ver seña`) y tarjetas de Accidente/Salud en `EmergenciesScreen.tsx`. | ✅ Validado 100% |
| 18 | **5.1-2.2** (`2_2`) | Situación 2: Ambulancia y Salud (2) | *"Hay una persona herida o inconsciente."* | `lesco/v1/m5/emergencia/2_2.mp4` | **Emergencia** → *Ambulancia y Salud* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 19 | **5.1-3.1** (`3_1`) | Situación 3: Seguridad y Rescate (1) | *"Hay fuego o humo, llamen a bomberos."* | `lesco/v1/m5/emergencia/3_1.mp4` | **Emergencia** → *Seguridad y Rescate* → Frase 1 (`📹 Ver seña`) y tarjeta Fuego/Incendio en `EmergenciesScreen.tsx`. | ✅ Validado 100% |
| 20 | **5.1-3.2** (`3_2`) | Situación 3: Seguridad y Rescate (2) | *"Hay una persona atrapada aquí."* | `lesco/v1/m5/emergencia/3_2.mp4` | **Emergencia** → *Seguridad y Rescate* → Frase 2 (`📹 Ver seña`) y tarjeta Rescate/Inundación en `EmergenciesScreen.tsx`. | ✅ Validado 100% |

#### 5.2 Categoría: Policía y Seguridad (Azul) — 7 videos

| # | Código PDF | Situación / Orden | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Botón en la App (`QuickMessagesScreen.tsx` y `tramitesData.ts`) | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 21 | **5.2-0** (`0`) | Frase Rompehielo Inicial | *"Hola, soy una persona sorda y necesito comunicarme con un oficial."* | `lesco/v1/m5/policia/0.mp4` | Categoría **Policía** → Botón `📹` en tarjeta de categoría y botón `📹 Ver seña` en tarjeta **Presentación en ventanilla**. | ✅ Validado 100% |
| 22 | **5.2-1.1** (`1_1`) | Situación 1: Identificación y Trato (1) | *"Soy una persona sorda, por favor escriba las indicaciones."* | `lesco/v1/m5/policia/1_1.mp4` | **Policía** → *Identificación y Trato* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 23 | **5.2-1.2** (`1_2`) | Situación 1: Identificación y Trato (2) | *"Aquí está mi cédula de identidad."* | `lesco/v1/m5/policia/1_2.mp4` | **Policía** → *Identificación y Trato* → Frase 2 (`📹 Ver seña`, resuelto por prioridad de categoría `policia`). | ✅ Validado 100% |
| 24 | **5.2-1.3** (`1_3`) | Situación 1: Identificación y Trato (3) | *"Necesito un intérprete de LESCO para este proceso."* | `lesco/v1/m5/policia/1_3.mp4` | **Policía** → *Identificación y Trato* → Frase 3 (`📹 Ver seña`). | ✅ Validado 100% |
| 25 | **5.2-2.1** (`2_1`) | Situación 2: Denuncias y Pérdidas (1) | *"Fui víctima de un robo o asalto."* | `lesco/v1/m5/policia/2_1.mp4` | **Policía** → *Denuncias y Pérdidas* → Frase 1 (`📹 Ver seña`) y tarjeta Seguridad/Delito en `EmergenciesScreen.tsx`. | ✅ Validado 100% |
| 26 | **5.2-2.2** (`2_2`) | Situación 2: Denuncias y Pérdidas (2) | *"Perdí mis documentos personales."* | `lesco/v1/m5/policia/2_2.mp4` | **Policía** → *Denuncias y Pérdidas* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 27 | **5.2-3.1** (`3_1`) | Situación 3: Ubicación y Ayuda (1) | *"¿Dónde queda la parada de buses más cercana?"* | `lesco/v1/m5/policia/3_1.mp4` | **Policía** → *Ubicación y Ayuda* → Frase 1 (`📹 Ver seña`) y chip rápido en `TranslatorScreen.tsx`. | ✅ Validado 100% |

#### 5.3 Categoría: Hospital y Salud (Verde) — 7 videos

| # | Código PDF | Situación / Orden | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Botón en la App (`QuickMessagesScreen.tsx` y `tramitesData.ts`) | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 28 | **5.3-0** (`0`) | Frase Rompehielo Inicial | *"Hola, soy una persona sorda y necesito atención médica."* | `lesco/v1/m5/hospital/0.mp4` | Categoría **Hospital** → Botón `📹` en tarjeta de categoría y botón `📹 Ver seña` en tarjeta **Presentación en ventanilla**. | ✅ Validado 100% |
| 29 | **5.3-1.1** (`1_1`) | Situación 1: Admisión y Citas (1) | *"Soy sordo/a, necesito un intérprete de LESCO si es posible."* | `lesco/v1/m5/hospital/1_1.mp4` | **Hospital** → *Admisión y Citas* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 30 | **5.3-1.2** (`1_2`) | Situación 1: Admisión y Citas (2) | *"Tengo cita médica programada para hoy."* | `lesco/v1/m5/hospital/1_2.mp4` | **Hospital** → *Admisión y Citas* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 31 | **5.3-1.3** (`1_3`) | Situación 1: Admisión y Citas (3) | *"Por favor escriba el número de consultorio."* | `lesco/v1/m5/hospital/1_3.mp4` | **Hospital** → *Admisión y Citas* → Frase 3 (`📹 Ver seña`). | ✅ Validado 100% |
| 32 | **5.3-2.1** (`2_1`) | Situación 2: Farmacia y Recetas (1) | *"Vengo a retirar mis medicamentos de la receta."* | `lesco/v1/m5/hospital/2_1.mp4` | **Hospital** → *Farmacia y Recetas* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 33 | **5.3-2.2** (`2_2`) | Situación 2: Farmacia y Recetas (2) | *"Por favor escriba los horarios de las pastillas."* | `lesco/v1/m5/hospital/2_2.mp4` | **Hospital** → *Farmacia y Recetas* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 34 | **5.3-3.1** (`3_1`) | Situación 3: Dolor y Síntomas (1) | *"Tengo dolor fuerte en esta parte del cuerpo."* | `lesco/v1/m5/hospital/3_1.mp4` | **Hospital** → *Dolor y Síntomas* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |

#### 5.4 Categoría: Banco y Finanzas (Amarillo) — 8 videos

| # | Código PDF | Situación / Orden | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Botón en la App (`QuickMessagesScreen.tsx` y `tramitesData.ts`) | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 35 | **5.4-0** (`0`) | Frase Rompehielo Inicial | *"Hola, soy una persona sorda y vengo a realizar un trámite."* | `lesco/v1/m5/banco/0.mp4` | Categoría **Banco** → Botón `📹` en tarjeta de categoría y botón `📹 Ver seña` en tarjeta **Presentación en ventanilla**. | ✅ Validado 100% |
| 36 | **5.4-1.1** (`1_1`) | Situación 1: Tarjetas y Cuentas (1) | *"Deseo abrir una cuenta de ahorros."* | `lesco/v1/m5/banco/1_1.mp4` | **Banco** → *Tarjetas y Cuentas* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 37 | **5.4-1.2** (`1_2`) | Situación 1: Tarjetas y Cuentas (2) | *"Vengo a retirar mi nueva tarjeta."* | `lesco/v1/m5/banco/1_2.mp4` | **Banco** → *Tarjetas y Cuentas* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 38 | **5.4-1.3** (`1_3`) | Situación 1: Tarjetas y Cuentas (3) | *"Mi tarjeta fue bloqueada o retenida por el cajero."* | `lesco/v1/m5/banco/1_3.mp4` | **Banco** → *Tarjetas y Cuentas* → Frase 3 (`📹 Ver seña`). | ✅ Validado 100% |
| 39 | **5.4-2.1** (`2_1`) | Situación 2: Caja y Depósitos (1) | *"Deseo hacer un depósito en efectivo."* | `lesco/v1/m5/banco/2_1.mp4` | **Banco** → *Caja y Depósitos* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 40 | **5.4-2.2** (`2_2`) | Situación 2: Caja y Depósitos (2) | *"Por favor escriba el monto final en el papel."* | `lesco/v1/m5/banco/2_2.mp4` | **Banco** → *Caja y Depósitos* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 41 | **5.4-3.1** (`3_1`) | Situación 3: Firmas y Requisitos (1) | *"Aquí está mi cédula de identidad."* | `lesco/v1/m5/banco/3_1.mp4` | **Banco** → *Firmas y Requisitos* → Frase 1 (`📹 Ver seña`, resuelto por prioridad de categoría `banco`). | ✅ Validado 100% |
| 42 | **5.4-3.2** (`3_2`) | Situación 3: Firmas y Requisitos (2) | *"¿Dónde debo firmar el documento?"* | `lesco/v1/m5/banco/3_2.mp4` | **Banco** → *Firmas y Requisitos* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |

#### 5.5 Categoría: Mensajes Generales y Cortesía (Terracota) — 7 videos

| # | Código PDF | Situación / Orden | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Botón en la App (`QuickMessagesScreen.tsx` y `tramitesData.ts`) | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 43 | **5.5-0** (`0`) | Frase Rompehielo Inicial | *"Hola, soy una persona sorda y necesito hacer una consulta."* | `lesco/v1/m5/mensajes/0.mp4` | Categoría **Mensajes generales** → Botón `📹` en tarjeta de categoría, botón `📹 Ver seña` en **Presentación en ventanilla**, y tarjeta **Saludos y Cortesía** en `HelpScreen.tsx`. | ✅ Validado 100% |
| 44 | **5.5-1.1** (`1_1`) | Situación 1: Saludos y Cortesía (1) | *"Hola, buenos días / buenas tardes."* | `lesco/v1/m5/mensajes/1_1.mp4` | **Mensajes generales** → *Saludos y Cortesía* → Frase 1 (`📹 Ver seña`) y chip "Hola" en `TranslatorScreen.tsx`. | ✅ Validado 100% |
| 45 | **5.5-1.2** (`1_2`) | Situación 1: Saludos y Cortesía (2) | *"Muchas gracias por su paciencia y ayuda."* | `lesco/v1/m5/mensajes/1_2.mp4` | **Mensajes generales** → *Saludos y Cortesía* → Frase 2 (`📹 Ver seña`) y chip "Gracias" en `TranslatorScreen.tsx`. | ✅ Validado 100% |
| 46 | **5.5-2.1** (`2_1`) | Situación 2: Comunicación Escrita (1) | *"¿Podría escribir las indicaciones por favor?"* | `lesco/v1/m5/mensajes/2_1.mp4` | **Mensajes generales** → *Comunicación Escrita* → Frase 1 (`📹 Ver seña`) y chip "Por favor" en `TranslatorScreen.tsx`. | ✅ Validado 100% |
| 47 | **5.5-2.2** (`2_2`) | Situación 2: Comunicación Escrita (2) | *"No comprendí bien, ¿puede repetirlo por escrito?"* | `lesco/v1/m5/mensajes/2_2.mp4` | **Mensajes generales** → *Comunicación Escrita* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |
| 48 | **5.5-3.1** (`3_1`) | Situación 3: Preguntas y Filas (1) | *"¿Dónde se hace la fila preferencial?"* | `lesco/v1/m5/mensajes/3_1.mp4` | **Mensajes generales** → *Preguntas y Filas* → Frase 1 (`📹 Ver seña`). | ✅ Validado 100% |
| 49 | **5.5-3.2** (`3_2`) | Situación 3: Preguntas y Filas (2) | *"¿Dónde están los servicios sanitarios?"* | `lesco/v1/m5/mensajes/3_2.mp4` | **Mensajes generales** → *Preguntas y Filas* → Frase 2 (`📹 Ver seña`). | ✅ Validado 100% |

---

### 6. MÓDULO: PERFIL, AJUSTES Y ACCESIBILIDAD (3 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 50 | **6.1** (`6_1`) | Edición de Perfil de Usuario (EditProfile Screen) | *"Puedes actualizar tu nombre, teléfono y contacto de emergencia. Recuerda que tu número de cédula es único y permanece bloqueado por seguridad."* | `lesco/v1/m6/6_1.mp4` | `ProfileScreen.tsx` (tarjeta **Editar perfil** botón `📹`) y `EditProfileScreen.tsx` (barra superior derecha botón `📹 Ver en señas`). | ✅ Activado y Validado |
| 51 | **6.2** (`6_2`) | Calibración de Vibración Háptica (Vibration Screen) | *"Activa la vibración háptica y presiona 'Probar Vibración' para sentir la respuesta táctil que confirmará tus acciones en la aplicación."* | `lesco/v1/m6/6_2.mp4` | `ProfileScreen.tsx` (tarjeta **Vibración** botón `📹`) y `VibrationScreen.tsx` (barra superior derecha botón `📹 Ver en señas`). | ✅ Validado 100% |
| 52 | **6.3** (`6_3`) | Ajuste de Tamaño de Texto (TextSize Screen) | *"Mueve la barra deslizante para aumentar o disminuir el tamaño de los textos en la aplicación según tu comodidad visual."* | `lesco/v1/m6/6_3.mp4` | `ProfileScreen.tsx` (tarjeta **Tamaño de texto** botón `📹`) y `TextSizeScreen.tsx` (barra superior derecha botón `📹 Ver en señas`). | ✅ Validado 100% |

---

### 7. MÓDULO: HISTORIAL Y SOPORTE (2 videos)

| # | Código PDF | Sección en el PDF | Frase Exacta del PDF (`phrase_es`) | `r2_key` | Pantalla / Componente y Disparador en la App | Estado |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 53 | **7.1** (`7_1`) | Historial de Traducciones y Alertas (History Screen) | *"En tu historial puedes consultar las frases que has traducido anteriormente y las alertas de emergencia emitidas para reproducirlas rápidamente."* | `lesco/v1/m7/7_1.mp4` | `HomeScreen.tsx` → `SecondaryActionsGrid.tsx` (tarjeta **Historial** botón `📹`) y `HistoryScreen.tsx`. | ✅ Validado 100% |
| 54 | **7.2** (`7_2`) | Centro de Ayuda y Preguntas Frecuentes (Help Screen) | *"Si tienes dudas sobre el uso de LESCOnect, consulta las preguntas frecuentes o contáctanos por WhatsApp y correo para brindarte asistencia."* | `lesco/v1/m7/7_2.mp4` | `HomeScreen.tsx` → `SecondaryActionsGrid.tsx` (tarjeta **Ayuda LESCO** botón `📹`) y `HelpScreen.tsx`. | ✅ Validado 100% |
