---
name: lesconect-security
description: Estándar integral de seguridad móvil (OWASP MASVS, Supabase RLS, privacidad de datos de emergencia SOS, autenticación OTP y sanitización) para LESCOnect.
---

# LESCOnect — Skill de Seguridad y Protección de Datos (Security & Hardening)

Esta skill guía la auditoría, diseño e implementación de medidas de seguridad en **LESCOnect** (Expo SDK 57 / React Native / Supabase / Cloudflare R2). Dado que LESCOnect maneja datos sensibles de personas sordas en Costa Rica (cédula de identidad, fecha de nacimiento, ubicación GPS y contactos de emergencia SOS 9-1-1), toda funcionalidad debe cumplir estos controles.

---

## 1. Autenticación, OTP por SMS y Gestión de Sesión
1. **Validación Estricta de Códigos OTP**:
   - Todo código OTP por SMS debe ser estrictamente numérico de 6 dígitos (`/^\d{6}$/`).
   - Implementar límite de intentos fallidos (rate-limiting / cooldown local y en servidor) y expiración temporal del código (máx. 5 minutos) para mitigar ataques de fuerza bruta.
   - Utilizar las APIs estándar del sistema operativo para autocompletado seguro de SMS (`autoComplete="sms-otp"` en Android y `textContentType="oneTimeCode"` en iOS) **sin solicitar el permiso invasivo `READ_SMS`**, protegiendo la privacidad del usuario y cumpliendo las políticas de Google Play Store.
2. **Almacenamiento y Ciclo de Vida de Sesión**:
   - No exponer tokens, llaves secretas ni datos personales en `console.log`, `console.warn` o reportes de error visibles.
   - Al ejecutar `logout()`, limpiar de forma atómica el estado en memoria, el almacenamiento persistente (`MMKV` / `AsyncStorage`) y cerrar la sesión de Supabase (`supabase.auth.signOut()`).

---

## 2. Sanitización y Validación de Entradas (Input Hardening)
1. **Cédula Nacional (Costa Rica)**:
   - Sanitizar permitiendo únicamente dígitos y guiones con formato válido (`X-XXXX-XXXX` o 9 a 12 dígitos para DIMEX/NITE).
2. **Teléfonos y Contactos SOS**:
   - Sanitizar números telefónicos eliminando caracteres de control o scripts antes de invocar esquemas `tel:` o `sms:`.
   - Limitar la longitud máxima de nombres, apellidos y frases de búsqueda/traducción para prevenir denegación de servicio en UI o abusos de API.
3. **Prevención de Inyección y XSS en Web/Native**:
   - Nunca usar evaluación dinámica de código (`eval`, `new Function`, `dangerouslySetInnerHTML`).
   - Validar que toda URI de video provenga exclusivamente del dominio autorizado de Cloudflare R2 (`https://*.r2.dev` o `FileSystem.documentDirectory`).

---

## 3. Seguridad de Backend (Supabase RLS & Cloudflare R2)
1. **Variables de Entorno**:
   - Solo exponer en el cliente variables con prefijo `EXPO_PUBLIC_` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_VIDEO_BASE_URL`).
   - **Prohibición absoluta**: Nunca incluir `service_role` de Supabase ni credenciales S3 (`Access Key ID` / `Secret Access Key` de R2) dentro del código fuente, `.env` de la app móvil ni `app.json`.
2. **Row Level Security (RLS)**:
   - `public.videos`: Solo lectura pública (`FOR SELECT`); escrituras bloqueadas para `anon` y `authenticated`.
   - `public.profiles`: Estricto aislamiento por fila (`auth.uid() = id`) en `SELECT`, `INSERT` y `UPDATE`.

---

## 4. Checklist de Auditoría Pre-Despliegue (APK Alpha)
- [ ] Cero secretos privados en el repositorio (`git status` / `.gitignore` protege `.env`).
- [ ] Permisos mínimos en `app.json` (solo `CAMERA` para el traductor de señas; sin permisos de lectura de SMS ni localización en segundo plano innecesaria).
- [ ] Validación y sanitización centralizada de entradas de usuario (`cedula`, `phone`, `otp`, `name`).
- [ ] Cierre de sesión limpia todos los datos de sesión de forma verificable.
- [ ] Compilación limpia con `npx tsc --noEmit` sin advertencias ni ciclos de dependencias.
