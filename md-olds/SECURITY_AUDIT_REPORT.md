# Reporte de Auditoría de Seguridad Integral y Endurecimiento (Hardening) — LESCOnect

**Fecha de Auditoría:** 30 de octubre de 2026  
**Estándar de Referencia:** OWASP Mobile Top 10 (2024) / OWASP MASVS v2.0 / Skill `lesconect-security`  
**Alcance:** Aplicación Móvil (Expo SDK 57 / React Native), Estado Global (`useAuthStore` + MMKV), Cliente Backend (`Supabase` + `Cloudflare R2`), y Esquema de Base de Datos (`lesconect_supabase.sql`).

---

## 1. Resumen Ejecutivo

**LESCOnect** gestiona información personal y crítica de la comunidad sorda costarricense: número de cédula de identidad nacional (o DIMEX/NITE), fecha de nacimiento, número telefónico, geolocalización en emergencias SOS 9-1-1 y contactos de auxilio.

Esta auditoría evaluó la superficie de ataque completa de la aplicación y aplicó controles de endurecimiento (*hardening*) preventivos y defensivos en tiempo de ejecución:
1. **Creación del Módulo Central de Seguridad (`src/shared/utils/security.ts`)** con validación estricta para identificaciones de Costa Rica, teléfonos nacionales, códigos OTP de 6 dígitos, limitador de intentos contra fuerza bruta (`OtpRateLimiter`), listas blancas de dominios para streaming de video R2 y enmascaramiento de datos sensibles.
2. **Endurecimiento de Sesión y Estado Persistente (`src/shared/stores/useAuthStore.ts`)** mediante sanitización automática de entradas en `login()` y `updateUser()`, y purga atómica de sesión (`MMKV` + memoria + `supabase.auth.signOut()`) al ejecutar `logout()`.
3. **Mitigación de Path Traversal en CDN (`src/lib/supabase.ts`)** asegurando que toda clave `r2Key` sea normalizada y depurada antes de construir URLs hacia Cloudflare R2.
4. **Protección de Secretos Criptográficos (`.gitignore`)** bloqueando explícitamente archivos `.env`, `.env.local`, `.env.*.local`, certificados y llaves de firmado (`*.pem`, `*.key`, `*.jks`, `*.keystore`).

---

## 2. Evaluación por Vectores de Seguridad (OWASP Mobile Top 10 / MASVS)

### 2.1 M1: Uso Inadecuado de Credenciales y Secretos (MASVS-STORAGE / MASVS-CRYPTO)
- **Variables Expuestas al Cliente:** En `src/lib/supabase.ts` únicamente se consumen variables prefijadas con `EXPO_PUBLIC_` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` —llave pública `anon`/`publishable` diseñada para clientes con RLS activo— y `EXPO_PUBLIC_VIDEO_BASE_URL`).
- **Aislamiento de Llaves Privadas:** Ninguna credencial administrativa (`SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` ni llaves privadas de IA/Gemini) se incluye en el código fuente móvil ni en `app.json`.
- **Protección en Control de Versiones (`.gitignore`):** Se reforzó `.gitignore` para ignorar `.env`, `.env.local`, `.env.*.local`, `.env.*` (permitiendo únicamente la plantilla pública `!.env.example`), además de almacenes de claves de compilación Android/iOS (`*.pem`, `*.key`, `*.jks`, `*.keystore`).

### 2.2 M2: Seguridad de la Cadena de Suministro y Orígenes de Contenido (Cloudflare R2 & APIs)
- **Dominio Autorizado de Videos LESCO:** El catálogo de 54 videos oficiales reside en Cloudflare R2 bajo HTTPS (`https://pub-0ebf0c8bab3b45ef96fb0dc2ee21adf8.r2.dev`).
- **Prevención de Path Traversal e Inyección de URLs:**
  - `sanitizeR2Key(r2Key)` en `src/shared/utils/security.ts` filtra segmentos `.`, `..`, barras invertidas `\`, caracteres de control ASCII y cualquier carácter fuera de `[a-zA-Z0-9._-]`.
  - `videoUrl()` en `src/lib/supabase.ts` aplica `sanitizeR2Key()` obligatoriamente antes de interpolar la ruta vertical u horizontal.
  - `isTrustedVideoUrl(url)` verifica que cualquier URI de reproducción provenga exclusivamente del host HTTPS autorizado en Cloudflare R2 o del almacenamiento local seguro del dispositivo (`file:///`), rechazando esquemas inseguros (`http:`, `javascript:`, `data:`).

