# 🚀 Pull Request — LESCOnect

**Rama origen:** `feature-actualizacion-front-ari`  
**Rama destino:** `develop`

---

## 📝 Descripción
Este Pull Request integra un conjunto exhaustivo de mejoras visuales, de accesibilidad universal (Deaf UX), persistencia de preferencias de usuario y optimizaciones ergonómicas en los módulos de **Home**, **Perfil**, **Traductor**, **Trámites Rápidos** y **Emergencias SOS**:

1. **Home**: Estandarización de «Trámites Rápidos», botones de video tutorial en LESCO integrados junto a cada botón de flecha en los 5 módulos principales, separación visual adecuada entre texto e ícono de Emergencias, y fijación del ícono de inicio (`🏠`) sin estados no deseados.
2. **Perfil & Accesibilidad**: Persistencia completa del tamaño de texto y configuración háptica mediante Zustand + MMKV con fallback seguro; previsualización interactiva en tiempo real y escalado dinámico de tipografía en la interfaz de Perfil.
3. **Traductor LESCO**: Visualización de palabras frecuentes extendidas horizontalmente sin confinarlas en círculos restrictivos, facilitando su lectura tanto en el carrusel en vivo como en el listado de diccionario y modal anatómico.
4. **Trámites Rápidos**: Reducción del tamaño de la tarjeta rompehielo mediante el salto de línea controlado de «Presentación en ventanilla» a 2 líneas.
5. **Emergencias SOS**: Pantalla dedicada y navegación desacoplada para la adición y gestión fluida de contactos de emergencia.

---

## 🛠️ Tipo de Cambio
- [x] ✨ **feat**: Persistencia de tamaño de texto y preferencias hápticas con Zustand + MMKV; pantalla dedicada para registrar contactos SOS.
- [x] 🎨 **style / ui**: Integración de botones de tutorial LESCO (`📹`) en Home; visualización horizontal limpia de palabras frecuentes sin círculos; ajuste de espaciado y saltos de línea en rompehielos de trámites.
- [x] ♿ **a11y / deaf-ux**: Escalado dinámico de fuentes según preferencia del usuario en Perfil; videos de apoyo en LESCO directos por módulo; mejoras en legibilidad táctil y visual.
- [x] 🐛 **fix**: Corrección del ícono inactivo de la casa en la barra de pestañas (evitando `🏚️` por `🏠` constante); importaciones normalizadas de `LescoVideoModal` en el módulo de Traductor.
- [x] 🏷️ **refactor**: Desacoplamiento del formulario de contacto SOS a ruta dedicada `app/add-sos-contact.tsx` y pantalla `AddSosContactScreen.tsx`.

---

## 📦 Módulos Afectados
- [x] 🏠 **Home**
- [x] 👤 **Perfil**
- [x] 🤟 **Traductor**
- [x] 📋 **TramitesRapidos**
- [x] 🚨 **Emergencias**
- [x] 🧩 **Shared Stores / Components**

---

## 🔍 Cambios Realizados

### 1. 🏠 Módulo Home (`HomeScreen.tsx`, `home.styles.ts`, componentes)
- **«Mensajes Rápidos» → «Trámites Rápidos»**: Actualización de textos y accesibilidad en el encabezado Bento.
- **Botones de Video Tutorial LESCO**:
  - `TranslatorHeroCard.tsx`: Botón `📹` junto a las flechas de **Señas a Voz** y **Voz a Señas**.
  - `EmergencyBanner.tsx`: Botón `📹` junto al botón de flecha de **Emergencias**.
  - `SecondaryActionsGrid.tsx`: Botones `📹` junto a las flechas de **Historial** y **Ayuda LESCO**.
  - Enlace directo a `LescoVideoModal` con glosas explicativas oficiales para cada funcionalidad.
- **Separación visual en Emergencias**: Creación del contenedor `emergencyTextBox` con margen izquierdo de 14px para distanciar la sirena 🚨 del texto de alerta.
- **Barra de navegación de Pestañas (`app/(tabs)/_layout.tsx`)**: Eliminación del emoji alternativo de casa en ruinas (`🏚️`), garantizando el ícono de casa (`🏠`) en todos los estados.

