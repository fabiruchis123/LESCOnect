---
trigger: always_on
description: Reglas para la gestión de estado global (Zustand + MMKV / TanStack Query) y enrutamiento con Expo Router
---

# Estado Global y Navegación con Expo Router

## 1. División de Responsabilidades de Estado
- **Estado de Sesión y Autenticación Client-Side**: Gestionar exclusivamente con **Zustand** + **MMKV** (`react-native-mmkv`) en `src/shared/stores/useAuthStore.ts`.
  - Usar la función `createMMKV({ id: 'lesconect-auth-storage' })` para almacenamiento persistente de alta velocidad.
  - El adapter de storage DEBE incluir un `try/catch` de fallback seguro para evitar errores en entornos sin código nativo (Web / Expo Go).
- **Datos de Servidor e Inferencia de API**: Gestionar exclusivamente con **TanStack Query** (`@tanstack/react-query`). Evitar guardar datos remotos en Zustand de forma manual.

## 2. Estructura de Navegación (Expo Router v4)
- La navegación se basa exclusivamente en la carpeta `app/`.
- **Estructura de Grupos**:
  - `app/(auth)/`: Flujo no autenticado (`welcome.tsx`, `signup.tsx`).
  - `app/(tabs)/`: Pestañas inferiores de navegación principal (`index.tsx`, `traductor.tsx`, `tramites.tsx`, `emergencias.tsx`, `perfil.tsx`).
- **Redirección Centralizada (`app/_layout.tsx`)**:
  - El layout raíz evalúa el estado `isAuthenticated` y `isLoading` de `useAuthStore`.
  - Redirige a `/(auth)/welcome` si el usuario no tiene sesión iniciada.
  - Redirige a `/(tabs)` si el usuario ya cuenta con sesión activa.

## 3. Alias de Rutas
- Utilizar siempre el alias `@/*` que apunta a `src/*` definido en `tsconfig.json`.
