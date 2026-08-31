---
trigger: always_on
description: Reglas y convenciones generales del proyecto LESCOnect
---

# Proyecto General - LESCOnect

## Stack Tecnológico
- **Expo**: `~57.0.18`
- **React Native**: `0.86.3`
- **React**: `19.2.3`
- **TypeScript**: `~6.0.3`
- **Navegación**: Expo Router (app/ con grupos (auth) y (tabs))
- **Estado de sesión**: Zustand + MMKV
- **Datos de servidor**: TanStack Query

## Arquitectura de Proyecto
- **Estructura por Features**: Organización basada en módulos (*features*) dentro de `src/modules/`.
- Cada módulo agrupa los componentes, hooks, servicios y tipos pertenecientes a esa funcionalidad particular.
- **API Pública de Módulos**: Cada módulo en `src/modules/` debe exponer su API pública vía `index.ts` — prohibido importar archivos internos de otro módulo directamente.

## Convenciones y Guías
- **Documentación de Expo**: Leer siempre la documentación exacta versionada en [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) antes de implementar o modificar código.
- **Plugins**: Se mantiene la configuración activa del plugin oficial de Expo (`expo@claude-plugins-official`).

## Contexto Adicional
- @AGENTS.md contiene contexto adicional y reglas específicas para compatibilidad con otras herramientas (como Claude Code).


