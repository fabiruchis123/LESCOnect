# 🚀 Guía de Inicio Rápido para Desarrolladores (Onboarding — LESCOnect)

Esta guía detalla los pasos exactos que debe seguir todo integrante del equipo al clonar el repositorio por primera vez.

---

## 🛠️ 1. Prerrequisitos

Asegúrate de contar con el siguiente entorno instalado en tu máquina:
- **Node.js**: `v18.x` o superior (Recomendado v20 LTS).
- **Git**: Última versión.
- **Expo Go App**: Disponible en iOS App Store y Android Play Store (para pruebas en dispositivo físico).
- *(Opcional)* **Android Studio** o **Xcode** si deseas ejecutar en emulador/simulador nativo.

---

## 📥 2. Clonado del Repositorio e Instalación

Abre tu terminal y ejecuta los siguientes comandos:

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPOSITORIO>

# 2. Entrar a la carpeta del proyecto
cd LESCOnect

# 3. Instalar las dependencias exactas del proyecto
npm install --legacy-peer-deps
```

> 💡 **Nota**: Usar la bandera `--legacy-peer-deps` garantiza que las dependencias peer de Expo 57 y React 19 se resuelvan de forma idéntica en todos los entornos.

---

## 🔍 3. Verificación de Compilación

Antes de iniciar el servidor de desarrollo, verifica que el sistema no presente errores de tipado:

```bash
npx tsc --noEmit
```

*Deberías ver una salida limpia sin errores de compilación.*

---

## ⚡ 4. Iniciar el Servidor de Desarrollo

Ejecuta el servidor de Expo:

```bash
npm run start
```

### Opciones de Ejecución:
- **Dispositivo Físico**: Escanea el código QR que aparece en la terminal con la app **Expo Go** (Android) o la app de **Cámara** (iOS).
- **Emulador Android**: Presiona la tecla `a` en la terminal.
- **Simulador iOS**: Presiona la tecla `i` en la terminal.
- **Navegador Web**: Presiona la tecla `w` en la terminal.

---

## 🏗️ 5. Resumen de Arquitectura y Reglas del Proyecto

Para mantener consistencia en el código del equipo, ten en cuenta las siguientes reglas clave:

### 📱 Navegación con Expo Router (`app/`)
- La estructura de pantallas reside dentro de la carpeta `app/`.
- `app/(auth)/`: Pantallas de bienvenida y registro (`welcome.tsx`, `signup.tsx`).
- `app/(tabs)/`: Pestañas principales de la app (`index.tsx` [Inicio], `traductor.tsx`, `tramites.tsx`, `emergencias.tsx`, `perfil.tsx`).
- La redirección basada en la sesión del usuario está centralizada en [`app/_layout.tsx`](file:///app/_layout.tsx).

### 📦 Módulos de Feature (`src/modules/`)
Toda funcionalidad pertenece a uno de los **8 módulos**: `Auth`, `Ayuda`, `Emergencias`, `Historial`, `Home`, `Perfil`, `Traductor`, `TramitesRapidos`.

Cada módulo mantiene estrictamente 6 subcarpetas:
```
src/modules/<NombreModulo>/
├── components/   # Componentes UI reutilizables
├── hooks/        # Hooks personalizados
├── screens/      # Componentes de pantallas
├── services/     # Llamadas a API / Inferencia LESCO
├── styles/       # Hojas de estilo StyleSheet
├── types/        # Tipos e interfaces de TypeScript
└── index.ts      # API Pública del Módulo (OBLIGATORIO)
```

> 🚨 **Regla de Oro**: Queda prohibido realizar importaciones profundas cruzadas entre módulos. Siempre importa desde la API pública del módulo.
> - ❌ **Incorrecto**: `import { WelcomeScreen } from '@/modules/Auth/screens/WelcomeScreen'`
> - ✅ **Correcto**: `import { WelcomeScreen } from '@/modules/Auth'`

### 🔐 Estado Global
- **Sesión y Autenticación Client-Side**: Manejar exclusivamente con **Zustand** + **MMKV** desde [`src/shared/stores/useAuthStore.ts`](file:///src/shared/stores/useAuthStore.ts).
- **Datos de Servidor**: Utilizar **TanStack Query** (`@tanstack/react-query`).

---

## 🤖 6. Asistentes de IA (Agentes)

Si utilizas asistentes de Inteligencia Artificial (Antigravity, Claude Code, Cursor, Copilot), el proyecto ya cuenta con las reglas y skills precargadas en:
- `AGENTS.md` (Punto de entrada general)
- `.agents/rules/` (Reglas de arquitectura, Expo 57 y estado)
- `.agents/skills/` (Skills especializadas del proyecto)

---

¡Listo! Ya tienes todo configurado para desarrollar en **LESCOnect**. 🎉