### 2.3 M3: Autenticación y Gestión de Sesión Insegura (OTP & Ciclo de Vida)
- **Validación Estricta de OTP:** `validateOtpCode(code)` exige coincidencia exacta con `/^\d{6}$/`, bloqueando payloads alfanuméricos o inyecciones.
- **Protección contra Fuerza Bruta (`OtpRateLimiter`):** Implementado en `src/shared/utils/security.ts` con un máximo de **5 intentos fallidos** y ventana de enfriamiento (*cooldown*) de **60 segundos**, exponiendo `canAttempt()`, `recordFailure()`, `getRemainingCooldownSeconds()` y `recordSuccess()`.
- **Autocompletado Nativo sin Permisos Invasivos:** Se utilizan propiedades estándar del sistema operativo (`autoComplete="sms-otp"` / `textContentType="oneTimeCode"`) sin declarar el permiso restringido `READ_SMS`.
- **Cierre de Sesión Atómico (`logout`):** En `src/shared/stores/useAuthStore.ts`, `logout()` limpia inmediatamente el estado en memoria (`user: null, token: null, isAuthenticated: false`), elimina la clave `'lesconect-auth'` en `mmkvStateStorage` y `memoryStorage`, e invoca `supabase.auth.signOut().catch(() => {})`.

### 2.4 M4: Validación Insuficiente de Entradas y Salidas (Input Hardening)
- **Sanitización General (`sanitizeText`):** Remueve caracteres de control Unicode/ASCII invisibles (`\u0000-\u001F`, zero-width spaces), etiquetas HTML (`<`, `>`), y esquemas ejecutables (`javascript:`, `vbscript:`, `data:`), aplicando límites estrictos de longitud.
- **Identificación Costarricense (`validateAndFormatCedulaCR`):** Valida y formatea automáticamente:
  - Cédula física nacional: 9 dígitos (`X-XXXX-XXXX`, provincia 1–9).
  - Cédula jurídica: 10 dígitos (`X-XXX-XXXXXX`).
  - DIMEX / NITE: 11 a 12 dígitos numéricos.
- **Telefonía Nacional (`validateCRPhone`):** Valida números de 8 dígitos de Costa Rica que inicien en `2, 4, 5, 6, 7, 8` (soportando normalización de prefijo `+506`) y formatea como `XXXX-XXXX` antes de usarlos en esquemas `tel:` o `sms:`.
- **Sanitización Automática en Store:** Tanto `login()` como `updateUser()` en `useAuthStore.ts` pasan todos los campos del perfil y la lista `sosContacts` (máximo 10 contactos) por `sanitizeUserPayload()`.

### 2.5 M6 & M8: Controles de Privacidad, Permisos Móviles y Contactos SOS
- **Principio de Mínimo Privilegio en `app.json`:**
  - Android solicita únicamente `CAMERA` / `android.permission.CAMERA` (requerido para el traductor dactilológico LESCO en tiempo real).
  - iOS declara `NSCameraUsageDescription` con propósito claro y transparente.
  - No se solicitan permisos invasivos en segundo plano (`ACCESS_BACKGROUND_LOCATION`, `READ_SMS`, `READ_CALL_LOG`).
- **Privacidad de Contactos SOS y Enmascaramiento:**
  - `maskSensitiveData(value, visibleEnd)` permite enmascarar números de cédula y teléfonos (`*******0188`) en registros o vistas parciales.
  - Los números de emergencia SOS son validados y limpiados antes de almacenarse en el perfil del usuario.

### 2.6 M9: Almacenamiento de Datos y Row Level Security (Supabase PostgreSQL)
Auditoría del esquema `LESCOnect-backend/supabase/lesconect_supabase.sql`:

| Tabla | RLS Activo | Políticas Configuradas | Nivel de Riesgo |
| :--- | :---: | :--- | :---: |
| `public.videos` | Sí (`ENABLE ROW LEVEL SECURITY`) | `SELECT` público para `anon` y `authenticated` (`using (true)`). Sin políticas `INSERT`/`UPDATE`/`DELETE` (escritura denegada por defecto para clientes). | Bajo (Seguro) |
| `public.profiles` | Sí (`ENABLE ROW LEVEL SECURITY`) | Aislamiento estricto por fila para rol `authenticated`: `SELECT` (`auth.uid() = id`), `UPDATE` (`auth.uid() = id`), `INSERT` (`with check (auth.uid() = id)`). | Bajo (Seguro) |

---

## 3. Verificación del Checklist Pre-Despliegue (`lesconect-security`)

- [x] **Cero secretos privados en el repositorio:** `.gitignore` protege `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `*.jks`, `*.keystore` manteniendo `!.env.example`.
- [x] **Permisos mínimos en `app.json`:** Único permiso nativo declarado: `CAMERA` para traducción de señas; cero permisos de lectura de SMS (`READ_SMS`) ni localización en segundo plano innecesaria.
- [x] **Validación y sanitización centralizada de entradas de usuario:** Implementada en `src/shared/utils/security.ts` (`sanitizeText`, `validateAndFormatCedulaCR`, `validateCRPhone`, `validateOtpCode`, `OtpRateLimiter`, `isTrustedVideoUrl`, `maskSensitiveData`) e integrada en `useAuthStore.ts` y `src/lib/supabase.ts`.
- [x] **Cierre de sesión limpia todos los datos de sesión de forma verificable:** `useAuthStore.getState().logout()` reinicia estado en memoria, purga la clave `lesconect-auth` en MMKV/LocalStorage y cierra sesión en Supabase Auth.
- [x] **Compilación limpia con `npx tsc --noEmit`:** Verificada con código de salida `0`, sin errores de tipos ni dependencias circulares.
