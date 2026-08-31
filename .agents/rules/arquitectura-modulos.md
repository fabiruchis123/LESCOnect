---
trigger: always_on
description: Convenciones estrictas para la creación y mantenimiento de módulos en src/modules/
---

# Arquitectura de Módulos (Feature-Sliced Design)

## 1. Plantilla de Estructura Obligatoria
Cada módulo dentro de `src/modules/` DEBE mantener obligatoriamente las siguientes 6 subcarpetas:

```
src/modules/<NombreModulo>/
├── components/   # Componentes UI reutilizables propios del módulo
├── hooks/        # Hooks personalizados con lógica de estado local o efectos del módulo
├── screens/      # Pantallas de la vista (Screens) consumidas por Expo Router
├── services/     # Llamadas a API, integraciones y servicios de negocio
├── styles/       # Hojas de estilo centralizadas (StyleSheet / tokens visuales)
├── types/        # Definiciones de tipos e interfaces de TypeScript
└── index.ts      # API pública del módulo (OBLIGATORIO)
```

## 2. Regla de API Pública (`index.ts`) y Encapsulamiento
- **Barrera de Exportación**: Cada módulo en `src/modules/<NombreModulo>/` DEBE exportar sus componentes, pantallas, hooks, servicios y tipos públicos a través de su archivo `index.ts`.
- **PROHIBIDO Importaciones Profundas Internas**: Ningún módulo o archivo fuera de `<NombreModulo>` debe importar directamente rutas internas como `src/modules/<NombreModulo>/screens/SomeScreen`.
  - ❌ **Incorrecto**: `import { WelcomeScreen } from '@/modules/Auth/screens/WelcomeScreen'`
  - ✅ **Correcto**: `import { WelcomeScreen } from '@/modules/Auth'`

## 3. Independencia y Acoplamiento
- Los módulos deben mantenerse desacoplados entre sí.
- Para comunicación global (p. ej. estado de sesión o tokens), utilizar la store compartida en `src/shared/stores/`.
