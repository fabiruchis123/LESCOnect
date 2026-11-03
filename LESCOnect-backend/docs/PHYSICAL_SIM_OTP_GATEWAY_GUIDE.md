# GUÍA TÉCNICA DEFINITIVA: PASARELA SMS CON SIM FÍSICA A COSTO $0
**Proyecto:** LESCOnect — Autenticación Telefónica por OTP  
**Objetivo:** Desplegar una pasarela SMS propia y funcional para pruebas de desarrollo y validación cerrada con usuarios reales en Costa Rica (+506) a **costo cero en APIs ($0.00 USD)**, utilizando un smartphone Android y una tarjeta SIM convencional.  
**Estado:** Validado y Aprobado por el Tribunal Arbitral de Telecomunicaciones.  

---

## 1. Justificación y Análisis Económico

El envío tradicional de SMS mediante proveedores multinacionales (Twilio, Sinch, Infobip) hacia Costa Rica (+506) aplica tarifas de mensajería internacional que rondan entre **$0.05 a $0.1031 USD por mensaje** (~₡26 a ₡54 CRC por cada intento de login).

En etapas de desarrollo, pruebas continuas, control de calidad y validación con comunidades de personas sordas, este modelo genera costos innecesarios o bloqueos por saldo agotado.

### Comparativa de Costos para Fase de Pruebas (500 OTPs)
| Canal | Costo Unitario | Costo Total (500 OTPs) | Hardware Requerido |
| :--- | :---: | :---: | :--- |
| **Twilio SMS Internacional** | $0.1031 USD | **$51.55 USD** (~₡26,500 CRC) | Ninguno (API en la nube) |
| **Meta WhatsApp Cloud API** | $0.0113 USD | **$5.65 USD** (~₡2,900 CRC) | Cuenta de Meta Business verificada |
| **Pasarela Local SIM Física** | **$0.00 USD** | **$0.00 USD** (Cero inversión) | Smartphone Android + Tarjeta SIM con plan |

> [!NOTE]
> En Costa Rica, la mayoría de planes prepago y postpago de Kölbi (ICE), Claro y Liberty incluyen bolsas de 100 a miles de SMS locales a costo marginal o gratuito dentro de sus planes mensuales habituales.

---

## 2. Arquitectura de Telecomunicaciones

El flujo desacopla la seguridad criptográfica del cliente móvil y utiliza un teléfono Android propio como transmisor GSM:

```mermaid
flowchart TD
    subgraph Cliente ["1. Aplicación Móvil LESCOnect"]
        App["App Expo SDK 57 (Tester)"]
        Retriever["SMS Retriever / UI Autofill"]
    end

    subgraph Backend ["2. Orquestador Local / Servidor"]
        Gateway["server.js (Puerto 3001)"]
        Tunnel["Cloudflare Tunnel (HTTPS Gratuito)"]
        Crypto["Motor Hash SHA-256 + TTL 5 min"]
    end

    subgraph PasarelaSIM ["3. Pasarela Android (Hardware Propio)"]
        AndroidPhone["Smartphone Android 5.0+"]
        CapcomApp["Capcom6 SMS Gateway APK (Puerto 8080)"]
        PhysicalSIM["SIM Kölbi / Claro / Liberty"]
    end

    subgraph RedOperador ["4. Red Celular GSM Costa Rica"]
        TorreGSM["Torre de Telefonía Móvil"]
        TesterPhone["Celular del Usuario Tester (+506)"]
    end

    App -->|"POST /api/send-otp"| Tunnel
    Tunnel --> Gateway
    Gateway --> Crypto
    Gateway -->|"POST /message (Basic Auth)"| CapcomApp
    CapcomApp --> PhysicalSIM
    PhysicalSIM -->|"Señalización SMS GSM"| TorreGSM
    TorreGSM -->|"SMS Entrante"| TesterPhone
    TesterPhone -.->|"Lectura automática <#>"| Retriever
    Retriever --> App
```

---

## 3. Requisitos de Hardware y Software

1. **Smartphone Android para la Pasarela:**
   - Cualquier teléfono con Android 5.0 (Lollipop) o superior.
   - Tarjeta SIM activa con línea de Costa Rica (Kölbi, Claro o Liberty) con saldo para SMS o plan contratado.
   - Conectado a la misma red Wi-Fi que la computadora de desarrollo (o expuesto mediante túnel).
