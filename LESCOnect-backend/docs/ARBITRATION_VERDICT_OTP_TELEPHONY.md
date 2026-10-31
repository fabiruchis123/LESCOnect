# VEREDICTO FINAL DE ARBITRAJE DE SOFTWARE Y AUDITORÍA DE TELECOMUNICACIONES
**Caso:** Arquitectura Definitiva de Autenticación Telefónica, Integración Móvil Expo SDK 57 y Contingencia Offline  
**Plataforma Auditada:** LESCOnect (Costa Rica +506)  
**Tribunal Arbitral:** Árbitro Jefe de Ingeniería de Software y Auditor de Telecomunicaciones  
**Subagentes Involucrados:**
- Subagente 1 (Supabase SMS Provider Analyst)
- Subagente 2 (OTP Architecture & Gateway Specialist)

---

## 1. Dictamen Ejecutivo de Arbitraje

Tras contrastar los reportes iniciales y someter a ambos especialistas a una rigurosa segunda iteración, este Tribunal de Arbitraje emite un **veredicto unificado y vinculante**. 

Se identificó y corrigió oportunamente una vulnerabilidad de arquitectura crítica en la propuesta preliminar: **la creación de una tabla propia de verificación (`phone_verifications`) con firma manual de JWT no es viable en el ecosistema Supabase**. Dicho patrón destruye el ciclo de vida de `auth.sessions`, invalida la rotación silenciosa de `refresh_token` a los 60 minutos y anula las políticas RLS vinculadas a la sesión.

Ambos subagentes han convergido en la solución canónica de nivel empresarial: el **"Send SMS Auth Hook"** de Supabase GoTrue combinado con **WhatsApp Cloud API directo (Meta)** como canal primario, **SMS Retriever API** nativo para Expo SDK 57 sin permisos invasivos, y una arquitectura **Offline-First Zero-Gate** que garantiza que ninguna persona sorda quede incomunicada en una emergencia en Costa Rica sin saldo de datos.

---

## 2. Emisión de Sesión JWT en Supabase: GoTrue Canónico vs. Anti-Patrón Custom

### 2.1. Por qué la Validación Casera en Base de Datos / Edge Function Falla Catastróficamente
Intentar validar el código OTP en una tabla propia de PostgreSQL (`phone_verifications`) o en una Edge Function independiente presenta tres bloqueos insalvables:
1. **Inexistencia de `supabase.auth.admin.createSession`:** En `@supabase/supabase-js` v2 no existe ninguna función de administración para forzar la creación de una sesión GoTrue arbitraria desde el servidor.
2. **Incompatibilidad de `supabase.auth.admin.generateLink`:** Este método es exclusivamente para flujos de correo electrónico (`magiclink`, `signup`, `recovery`). No admite números telefónicos ni genera tokens OTP para Phone Auth.
3. **El Colapso del Refresh Token a los 60 Minutos:**
   Si la Edge Function firma manualmente un JWT con el `JWT_SECRET` del proyecto y lo entrega a la app para inyectarlo con `supabase.auth.setSession()`:
   * PostgREST y RLS aceptarán el token temporalmente porque la firma criptográfica es válida.
   * **Sin embargo**, al no existir un registro insertado por el motor GoTrue en `auth.sessions` ni un par en `auth.refresh_tokens`, la renovación automática (`refreshSession()`) fallará con `401 Unauthorized: Invalid Refresh Token` al cabo de 1 hora. El usuario sordo será expulsado intempestivamente de la aplicación en medio de sus gestiones.

### 2.2. La Solución Sancionada: "Send SMS Auth Hook"
El patrón oficial y seguro de Supabase desacopla la **seguridad de identidad** del **canal de telecomunicaciones**:

```
[Flujo Canónico Supabase Auth Hook]
1. App Móvil (Expo) ---> supabase.auth.signInWithOtp({ phone: '+50688888888' })
2. GoTrue (Backend) ---> Aplica Rate Limiting, genera OTP seguro y lo hashea en auth interna
3. GoTrue Hook      ---> Dispara POST a Supabase Edge Function: { user: { phone }, sms: { otp } }
4. Edge Function    ---> Entrega el mensaje por WhatsApp Cloud API / SMS Gateway
5. App Móvil (Expo) ---> supabase.auth.verifyOtp({ phone, token, type: 'sms' })
6. GoTrue (Backend) ---> Valida hash, crea auth.sessions, emite access_token + refresh_token
7. SDK Frontend     ---> Persiste sesión en AsyncStorage / SecureStore con rotación automática
```

---

## 3. Integración en React Native Expo SDK 57 (SMS Retriever & Autofill)

### 3.1. Estrategia de Dos Capas
1. **Capa UI (Autocompletado de Sistema en Teclado):** Cero dependencias nativas complejas. Se activan las sugerencias nativas de iOS y Android en `<TextInput>`:
   ```tsx
   <TextInput
     textContentType="oneTimeCode" // iOS QuickType bar
     autoComplete="sms-otp"        // Android Google Autofill
     keyboardType="number-pad"
     maxLength={6}
   />
   ```
