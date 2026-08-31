---
trigger: glob
glob: "src/modules/Auth/**"
description: Convenciones para la gestión de autenticación, sesión y credenciales de usuario
---

# Reglas de Autenticación y Seguridad

## Contexto y Alcance
Este módulo maneja el flujo de acceso, registro, sesión de usuario y gestión sensible de credenciales.

## Principios e Instrucciones
1. **Manejo Seguro de Credenciales**:
   - Nunca almacenar contraseñas, tokens JWT o llaves privadas en `AsyncStorage` o texto plano. Utilizar siempre almacenamiento seguro (p. ej. `expo-secure-store`).
   - Evitar imprimir datos sensibles (contraseñas, tokens, headers de autorización) en `console.log` o logs de depuración.

2. **Validación y Sanitización**:
   - Validar rigorosamente todos los campos de entrada (emails, contraseñas, códigos OTP) antes de enviarlos al backend.
   - Implementar control de expiración de token y refresco silencioso de sesión.

3. **Biometría y Cierre de Sesión**:
   - Asegurar que el cierre de sesión limpie completamente el almacenamiento local y el estado global de la aplicación.
