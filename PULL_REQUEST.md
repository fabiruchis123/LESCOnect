# 🚀 Pull Request — LESCOnect

## 📝 Descripción
Este Pull Request consolida la integración y homologación al **100% de fidelidad del prototipo no funcional** (`PrototipoNoFuncional/index.html`), asegurando la máxima calidad visual (Paleta Tierra), accesibilidad para personas no oyentes y eliminación de fricción en la navegación. Además, se incorpora la identidad visual de marca oficial (`LESCOnect-Logo-manos` y `LESCOnect-letra`), se rediseña el módulo de emergencias para situaciones de crisis y se corrige el layout del modal de ventanilla.

---

## 🛠️ Tipo de Cambio
- [x] ✨ **feat**: Nueva funcionalidad o pantalla
- [x] 🎨 **style / ui**: Cambios visuales o maquetado de alta fidelidad
- [ ] 🐛 **fix**: Corrección de un error o bug
- [x] ♻️ **refactor**: Refactorización de código sin cambiar comportamiento
- [ ] 📚 **docs**: Cambios en la documentación
- [x] 🔧 **chore / config**: Ajuste de configuración o dependencias

---

## 📦 Módulos Afectados
- [x] 🤟 **Traductor**
- [x] 🚨 **Emergencias**
- [x] 🏠 **Home**
- [x] 🔐 **Auth**
- [x] 👤 **Perfil**
- [x] 📋 **TramitesRapidos**
- [x] 📜 **Historial**
- [x] ❓ **Ayuda**
- [x] 🧩 **Shared Components / Theme**

---

## 🔍 Cambios Realizados

### 1. 🎨 Identidad Visual de Marca y Carga Animada
- **Launcher y Splash**: Configurado `app.json` para utilizar `LESCOnect-Logo-manos.png` como icono nativo de aplicación (iOS, Android y Web) y en el splash screen sobre fondo cálido `#FBF6EE`.
- **Componente `BrandLogo`**: Soporte de variantes `'wordmark'` (`LESCOnect-letra-tight.png` recortado sin bordes transparentes fantasmas) y `'hands'`.
- **Pantalla de Carga Animada (`AppLoadingSplash`)**: Animación continua de pulso/respiración para el logo de manos, fondo `#FBF6EE`, indicador terracota y sincronización dinámica del título en la pestaña del navegador: *"LESCOnect — Puente de comunicación e inclusión"*.
- **Integración de Marca Sutil**: Incorporación del logo tipográfico en cabeceras (`HomeHeader`, `AppHeader`, `WelcomeScreen`) sin saturar el espacio vertical.

### 2. 📱 Trámites Rápidos y Modal de Ventanilla
- **Alineación del Botón Cerrar (`✕`)**: Corrección en `VentanillaModal.tsx` eliminando posicionamiento absoluto y estructurando `modalHeaderRow` en flexbox que alinea el badge de instrucción y el botón cerrar dentro del padding interior de la tarjeta.
- **Fidelidad al 100%**: Mapeo completo de las 5 categorías oficiales (*Emergencia, Policía, Hospital, Banco, Mensajes generales*) y las 15 situaciones con glosas LESCO extraídas del prototipo no funcional.
- **Síntesis de Voz Multiplataforma (TTS)**: Creación de `speechService` con soporte para `expo-speech` en nativo y `window.speechSynthesis` en Web (`es-CR`).
- **Arquitectura de 6 Carpetas**: `components/`, `hooks/` (`useTramites`), `screens/`, `services/`, `styles/`, `types/` y barrera pública `index.ts`.

### 3. 🚨 Despacho de Emergencias Limpio y Red de Contactos SOS
- **Cero Ruido Visual en Crisis**: Eliminación de textos institucionales invasivos (*"Despacho Automático 9-1-1"*, *"Orquestador Nacional"*) y de la caja de coordenadas numéricas crudas.
- **Indicador Minimalista de GPS**: Icono `📍` con punto luminoso de estado (verde activo `🟢` o gris inactivo `⚪`).
- **Red de Contactos SOS (`SosContactsScreen.tsx`)**:
  - Contador de `X de 5 contactos registrados`.
  - Formulario desplegable con botón `+ Agregar`.
  - **Campos adaptados para personas no oyentes**: Nombre, Teléfono, Parentesco, indicador de si el contacto sabe LESCO o si recibe alertas por SMS.
  - Acciones directas: `📞 Llamar`, `💬 SMS SOS` y eliminación protegida (mínimo 1 contacto obligatorio).

### 4. 🤟 Traductor Directo (Eliminación de Pantalla Intermedia)
- **Cero Fricción**: Se eliminó la pantalla estática de selección intermedia ("Selecciona la dirección de comunicación").
- **Acceso Inmediato en Cabecera**:
  - **`📷 Señas → Texto`**: Abre directamente el visor de cámara con marco de encuadre MediaPipe, transcripción acumulada, control de flash/cámara y botón de voz `🔊`.
  - **`💬 Texto → Señas`**: Abre directamente el reproductor LESCO con caja de texto, dictado por voz (`🎤`), selector de velocidad (0.5x, 0.75x, 1x) y clips rápidos cotidianos.

### 5. 📜 Historial, ❓ Ayuda y 👤 Perfil
- **`HistoryScreen.tsx`**: Historial cronológico con filtros (*Todos, Traducción, Trámites, Emergencia*), botón `📱 Mostrar` en pantalla gigante de ventanilla, `🔊 Hablar` y vaciar historial.
- **`HelpScreen.tsx`**: Tutoriales en video LESCO (*Abecedario*, *Saludos*, *Emergencias 9-1-1*) y acordeón de preguntas frecuentes (FAQ).
- **Subpantallas de Perfil**:
  - `EditProfileScreen.tsx`: Edición de datos personales sincronizada con `useAuthStore`.
  - `TextSizeScreen.tsx`: Selector de tamaño con previsualización en tiempo real.
  - `VibrationScreen.tsx`: Control de respuesta háptica táctil y botón de prueba.

---

## 📸 Evidencia Visual / Capturas
- Pantalla de inicio con logo tipográfico y carga animada.
- Modal de ventanilla con botón `✕` perfectamente alineado y texto en letras gigantes.
- Emergencias con indicador luminoso `📍 🟢` y red de contactos SOS funcional.
- Traductor de acceso directo con pestañas segmentadas sin pantalla intermedia.
- Subpantallas de Historial, Ayuda y Perfil operativas y fieles a la paleta Tierra.

---

## ✅ Lista de Verificación (Checklist)
- [x] Se ejecutó `npx tsc --noEmit` sin errores de compilación TypeScript (0 errores).
- [x] Se respetó la arquitectura de módulos (6 subcarpetas por módulo y barrera pública `index.ts`).
- [x] Se evitó el uso de importaciones profundas cruzadas entre módulos.
- [x] Los componentes respetan la Paleta Tierra (`#FBF6EE`, `#B5551A`, `#5C7A5C`, `#C0392B`, `#2B241C`, `#7A6E5C`).
- [x] Se verificaron los márgenes y áreas seguras para dispositivos móviles (compilación APK / Expo Go).