### 2. 👤 Módulo Perfil y Store de Ajustes (`ProfileScreen.tsx`, `TextSizeScreen.tsx`, `useSettingsStore.ts`)
- **Persistencia con MMKV y fallback**: Store `useSettingsStore` enriquecida con `fontSizeNumber` (14, 16, 20, 24px), `fontScale` (0.875 a 1.5) y `vibrationEnabled`, almacenados en `react-native-mmkv` con adapter tolerante a fallos para Web y Expo Go.
- **Selección y Feedback en Tiempo Real**: En `TextSizeScreen`, la selección de tamaño se persiste de inmediato, actualiza la caja de vista previa y muestra la insignia interactiva `✓ Guardado`.
- **Escalado Dinámico**: La pantalla `ProfileScreen` recalcula tamaños de fuentes de títulos, botones y opciones aplicando `fontScale`, además de reflejar en el subtítulo el tamaño activo (ej. *«Actual: Grande (20px) • Toca para cambiar»*).
- **Vibración háptica**: `VibrationScreen` conectado directamente a la store global.

### 3. 🤟 Módulo Traductor y Abecedario (`SignsToTextScreen.tsx`, `TranslatorScreen.tsx`)
- **Palabras Frecuentes extendidas a lo horizontal**:
  - Eliminación del contenedor circular rígido (`gridBadgeCircle`, 34x34) para palabras compuestas como *«POR FAVOR»*, *«GRACIAS»*, *«HOLA»*, *«AYUDA»*, *«SÍ»* y *«NO»*.
  - Despliegue en tarjetas horizontales que aprovechan el ancho completo (`wordCardHorizontal`), con tipografía legible, indicador de dificultad y enlace a postura oficial.
  - Inclusión de carrusel horizontal de palabras frecuentes en la vista de cámara en vivo para rápida inserción en el búfer de texto.
  - Adaptación de la insignia en el modal de detalle anatómico (`modalWordBadge`).

### 4. 📋 Módulo Trámites Rápidos (`QuickMessagesScreen.tsx`, `tramites.styles.ts`)
- **Rompehielo en 2 líneas**:
  - La tarjeta de presentación en ventanilla ahora divide la etiqueta como:
    ```text
    Presentación en
    ventanilla
    ```
  - `lineHeight: 13` para prevenir sobreanchos y desbordes frente al botón LESCO.

### 5. 🚨 Módulo Emergencias SOS (`SosContactsScreen.tsx`, `AddSosContactScreen.tsx`, `app/add-sos-contact.tsx`)
- Desacoplamiento del formulario desplegable a una pantalla independiente `AddSosContactScreen` con validaciones de teléfono, rol y switches accesibles (sabe LESCO / recibe SMS).

---

## 📸 Evidencia Visual / Verificación
- ✅ **Cero errores TypeScript**: Verificación limpia ejecutando `npx tsc --noEmit` con código de salida `0`.
- ✅ **Persistencia comprobada**: El tamaño de letra se mantiene guardado al salir y volver a entrar al perfil o reiniciar la app.
- ✅ **Diseño responsivo**: Palabras frecuentes legibles sin recortes ni círculos forzados.
- ✅ **Accesibilidad LESCO**: Modales de tutorial configurados y disparables desde cada sección del Home.

---

## ✅ Lista de Verificación (Checklist)
- [x] Rama origen `feature-actualizacion-front-ari` sincronizada.
- [x] Rama destino configurada hacia `develop`.
- [x] Se ejecutó `npx tsc --noEmit` y el proyecto compila sin errores ni advertencias de tipos.
- [x] Se respetó la arquitectura modular de 6 carpetas y barreras de exportación `index.ts`.
- [x] Se utilizó la paleta de colores del Design System Tierra (`#FBF6EE`, `#B5551A`, `#5C7A5C`, `#C0392B`, `#2B241C`, `#7A6E5C`).
- [x] Compatible con Web y Expo Go (iOS/Android).
