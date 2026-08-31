# LESCOnect — Guía de Configuración para Agentes AI

## Documentación de Expo
- **Versión Oficial**: Expo `v57.0.0`
- Consultar siempre la documentación versionada en [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) antes de escribir o modificar código del proyecto.

## Reglas del Proyecto y Habilidades (`.agents/`)
Todas las convenciones de arquitectura, estado global, navegación por grupos en Expo Router y los 8 módulos están documentadas en:

1. **Reglas del Proyecto**:
   - [`.agents/rules/proyecto-general.md`](file:///.agents/rules/proyecto-general.md): Stack general (Expo 57, RN 0.86, React 19, TS 6.0, Expo Router, Zustand+MMKV, TanStack Query).
   - [`.agents/rules/arquitectura-modulos.md`](file:///.agents/rules/arquitectura-modulos.md): Plantilla de 6 subcarpetas por módulo y barrera de API pública (`index.ts`).
   - [`.agents/rules/estado-y-navegacion.md`](file:///.agents/rules/estado-y-navegacion.md): Autenticación con Zustand + MMKV y rutas `app/(auth)` / `app/(tabs)`.

2. **Skill de Desarrollo**:
   - [`.agents/skills/lesconect-dev-workflow/SKILL.md`](file:///.agents/skills/lesconect-dev-workflow/SKILL.md): Guía de referencia técnica y flujo de trabajo para agentes.
