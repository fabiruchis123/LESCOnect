# LESCOnect — Gateway Local Open Source de OTPs ($0 Costo)

Este microservidor te permite enviar códigos OTP de verificación reales hacia los teléfonos de tus testers **utilizando tu propio teléfono móvil como pasarela**, sin invertir un solo centavo en Twilio ni en la API de Meta.

---

## 🚀 Puesta en Marcha en 3 Pasos

### 1. Instalar dependencias
Abre una terminal en esta carpeta (`LESCOnect-backend/local-otp-gateway`):
```bash
npm install
```

### 2. Iniciar el Gateway
```bash
node server.js
```
* La consola mostrará un **código QR**.
* Abre WhatsApp en tu celular (o en un teléfono secundario): **Ajustes > Dispositivos Vinculados > Vincular un dispositivo** y escanea el QR.
* ¡Listo! Tu teléfono quedará vinculado como servidor de mensajería OTP.

### 3. Exponerlo a Internet Gratis (Para que la App Móvil se comunique con él)
Abre otra terminal y ejecuta:
```bash
npx cloudflared tunnel --url http://localhost:3001
```
Cloudflare te entregará una URL HTTPS pública gratuita (ej: `https://mi-servidor.trycloudflare.com`) sin costo ni registro.

---

## 📡 Endpoints Disponibles

### Solicitar OTP
* **URL:** `POST https://tu-url.trycloudflare.com/api/send-otp`
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
  "channel": "whatsapp_own_phone"
}
```
El tester recibirá un mensaje oficial de WhatsApp en su teléfono con el código en menos de 2 segundos.

### Verificar OTP
* **URL:** `POST https://tu-url.trycloudflare.com/api/verify-otp`
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

## 📱 Alternativa por SMS Físico Tradicional (Capcom6)
Si deseas que los códigos lleguen por SMS tradicional usando la tarjeta SIM de tu teléfono:
1. Descarga el APK gratuito en tu celular Android desde:  
   [github.com/capcom6/android-sms-gateway/releases](https://github.com/capcom6/android-sms-gateway/releases)
2. Abre la app, activa **Local Server**, concede permisos de SMS y pulsa **Start**.
3. La app expondrá una IP local (ej. `http://192.168.1.150:8080`) que despacha SMS reales desde tu SIM con el paquete de mensajes de tu operador (Kölbi, Claro, Liberty).
