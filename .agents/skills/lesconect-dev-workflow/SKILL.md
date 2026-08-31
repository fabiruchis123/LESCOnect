---
name: lesconect-dev-workflow
description: Guía maestra y estándares de desarrollo para LESCOnect. Describe el stack (Expo 57, RN 0.86, React 19, TS 6.0), la arquitectura de 8 módulos, enrutamiento con Expo Router v4, Zustand + MMKV y TanStack Query.
---

# LESCOnect — Guía Maestra de Desarrollo para Agentes AI

Esta skill define el estándar técnico oficial para la construcción de características, refactorización y depuración en la aplicación móvil **LESCOnect**.

---

## 1. Stack Tecnológico Principal

- **Framework Móvil**: Expo `~57.0.18` / React Native `0.86.3` / React `19.2.3`
- **Lenguaje**: TypeScript `~6.0.3` con soporte de alias `@/*` -> `./src/*`
- **Navegación**: Expo Router v4 (basado en el directorio `app/`)
- **Estado de Sesión / Cliente**: Zustand `^5.0` + `react-native-mmkv` v4.3
- **Datos Remotos y Caché de Servidor**: TanStack Query `^5.102`
- **Soporte Web / Native**: `react-dom` 19.2.3 + `react-native-web` 0.21

---

## 2. Arquitectura de Módulos (8 Features)

Toda lógica de dominio reside dentro de `src/modules/`:

```
src/modules/
├── Auth/
├── Ayuda/
├── Emergencias/
├── Historial/
├── Home/
├── Perfil/
├── Traductor/
└── TramitesRapidos/
```

### Reglas Obligatorias de Módulo:
1. **Plantilla de 6 Subcarpetas**:
   Cada módulo DEBE tener obligatoriamente: `components`, `hooks`, `screens`, `services`, `styles`, `types`.
2. **Public API Barrel (`index.ts`)**:
   Todo componente, pantalla o servicio expuesto hacia el exterior DEBE ser re-exportado en el `index.ts` de la raíz del módulo.
3. **Prohibición de Importaciones Internas**:
   Nunca importar archivos internos de otro módulo directamente (ejemplo: ❌ `@/modules/Auth/screens/SignupScreen`). Usar siempre la API pública (ejemplo: ✅ `import { SignupScreen } from '@/modules/Auth'`).

---

## 3. Enrutamiento con Expo Router (`app/`)

Expo Router gestiona las pantallas mediante el directorio `app/`:

- **Layout Raíz**: `app/_layout.tsx`
  - Encapsula `QueryClientProvider` y `SafeAreaProvider`.
  - Evalúa `useAuthStore` y redirige dinámicamente:
    - Si `!isAuthenticated` -> `/(auth)/welcome`
    - Si `isAuthenticated` -> `/(tabs)`
- **Flujo Autenticación**: `app/(auth)/_layout.tsx`, `app/(auth)/welcome.tsx`, `app/(auth)/signup.tsx`.
- **Navegación por Pestañas**: `app/(tabs)/_layout.tsx`
  - `index.tsx` (Inicio)
  - `traductor.tsx` (Traductor LESCO)
  - `tramites.tsx` (Trámites Rápidos)
  - `emergencias.tsx` (Emergencias SOS)
  - `perfil.tsx` (Perfil de Usuario)

---

## 4. Patrón de Estado Global (Zustand + MMKV)

Ubicación: `src/shared/stores/useAuthStore.ts`

```typescript
import { createMMKV, type MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

// Adapter MMKV con fallback in-memory seguro
let mmkvInstance: MMKV | null = null;
try {
  mmkvInstance = createMMKV({ id: 'lesconect-auth-storage' });
} catch (error) {
  console.warn('MMKV initialization fallback to in-memory state:', error);
}

const mmkvStateStorage: StateStorage = {
  setItem: (name, value) => mmkvInstance?.set(name, value),
  getItem: (name) => mmkvInstance?.getString(name) ?? null,
  removeItem: (name) => mmkvInstance?.remove(name),
};
```

---

## 5. Workflow de Verificación

Antes de declarar completada cualquier tarea:
1. Validar tipos con `npx tsc --noEmit`.
2. Probar que el servidor local inicia sin advertencias (`npx expo config` / `npm run start`).
3. Mantener y actualizar el archivo de reglas [`.agents/rules/proyecto-general.md`](file:///C:/Users/UTN/Documents/GitHub/LESCOnect/.agents/rules/proyecto-general.md).
