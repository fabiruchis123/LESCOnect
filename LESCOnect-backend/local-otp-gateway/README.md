# LESCOnect — Gateway Local Open Source de OTPs ($0 Costo en APIs)

Este microservidor te permite enviar códigos OTP de verificación reales hacia los teléfonos de tus testers **utilizando tu propio teléfono móvil como pasarela**, sin invertir un solo centavo en Twilio ni en la API oficial de Meta.

Soporta dos modalidades de hardware propio:
1. **SIM Física Android (SMS GSM tradicional)**: Convierte cualquier teléfono Android viejo o actual con chip (Kölbi, Claro, Liberty con paquete de SMS) en un servidor de envío de SMS usando el APK open-source `Capcom6 Android SMS Gateway`.
2. **WhatsApp Multi-Device**: Envía los códigos directamente desde tu cuenta personal de WhatsApp escaneando un código QR (vía Baileys).
3. **Modo Híbrido (Recomendado)**: Intenta enviar por SMS de la SIM física; si el teléfono no responde, despacha por WhatsApp; si ambos fallan, lo imprime en la consola del desarrollador.

---

## 🚀 Puesta en Marcha Rápida

### 1. Instalar dependencias
Abre una terminal en esta carpeta (`LESCOnect-backend/local-otp-gateway`):
```bash
npm install
```

### 2. Configurar variables de entorno
Copia la plantilla `.env.example` a `.env`:
```bash
cp .env.example .env
```

Para usar una **SIM Física Android**:
1. Descarga el APK gratuito de [Capcom6 Android SMS Gateway](https://github.com/capcom6/android-sms-gateway/releases) en el celular Android.
2. Inicia el servidor HTTP en el puerto 8080 y anota la IP que te muestra la app (ej. `http://192.168.1.150:8080`).
3. En `.env`, configura:
   ```env
   GATEWAY_MODE=sim_sms
   SIM_GATEWAY_URL=http://192.168.1.150:8080
   SIM_GATEWAY_USER=lesconect
   SIM_GATEWAY_PASSWORD=tu_clave_aqui
   ```

### 3. Iniciar el Gateway
```bash
npm start
```

### 4. Exponerlo a Internet Gratis (Para conectar la App Móvil o Supabase)
Abre otra terminal y ejecuta:
```bash
npx cloudflared tunnel --url http://localhost:3001
```
Cloudflare te entregará una URL HTTPS pública gratuita (ej: `https://mi-servidor.trycloudflare.com`) sin costo ni registro.

Coloca esa URL en el archivo `.env` de la app móvil:
```env
EXPO_PUBLIC_OTP_GATEWAY_URL=https://mi-servidor.trycloudflare.com
```

---

## 📡 Endpoints Disponibles

### 1. Consultar Estado
* **URL:** `GET /api/status`
* **Respuesta:**
```json
{
  "status": "online",
  "mode": "hybrid",
  "simGateway": {
    "status": "configurado",
    "url": "http://192.168.1.150:8080"
  },
  "whatsAppGateway": {
    "connected": true
  },
  "activeOtpsCount": 0
}
```

### 2. Solicitar OTP
* **URL:** `POST /api/send-otp`
* **Body:**
```json
{
  "phone": "+50688881234"
}
```
* **Respuesta:**
```json
{
  "success": true,
  "maskedPhone": "+506 ****-1234",
  "expiresIn": 300,
  "channel": "sim_sms",
  "details": "Despachado por SIM física GSM"
}
```

### 3. Verificar OTP
* **URL:** `POST /api/verify-otp`
* **Body:**
```json
{
  "phone": "+50688881234",
  "code": "482910"
}
```
* **Respuesta:**
```json
{
  "success": true,
  "message": "Teléfono verificado exitosamente."
}
```

---

## 📚 Documentación Técnica Completa
Para una guía detallada paso a paso sobre cómo preparar el smartphone Android con chip SIM, permisos de batería y configuración anti-spam, consulta:
* [`PHYSICAL_SIM_OTP_GATEWAY_GUIDE.md`](../docs/PHYSICAL_SIM_OTP_GATEWAY_GUIDE.md)
* [`ARBITRATION_VERDICT_OTP_TELEPHONY.md`](../docs/ARBITRATION_VERDICT_OTP_TELEPHONY.md)
