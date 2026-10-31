# LESCOnect — Reporte de Telefonía SMS, Permisos de Sistema y Arquitectura OTP Servidor

**Fecha de Actualización:** 31 de Octubre, 2026  
**Proyecto:** LESCOnect — Plataforma Móvil Inclusiva para la Comunidad Sorda  
**Ambiente:** React Native (Expo SDK 57) + Supabase Backend  

---

## Índice
1. [Diagnóstico de Capacidades de Supabase para Mensajería SMS](#1-diagnóstico-de-capacidades-de-supabase-para-mensajería-sms)
2. [Comparativa de Alternativas de Servidor OTP (Costos y Viabilidad para Costa Rica +506)](#2-comparativa-de-alternativas-de-servidor-otp)
3. [Arquitectura de Seguridad: Generación de Tokens en el Servidor (Zero-Trust Client)](#3-arquitectura-de-seguridad-generación-de-tokens-en-el-servidor)
4. [Lectura Automática de Mensajes en Dispositivos Móviles (Android / iOS)](#4-lectura-automática-de-mensajes-en-dispositivos-móviles)
5. [Gestión Unificada de Permisos en el Arranque de la Aplicación](#5-gestión-unificada-de-permisos-en-el-arranque-de-la-aplicación)
6. [Hoja de Ruta Recomendada (Low-Cost / Zero-Cost)](#6-hoja-de-ruta-recomendada)

---

## 1. Diagnóstico de Capacidades de Supabase para Mensajería SMS

### ¿Tiene Supabase infraestructura propia de SMS?
**No.** Supabase implementa un modelo **BYOP (Bring Your Own Provider)**:
* Supabase gestiona la capa de identidad: sesiones JWT, expiración de tokens, hashing y políticas RLS.
* Para el transporte físico de mensajes telefónicos (SMS), Supabase se conecta a pasarelas externas que el desarrollador debe configurar con sus propias credenciales y saldo.

### Proveedores Nativos en el Dashboard de Supabase
1. **Twilio (Programmable Messaging):** Envía SMS mediante la API REST de Twilio usando un `Messaging Service SID` o número telefónico emisor.
2. **Twilio Verify:** Valida los códigos directamente en la nube de Twilio (modelo de verificación por sesión exitosa).
3. **Vonage (Nexmo):** Envío de SMS mediante API Key/Secret.
4. **MessageBird (Bird):** Pasarela omnicanal transaccional.

### Extensibilidad con "Send SMS Auth Hook"
Si se desea utilizar proveedores distintos (Sinch, Infobip, AWS SNS o pasarelas locales centroamericanas), Supabase permite configurar un **Send SMS Hook** que redirige el evento de autenticación hacia una Edge Function o endpoint HTTP REST externo.

---

## 2. Comparativa de Alternativas de Servidor OTP

### A. Firebase Phone Auth (Identity Platform)
* **¿Es gratuito?** No para producción masiva. Phone Auth **no está disponible en el plan gratuito Spark**. Requiere tarjeta de crédito en el plan Blaze.
* **Cuota de prueba:** Otorga únicamente **10 SMS gratuitos al día** (~300/mes).
* **Costo para Costa Rica (+506):** Entre **$0.06 y $0.15 USD por SMS** en operadores locales (Kölbi, Liberty, Claro).
* **Riesgo:** Alto riesgo de *SMS Toll Fraud (AIT)* si no se configuran límites estrictos en Google Cloud.

### B. WhatsApp Cloud API (Meta for Developers) — *Alternativa #1 Recomendada*
* **Funcionamiento:** Envío de OTP mediante mensajes oficiales de WhatsApp usando **Authentication Templates**.
* **Costo para Costa Rica:** Tarifa oficial de Meta para "Rest of Latin America" de **$0.0113 USD (~₡5.7 colones)** por código entregado (frente a $0.1031 de Twilio SMS: **es casi 10 veces más económico**).
* **Ventajas en Costa Rica:**
  * Penetración en smartphones >95%.
  * Tasa de entrega >98% sin bloqueos de operadoras locales.
  * Soporte de botones interactivos nativos: **"Copiar Código"** y **"Autocompletar (One-Tap)"**.

### C. Proveedores CPaaS de SMS Tradicionales (Twilio / Sinch / Infobip)
* **Twilio:** ~$0.1031 USD por segmento SMS a Costa Rica (+506).
* **Sinch / Infobip:** ~$0.05 a $0.09 USD por SMS.
* **Limitantes en Costa Rica:** No existen números locales +506 virtuales con SMS bidireccional; los mensajes llegan desde números internacionales (+1 de EE.UU.), y están expuestos a filtros anti-spam de operadoras locales.

### D. Gateway SMS Android Local con SIM Prepago (Para Desarrollo / Pruebas)
* **Herramienta:** Servidor de código abierto `capcom6/android-sms-gateway` instalado en un smartphone Android secundario con tarjeta SIM prepago física.
* **Costo en Costa Rica:** Paquetes prepago de 500-1,000 SMS por ₡1,000 - ₡2,000 CRC (~$2 a $4 USD/mes). Costo por SMS: prácticamente **$0.002 USD**.
* **Uso:** Exclusivo para pruebas de laboratorio y desarrollo Alpha.

---

## 3. Arquitectura de Seguridad: Generación de Tokens en el Servidor

### Principio Zero-Trust Client
La aplicación del cliente **nunca debe generar el código OTP ni recibirlo en la respuesta JSON** del servidor.

### Flujo Implementado
1. **Base de Datos PostgreSQL (`phone_verifications_schema.sql`):**
   * Tabla `public.phone_verifications` protegida con RLS (acceso público denegado).
   * Función `generate_server_phone_otp`: Genera criptográficamente 6 dígitos con `crypto.getRandomValues()` / `gen_random_bytes(16)`, almacena el hash `SHA-256(code || salt)` con expiración de 5 minutos y cooldown de 60 segundos.
   * Función `verify_server_phone_otp`: Valida el código contra el hash en tiempo constante, limita a 3 intentos fallidos y vincula la sesión con el perfil del usuario.
2. **Supabase Edge Function (`auth-otp-server`):**
   * `POST /auth-otp-server` con `{ action: "send", phone: "+50688888888" }` ejecuta la función de base de datos, despacha el mensaje al canal externo (WhatsApp Cloud API / SMS) y responde al cliente únicamente con:
   ```json
   {
     "success": true,
     "maskedPhone": "+506 ****-8888",
     "expiresIn": 300,
     "cooldownSeconds": 60,
     "channel": "whatsapp"
   }
   ```
   * El código secreto no se expone al cliente.

---

## 4. Lectura Automática de Mensajes en Dispositivos Móviles

### Restricción de Google Play Store para `READ_SMS`
Google Play **rechaza automáticamente** cualquier aplicación que declare los permisos `READ_SMS` o `RECEIVE_SMS` en su manifiesto si no es la aplicación predeterminada de SMS del sistema.

### Soluciones Oficiales y Transparentes
1. **Android SMS Retriever API:**
   * Permite que el sistema operativo entregue automáticamente el mensaje SMS a la app sin requerir permisos peligrosos ni intervención del usuario.
   * El SMS del servidor debe incluir al final el **hash de 11 caracteres** calculado a partir de la firma del APK/AAB:
     ```text
     <#> LESCOnect: Tu código de verificación es: 749201. Válido por 5 minutos.
     FA+9qCX9VSu
     ```
2. **WhatsApp One-Tap Autofill:**
   * La plantilla de autenticación de WhatsApp incluye el botón interactivo nativo *"Autocompletar"*, que pasa el código directamente a la app por un Intent seguro en memoria.
3. **iOS (Apple One-Time Code):**
   * iOS no permite lectura de SMS por sandbox, pero con `textContentType="oneTimeCode"` y `autoComplete="sms-otp"` en el campo de texto, el teclado de iOS ofrece el código con un solo toque tan pronto como llega la notificación.

---

## 5. Gestión Unificada de Permisos en el Arranque de la Aplicación

Se implementó el servicio centralizado [`appPermissionsService.ts`](file:///D:/GitHub/LESCOnect/src/shared/services/appPermissionsService.ts) y se integró en [`app/_layout.tsx`](file:///D:/GitHub/LESCOnect/app/_layout.tsx) para solicitar ordenadamente durante la pantalla de carga (Splash de 10s):

1. **Ubicación GPS Satelital (`expo-location`):**
   * Permisos: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
   * Propósito: Coordenadas satelitales en tiempo real para las alertas de auxilio a la red SOS.
2. **Agenda de Contactos (`expo-contacts`):**
   * Permisos: `READ_CONTACTS`.
   * Propósito: Permite al usuario presionar el botón interactivo **"📱 Elegir de mi Agenda Telefónica"** en [`AddSosContactScreen.tsx`](file:///D:/GitHub/LESCOnect/src/modules/Emergencias/screens/AddSosContactScreen.tsx) para importar familiares y amigos como contactos SOS sin digitación manual.
3. **Cámara (`expo-camera`):**
   * Permisos: `CAMERA`.
   * Propósito: Traductor visual e intérprete en tiempo real de señas dactilológicas LESCO.
4. **Mensajería SMS (Android):**
   * Permisos: `READ_SMS`, `RECEIVE_SMS`.
   * Declarados en `app.json` para builds locales/sideload y respaldados por la arquitectura SMS Retriever API para producción en Play Store.
5. **Almacenamiento y Archivos:**
   * Permisos: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`.
   * Propósito: Precarga y almacenamiento local en caché de los videos del catálogo LESCO para modo 100% offline.

---

## 6. Hoja de Ruta Recomendada

```
                        ┌──────────────────────────────────────────────┐
                        │              LESCOnect Cliente               │
                        │    (Solicita inicio con teléfono +506)       │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │            Supabase Edge Function            │
                        │             (auth-otp-server)                │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │            PostgreSQL Seguro (DB)            │
                        │      • Genera código crypto 6 dígitos        │
                        │      • Almacena SHA-256(code || salt)        │
                        │      • Expiración 5 min / Límite 3 intentos  │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │      Canal Principal (Ultra Low-Cost)        │
                        │         Meta WhatsApp Cloud API              │
                        │     (~$0.0113 USD / Entrega inmediata)       │
                        └──────────────────────┬───────────────────────┘
                                               │
                               (Si no tiene WhatsApp / Fallback 90s)
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             Canal Secundario SMS             │
                        │    Twilio SMS / Gateway SIM Local Prepago    │
                        │      (Formato Android SMS Retriever)         │
                        └──────────────────────────────────────────────┘
```

1. **Fase Inmediata (Pruebas Alpha):**
   * Utilizar números de prueba registrados en Supabase con OTP fijo (`+50688888888` -> `123456`) sin consumo de saldo.
   * Para pruebas con celulares reales, usar la app libre `capcom6/android-sms-gateway` con SIM prepago local costarricense.
2. **Fase Producción (Beta / Tiendas):**
   * Habilitar WhatsApp Cloud API en Meta for Developers con plantilla de autenticación (`auth_otp_code`).
   * Configurar el hash de 11 caracteres de la SMS Retriever API para el fallback de SMS tradicional.
   * Publicar en Google Play Store cumpliendo 100% de las políticas sin rechazos de seguridad.