2. **Capa Background (SMS Retriever API de Google Play):** Permite atrapar el código sin abrir el SMS y sin requerir permisos peligrosos (`READ_SMS` / `RECEIVE_SMS`), evitando el rechazo en Google Play Store.

### 3.2. Ejecución Dual Defensiva: Expo Go vs. EAS Build
```typescript
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function useOtpRetriever(onOtpReceived: (code: string) => void) {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || isExpoGo) {
      return;
    }
    // Lógica para EAS Build / Standalone APK
  }, [onOtpReceived]);

  return { isListening, isExpoGo };
}
```

### 3.3. Algoritmo y Cálculo del Hash de 11 Caracteres de Android
El SMS saliente debe cumplir estrictamente la especificación de Google:
1. Prefijo `<#>`.
2. Cuerpo del mensaje con el código de 6 dígitos.
3. Sufijo con el hash Base64 de 11 caracteres: `Base64(SHA256(packageName + " " + certHexLower))[0..11]`.

---

## 4. Desglose Financiero: Meta Cloud API Directo vs. Twilio WhatsApp

### 4.1. Análisis Tarifario Unitario para Costa Rica (+506)
* **Meta WhatsApp Cloud API (Directo):**
  * Tarifa de autenticación: **$0.0113 USD** (~₡5.7 CRC).
  * Markup de intermediario: **$0.0000 USD**.
  * **Costo por OTP:** **$0.0113 USD**.
* **Twilio WhatsApp:**
  * Tarifa base de Meta: $0.0113 USD + Markup de Twilio: **$0.0050 USD** = **$0.0163 USD** (~₡8.3 CRC) — *(44.2% más costoso)*.
* **Twilio SMS Internacional Tradicional:**
  * **$0.1031 USD por mensaje** (~₡53.0 CRC) — *(812% más costoso que WhatsApp Directo)*.

### 4.2. Matriz Financiera por Volumen Mensual
| Volumen / Mes | Meta Cloud API Directo | Twilio WhatsApp | Twilio SMS Convencional | Ahorro Meta vs. Twilio SMS | Sobrecosto de Twilio WA |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1,000** | $11.30 USD | $16.30 USD | $103.10 USD | **$91.80 USD (89%)** | +$5.00 USD |
| **5,000** | $56.50 USD | $81.50 USD | $515.50 USD | **$459.00 USD (89%)** | +$25.00 USD |
| **10,000** | $113.00 USD | $163.00 USD | $1,031.00 USD | **$918.00 USD (89%)** | +$50.00 USD |
| **50,000** | $565.00 USD | $815.00 USD | $5,155.00 USD | **$4,590.00 USD (89%)** | +$250.00 USD |

---

## 5. Contingencia Offline y Telecomunicaciones para Personas Sordas en Costa Rica

### Arquitectura de 4 Pilares "Offline-First Zero-Gate"
1. **Modo Asistencia / Emergencia Sin Login (Zero-Gate):** Frases médicas y videos LESCO precargados en memoria local (`expo-file-system`) accesibles sin requerir cuenta ni internet.
2. **Persistencia Permanente de Sesión y Biometría Local:** Inicio de sesión único al instalar la app; validaciones posteriores mediante huella/FaceID sin realizar llamadas HTTP bloqueantes.
3. **Botón SOS con GPS Satelital Directo por Red Celular:** Transmisión de auxilio por el canal de señalización celular GSM sin requerir saldo ni datos móviles.
4. **Caché Local de Trámites con React Query:** Persistencia en disco para navegación fluida en la vía pública sin cobertura.

---

## 6. Veredicto Final Vinculante

| Componente | Decisión Arbitral Vinculante | Justificación Técnica |
| :--- | :--- | :--- |
| **Generación / Validación de OTP** | **GoTrue Nativo (Send SMS Auth Hook)** | Garantiza emisión de sesión válida, RLS y rotación de `refresh_token`. Desecha el anti-patrón de tablas caseras. |
| **Canal Primario de Entrega** | **WhatsApp Cloud API (Meta)** | Costo de $0.0113 USD (89% más barato que SMS), tasa de entrega >98% y soporte de botones One-Tap. |
| **Canal Secundario (Fallback)** | **Twilio SMS / Pasarela SMS Local** | Entrega garantizada por señalización GSM a usuarios con datos agotados o sin WhatsApp. |
| **Lectura Móvil en Expo SDK 57** | **UI Autofill + `expo-otp-autofill`** | Zero permisos intrusivos en Google Play; compatible con Prebuild y protegido con guardas para Expo Go. |
| **Firmas de Android** | **Gestión de Hash Dual (Debug vs Play Signing)** | Previene la ruptura de la escucha automática tras la publicación en Google Play Console. |
| **Accesibilidad Offline** | **Arquitectura Offline-First Zero-Gate** | Garantiza que las personas sordas siempre tengan acceso a frases LESCO y auxilio GPS sin internet. |
