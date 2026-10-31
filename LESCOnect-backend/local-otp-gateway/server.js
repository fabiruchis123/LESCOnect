/**
 * @file server.js
 * @description LESCOnect - Gateway Local Gratuito y Open Source de OTPs ($0 Costo)
 * Soporta dos modos operativos para pruebas cerradas:
 * 1. WhatsApp Multi-Device (vía Baileys): Despacha el código desde tu propio WhatsApp escaneando un QR.
 * 2. Modo Simulación / Consola: Imprime los códigos con formato si no hay teléfono conectado.
 */

const express = require('express');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto');

let makeWASocket, DisconnectReason, useMultiFileAuthState;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  DisconnectReason = baileys.DisconnectReason;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
} catch (e) {
  // En caso de que no estén instaladas las dependencias aún
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || 'clave-secreta-lesconect-2026';

// Almacén en memoria de códigos activos para pruebas locales
const activeOtps = new Map();

let waSock = null;
let isWaConnected = false;

async function initWhatsApp() {
  if (!makeWASocket) {
    console.log('[!] Dependencias de Baileys no instaladas. Ejecuta "npm install" dentro de esta carpeta.');
    return;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_session');

    waSock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
    });

    waSock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP EN TU TELÉFONO:');
        console.log('   (WhatsApp > Ajustes > Dispositivos Vinculados > Vincular)');
        console.log('======================================================\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        isWaConnected = false;
        console.log('[!] Conexión de WhatsApp cerrada. Intentando reconectar...');
        setTimeout(initWhatsApp, 5000);
      } else if (connection === 'open') {
        isWaConnected = true;
        console.log('\n✅ [CONECTADO] Tu teléfono está listo como servidor OTP por WhatsApp.');
      }
    });

    waSock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('[!] Error inicializando WhatsApp:', err.message);
  }
}

// ----------------------------------------------------------------------------
// ENDPOINT 1: GENERAR Y ENVIAR CÓDIGO OTP
// ----------------------------------------------------------------------------
app.post('/api/send-otp', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 8) {
    return res.status(400).json({ success: false, error: 'Número telefónico inválido' });
  }

  // Generar 6 dígitos criptográficos
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

  // Guardar hash en memoria local
  const hash = crypto.createHash('sha256').update(code + 'lesconect_salt').digest('hex');
  activeOtps.set(cleanPhone, { hash, expiresAt, attempts: 0 });

  let channelUsed = 'console_fallback';

  // Si WhatsApp está conectado, enviar mensaje al teléfono
  if (isWaConnected && waSock) {
    try {
      const jid = `${cleanPhone}@s.whatsapp.net`;
      await waSock.sendPresenceUpdate('composing', jid);
      await new Promise((r) => setTimeout(r, 1500)); // Simulación humana anti-bloqueo

      const messageBody =
        `🔐 *LESCOnect — Código de Acceso*\n\n` +
        `Tu código de verificación es:\n` +
        `👉 *${code}*\n\n` +
        `⏱ Válido por 5 minutos. No lo compartas.\n` +
        `Ref: #${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      await waSock.sendMessage(jid, { text: messageBody });
      channelUsed = 'whatsapp_own_phone';
    } catch (err) {
      console.error('[!] Falló envío WhatsApp:', err.message);
    }
  }

  // Imprimir en consola del desarrollador para depuración inmediata
  console.log(`\n📨 [OTP GENERADO] Teléfono: +${cleanPhone} | Código: ${code} | Canal: ${channelUsed}`);

  const masked =
    cleanPhone.length >= 8
      ? `+${cleanPhone.slice(0, 3)} ****-${cleanPhone.slice(-4)}`
      : cleanPhone;

  return res.json({
    success: true,
    maskedPhone: masked,
    expiresIn: 300,
    channel: channelUsed,
  });
});

// ----------------------------------------------------------------------------
// ENDPOINT 2: VALIDAR CÓDIGO OTP
// ----------------------------------------------------------------------------
app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const cleanCode = (code || '').trim();

  const record = activeOtps.get(cleanPhone);
  if (!record) {
    return res.status(400).json({ success: false, error: 'No hay código pendiente para este número.' });
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({ success: false, error: 'El código ha expirado.' });
  }

  if (record.attempts >= 3) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({ success: false, error: 'Demasiados intentos fallidos. Solicita uno nuevo.' });
  }

  record.attempts += 1;
  const computedHash = crypto.createHash('sha256').update(cleanCode + 'lesconect_salt').digest('hex');

  if (computedHash !== record.hash) {
    return res.status(400).json({
      success: false,
      error: `Código incorrecto. Te quedan ${3 - record.attempts} intento(s).`,
    });
  }

  // Válido: Limpiar registro
  activeOtps.delete(cleanPhone);
  return res.json({
    success: true,
    message: 'Teléfono verificado exitosamente.',
  });
});

app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`🚀 LESCOnect Local OTP Gateway activo en puerto ${PORT}`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log('======================================================');
  initWhatsApp();
});
