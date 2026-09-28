# 🚀 Pull Request — LESCOnect

**Rama origen:** `feature/traductor-lesco-funcional`  
**Rama destino:** `develop`

---

## 📝 Descripción
Este Pull Request implementa la versión funcional y accesible del **Traductor de Señas LESCO a Texto / Voz** en tiempo real (`SignsToTextScreen`), resolviendo la sobrecarga y el ruido visual en la interfaz, eliminando el esqueleto articular artificial que causaba descalibración y confusión, y sustituyendo los emojis genéricos que no correspondían a la lengua de señas por un **sistema de distintivos tipográficos oficiales LESCO**.

Asimismo, incorpora principios de **Deaf UX y accesibilidad universal** diseñados para usuarios cuya lengua materna es la LESCO (minimizando textos largos en español en favor de señales visuales y hápticas intuitivas) y optimiza el motor de reconocimiento con fallback inteligente en **Google Gemini 3.1 Flash-Lite** para asegurar cuota y respuestas en tiempo real.

---

## 🛠️ Tipo de Cambio
- [x] ✨ **feat**: Motor de reconocimiento de señas LESCO estáticas y dinámicas en tiempo real con captura optimizada y fallback multimodal.
- [x] 🎨 **style / ui**: Rediseño visual del visor de cámara (42% de alto, centrado, despejado) y controles de edición de texto equilibrados (`Espacio ␣`, `⌫ Borrar`, `🔊 Escuchar`, `🗑️ Limpiar`).
- [x] ♿ **a11y / deaf-ux**: Interfaz adaptada a la comunidad sorda; sustitución de frases largas en español por semiótica visual universal (ícono de mano `🖐️`, puntos de estado por color y retroalimentación háptica).
- [x] 🐛 **fix**: Eliminación del esqueleto SVG artificial que interfería sobre el video y corrección del error de anidamiento JSX en `TranslatorScreen`.
- [x] 🏷️ **refactor**: Eliminación total de emojis falsos de señas (`👌`, `👉`, `✌️`, etc.) reemplazados por distintivos tipográficos circulares oficiales (`[ A ]`, `[ B ]`, `[ C ]`...) basados en el abecedario oficial de Costa Rica (CENAREC y Hands-On LESCO).

---

## 📦 Módulos Afectados
- [x] 🤟 **Traductor**
- [ ] 🚨 **Emergencias**
- [ ] 🏠 **Home**
- [ ] 🔐 **Auth**
- [ ] 👤 **Perfil**
- [ ] 📋 **TramitesRapidos**
- [ ] 📜 **Historial**
- [ ] ❓ **Ayuda**
- [ ] 🧩 **Shared Components / Theme**

---

## 🔍 Cambios Realizados

### 1. 📷 Visor de Cámara y Limpieza Visual (`SignsToTextScreen.tsx`)
- **Eliminación del esqueleto articular invasivo**: Se removió la capa SVG que proyectaba líneas y puntos óseos no coincidentes con la mano real del usuario, dejando el video completamente nítido y fluido.
- **Espacio optimizado**: El cuadro de la cámara ocupa el 42% del alto de la pantalla en dispositivos móviles (`Math.round(SCREEN_HEIGHT * 0.42)`), brindando un área amplia y cómoda para encuadrar la mano.
- **Despeje de capas superpuestas**: Se eliminaron los recuadros guía amarillos y las tarjetas flotantes gigantes que tapaban el rostro o la mano. Se mantuvo únicamente un botón sutil para girar cámara y un indicador de estado por color.

### 2. 👁️ Accesibilidad para la Comunidad Sorda (Deaf UX)
- **Semiótica visual sin barreras de lectoescritura**: Se eliminaron textos largos en español como *"Muestra tu mano frente a la cámara"* o *"Analizando postura articular..."*.
- **Indicadores intuitivos**:
  - **Estado de espera**: Ícono universal `🖐️` acompañado de un pulso sutil y texto minimalista (`Esperando seña`).
  - **Reconocimiento exitoso**: Distintivo circular de alto contraste con la letra identificada (`[ L ]`), porcentaje de certeza y botón directo `+ Escribir`.
  - **Estados de cámara por color**: 🟢 En vivo / Detectando | 🔵 Analizando | 🔴 Pausada.

