# 🚀 Pull Request — LESCOnect

## 📝 Descripción
Este Pull Request consolida las funcionalidades esenciales de la pantalla de **Inicio (Home)**, el flujo de **Registro de Usuario (Auth)** fiel al prototipo con selector de fecha interactivo, el sistema de **Accesibilidad Háptica / Vibración** en la pantalla de **Perfil**, y la calibración del reproductor de **Video en LESCO** en formato vertical 9:16 sin barras negras.

Además, integra de forma limpia los módulos de **Traductor** y **Emergencias** junto con el sistema de diseño oficial (**Paleta Tierra**).

---

## 🛠️ Tipo de Cambio
- [x] ✨ **feat**: Nueva funcionalidad o pantalla (Home modular, Selector de fecha con años/meses, Sub-pantalla de Vibración en Perfil)
- [x] 🎨 **style / ui**: Cambios visuales de alta fidelidad, controles flotantes en video y ajuste de safe area en tabs inferiores
- [x] 🐛 **fix**: Corrección de área segura en Android, resolución de imports en iconSet y calibración háptica al alternar estados
- [x] 🔧 **chore / config**: Incorporación y compatibilidad de dependencias (@expo/metro-runtime, expo-video, expo-haptics)

---

## 📦 Módulos Afectados
- [ ] 🤟 **Traductor**
- [ ] 🚨 **Emergencias**
- [x] 🏠 **Home**
- [x] 🔐 **Auth**
- [x] 👤 **Perfil**
- [ ] 📋 **TramitesRapidos**
- [ ] 📜 **Historial**
- [ ] ❓ **Ayuda**
- [x] 🧩 **Shared Components / Theme**

---

## 🔍 Cambios Realizados

### 1. 🏠 Módulo Home e Interfaz Modular
- **Home Modular**: Integración de `HomeHeader`, `TranslatorHeroCard`, `EmergencyBanner`, `QuickMessagesBento` y `SecondaryActionsGrid`.
- **Reproductor de Video LESCO (`LescoVideoModal.tsx`)**:
  - Calibrado al formato vertical nativo **9:16 (576x1024)** para eliminar por completo las barras negras laterales.
  - Controles táctiles (`[🔁 Repetir]`, `[⏸️ Pausar]`, `[🐢 1.0x]`) ubicados debajo del cuadro para no obstruir las manos del intérprete.
  - Contenedor con `ScrollView` que previene cortes del botón `✓ Entendido / Cerrar` en cualquier resolución de pantalla móvil.

### 2. 🔐 Módulo Auth (Registro de Usuario)
- **Selector de Fecha (`DatePickerModal.tsx`)**:
  - Calendario emergente fiel al prototipo con selector de **Años (1940 a 2026)** y cuadrícula rápida de **12 meses**.
- **Formulario y UX (`SignupForm.tsx` / `SignupScreen.tsx`)**:
  - Autoformateo automático de cédula, teléfono y contacto de emergencia (`####-####`).
  - Compensación inteligente del teclado para mantener siempre visibles los campos y el botón de acción.

### 3. 👤 Módulo Perfil y Accesibilidad Háptica
- **Pantalla de Perfil (`ProfileScreen.tsx`)**:
  - Avatar terracota cuadrado (`Radius.lg`), datos de usuario y lista de opciones accesibles.
  - Sub-pantalla de **Vibración táctil** fiel al prototipo con switch interactivo y botón de prueba física.
  - Pulso táctil inmediato tanto al **activar** como al **desactivar** la vibración.
- **Utilidad Háptica (`haptics.ts` / `useSettingsStore.ts`)**:
  - Store Zustand con persistencia local (`vibrationEnabled: true` por defecto).
  - Respuestas hápticas conectadas a los tabs inferiores, botones de inicio y tarjetas.

### 4. 🧩 Shared & Navegación
- **Área Segura en Tabs (`app/(tabs)/_layout.tsx`)**:
  - Elevación de la barra de navegación sobre los botones físicos/virtuales del sistema Android mediante `useSafeAreaInsets`.
- **Unificación de Tokens de Tema (`colors.ts`, `spacing.ts`, `typography.ts`)**:
  - Compatibilidad total con la Paleta Tierra oficial de Carlos.

---

## 📸 Evidencia Visual / Capturas
- ✅ Modal de Video LESCO en proporción 9:16 vertical exacta sin bordes negros laterales.
- ✅ Selector de fecha con scroll de años y botones de 12 meses.
- ✅ Formulario de registro con inputs telefónicos autoformateados.
- ✅ Sub-pantalla de Vibración con checkbox interactivo y botón de prueba táctil.
- ✅ Barra de pestañas flotando por encima del área de navegación de Android.

---

## ✅ Lista de Verificación (Checklist)
- [x] Se ejecutó `npx tsc --noEmit` sin errores de compilación TypeScript (0 errores).
- [x] Se respetó la arquitectura de módulos (6 subcarpetas por módulo y barrera pública `index.ts`).
- [x] Se evitó el uso de importaciones profundas cruzadas entre módulos.
- [x] Los componentes respetan la Paleta Tierra (`#FBF6EE`, `#B5551A`, `#5C7A5C`, `#C0392B`, `#2B241C`, `#7A6E5C`).
- [x] Se verificaron los márgenes y áreas seguras para dispositivos móviles (compilación APK / Expo Go).