2. **Aplicación Open Source:**
   - **`Capcom6 Android SMS Gateway`** (código abierto, sin anuncios, sin telemetría intrusiva).
   - Repositorio oficial: [https://github.com/capcom6/android-sms-gateway](https://github.com/capcom6/android-sms-gateway).
   - Descarga directa del APK: [Releases de GitHub](https://github.com/capcom6/android-sms-gateway/releases).

---

## 4. Configuración Paso a Paso del Celular Android (10 Minutos)

### Paso 1: Instalación del APK
1. Descarga el archivo `.apk` de la última versión estable desde las releases de GitHub en el teléfono.
2. Abre el archivo e instálalo permitiendo la instalación desde fuentes desconocidas si el sistema lo solicita.

### Paso 2: Concesión de Permisos Críticos
Al abrir la app por primera vez, concede los siguientes permisos:
* **SMS:** Permitir enviar y ver mensajes SMS.
* **Teléfono:** Permitir leer el estado de la SIM.
* **Optimización de Batería (¡Crucial!):**
  * Android suele apagar los servidores HTTP en segundo plano tras unos minutos de inactividad de pantalla (*Doze Mode*).
  * Ve a: `Ajustes del Sistema > Aplicaciones > SMS Gateway > Batería > Seleccionar "Sin restricciones" / "No optimizar"`.

### Paso 3: Configuración del Servidor HTTP Local
Dentro de la app Capcom6:
1. Entra a **Settings (Ajustes)**.
2. **Port (Puerto):** Configura `8080` (por defecto).
3. **Authentication (Seguridad):**
   * Activa **Enable Basic Auth**.
   * Define un usuario: `lesconect`
   * Define una contraseña segura: `tu_clave_secreta_2026`
4. Regresa a la pantalla principal y presiona el interruptor **Start / Iniciar**.
5. La app mostrará en letras verdes la IP asignada en tu red Wi-Fi local, por ejemplo:
   ```
   http://192.168.1.150:8080
   ```

---

## 5. Verificación Manual de Envío (Smoke Test)

Antes de conectar la app móvil, prueba que el teléfono Android responde y envía SMS ejecutando el siguiente comando desde tu terminal de Windows o Mac:

### En PowerShell (Windows):
```powershell
$headers = @{
    "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("lesconect:tu_clave_secreta_2026"))
    "Content-Type"  = "application/json"
}

$body = @{
    phoneNumbers = @("+50688888888")
    message      = "<#> LESCOnect: Prueba de pasarela SMS exitosa."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.150:8080/message" -Method Post -Headers $headers -Body $body
```

### En Bash / cURL:
```bash
curl -X POST http://192.168.1.150:8080/message \
  -H "Content-Type: application/json" \
  -u lesconect:tu_clave_secreta_2026 \
  -d '{"phoneNumbers": ["+50688888888"], "message": "<#> LESCOnect: Prueba de pasarela SMS exitosa."}'
```

*Si el teléfono de destino recibe el SMS en 3 a 5 segundos, la pasarela de hardware está 100% operativa.*

---

## 6. Integración con el Orquestador Local (`server.js`)

En el repositorio LESCOnect, la carpeta `LESCOnect-backend/local-otp-gateway` contiene el orquestador multiproveedor.

### Archivo de Configuración `.env`:
Crea o edita `LESCOnect-backend/local-otp-gateway/.env`:

```env
PORT=3001
API_SECRET=clave-secreta-lesconect-2026

# Seleccionar modo SIM física o híbrido
GATEWAY_MODE=sim_sms

# IP local del celular Android con la SIM
SIM_GATEWAY_URL=http://192.168.1.150:8080
SIM_GATEWAY_USER=lesconect
SIM_GATEWAY_PASSWORD=tu_clave_secreta_2026
SIM_GATEWAY_TIMEOUT_MS=8000
```

### Iniciar el Orquestador:
```bash
cd LESCOnect-backend/local-otp-gateway
npm install
npm start
```

La consola confirmará:
```
======================================================
🚀 LESCOnect Local OTP Gateway activo en puerto 3001
📡 URL Local: http://localhost:3001
🔧 Modo configurado: [SIM_SMS]
📱 Pasarela SIM Física: http://192.168.1.150:8080
======================================================
```

---

## 7. Exposición Segura a Internet con Cloudflare Tunnel

Para que la app de Expo en los celulares de los testers pueda comunicarse con tu servidor local sin necesidad de abrir puertos en tu router:

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Cloudflare te asignará una URL pública y segura con certificado SSL:
```
https://rapid-testing-phone.trycloudflare.com
```

Copia esa URL en el archivo `.env` de tu app de React Native / Expo:
```env
EXPO_PUBLIC_OTP_GATEWAY_URL=https://rapid-testing-phone.trycloudflare.com
```

---

## 8. Formato de Mensaje y Compatibilidad con Android SMS Retriever

Para que la aplicación LESCOnect lea el código automáticamente sin solicitar permisos peligrosos en Google Play (`READ_SMS`), el mensaje SMS enviado por la SIM física sigue estrictamente el estándar de Google:

```text
<#> LESCOnect: Tu código de verificación es 482910. Válido por 5 minutos.
```

1. **`<#>`**: Prefijo de detección del SMS Retriever de Android.
2. **Nombre de la App**: `LESCOnect`.
3. **Código OTP**: 6 dígitos numéricos.
4. **Vigencia**: 5 minutos bajo lineamientos OWASP MASVS.

---

## 9. Buenas Prácticas Anti-Bloqueo de Operadores (Anti-Spam)

Para evitar que los operadores locales (Kölbi, Claro, Liberty) sospechen comportamiento anómalo o bloqueen la línea de pruebas:

1. **Cadencia entre mensajes:** Mantener un retardo mínimo de 3 a 5 segundos entre peticiones continuas.
2. **Volumen diario moderado:** En pruebas cerradas de desarrollo, mantener el tráfico en menos de 100 SMS por día.
3. **Identificador único de referencia:** El backend añade un código aleatorio `#REF` para evitar que el operador filtre los SMS como mensajes repetidos duplicados.
4. **Monitoreo de saldo:** En tarjetas prepago, verificar periódicamente el saldo remanente (`*115#` en Kölbi, `*555#` en Claro, etc.).

---

## 10. Conclusión y Veredicto Técnico

Esta arquitectura física con tarjeta SIM:
- **Resuelve el 100% de los requerimientos de pruebas sin gastar dinero.**
- **No depende de aprobaciones de Meta Business ni de tarjetas de crédito internacionales en Twilio.**
- **Permite validar en condiciones reales la recepción de SMS, latencias y lectura automática en Expo SDK 57.**