### 3. 🚫 Erradicación de Emojis Confusos y Adopción de Distintivos LESCO
- **Problema resuelto**: Los emojis genéricos (`✊`, `✋`, `👌`, `👉`, `✌️`, `🤏`, `🤙`) no representan la fonología de la LESCO y desorientaban a los usuarios.
- **Nuevo diseño**: Cada letra del abecedario y palabra clave cuenta con un distintivo tipográfico circular en la paleta oficial (`#B5551A` y crema `#F5EBE1`).
- **Fichas anatómicas oficiales**: Se integró el modal descriptivo con la postura anatómica oficial de la mano y consejos de encuadre, fundamentados en los manuales de Hands-On LESCO y CENAREC.

### 4. ⌨️ Panel de Transcripción y Controles Centrados
- **Área de texto traducido**: Visor limpio con cursor parpadeante (`|`) y activación/desactivación de auto-escritura (`⚡ Auto-escritura`).
- **Botones de acción equilibrados**:
  - `[ Espacio ␣ ]`: Añade separación entre palabras.
  - `[ ⌫ Borrar ]`: Retroceso de carácter con acento rojo accesible (`#C0392B`).
  - `[ 🔊 Escuchar ]`: Síntesis de voz accesible en español con acento verde bosque (`#5C7A5C`).
  - `[ 🗑️ ]`: Limpieza rápida del buffer.

### 5. ⚡ Motor de Reconocimiento y Resiliencia de Cuota (`translatorService.ts`)
- **Actualización de modelos Gemini**: Migración de modelos saturados a `gemini-3.1-flash-lite`, `gemini-3.1-flash-lite-preview` y `gemini-3.5-flash` con cuota fresca garantizada.
- **Resolución de truncamiento JSON**: Aumento del límite a `max_output_tokens: 300` para permitir la salida limpia de tokens de pensamiento sin cortar la respuesta JSON `{ "letter": "...", "confidence": ... }`.
- **Compresión de frames**: Ajuste en la toma de capturas (`quality: 0.45`, `skipProcessing: true`) para agilizar la transferencia y reducir el consumo de datos y batería.
- **Corrección de anidamiento JSX**: Reparación de etiqueta abierta en el modo `textToSigns` dentro de `TranslatorScreen.tsx`.

---

## 📸 Evidencia Visual / Verificación
- ✅ **Cámara limpia**: Transmisión en vivo sin esqueletos sintéticos ni tarjetas encimadas.
- ✅ **Reconocimiento en tiempo real**: Detección confirmada con respuestas JSON parseadas correctamente.
- ✅ **Zero Emojis confusos**: Todas las señas se representan con sus distintivos oficiales tipográficos.
- ✅ **Zero errores TypeScript**: Módulo `Traductor` verificado sin advertencias ni errores de tipos o sintaxis.
- ✅ **Pruebas en Expo Go**: Validado en dispositivo móvil y web.

---

## ✅ Lista de Verificación (Checklist)
- [x] Rama destino configurada hacia `develop`.
- [x] Se ejecutó `npx tsc --noEmit` y el módulo Traductor no presenta errores de tipado.
- [x] Se respetó la arquitectura modular de 6 carpetas y barreras de importación `index.ts`.
- [x] No hay dependencias circulares ni importaciones cruzadas prohibidas.
- [x] Se aplicó la Paleta Tierra (`#FBF6EE`, `#B5551A`, `#5C7A5C`, `#C0392B`, `#2B241C`, `#7A6E5C`).
- [x] El diseño prioriza la accesibilidad para personas sordas y con discapacidad auditiva.
