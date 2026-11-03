/**
 * @file server.js
 * @description LESCOnect - Gateway Local Gratuito y Open Source de OTPs ($0 Costo de APIs)
 * Soporta múltiples canales de bajo costo para pruebas cerradas y desarrollo:
 * 1. SIM Física Android (SMS GSM directo): Conecta con un smartphone Android con chip prepago/postpago
 *    ejecutando Capcom6 Android SMS Gateway (o Termux:API) sin costos de APIs externas.
 * 2. WhatsApp Multi-Device (vía Baileys): Despacha el código desde tu propio WhatsApp escaneando un QR.
 * 3. Modo Híbrido (SIM física preferente + WhatsApp fallback).
 * 4. Modo Simulación / Consola: Imprime los códigos con formato si no hay hardware conectado.
 */

require('dotenv').config();
const express = require('express');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

let makeWASocket, DisconnectReason, useMultiFileAuthState;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  DisconnectReason = baileys.DisconnectReason;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
} catch (e) {
  // Baileys se inicializará condicionalmente si está instalado
}

const app = express();
app.use(express.json());

// Middleware CORS permisivo para desarrollo y clientes móviles
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ----------------------------------------------------------------------------
// CONFIGURACIÓN Y VARIABLES DE ENTORNO
// ----------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3001', 10);
const API_SECRET = process.env.API_SECRET || 'clave-secreta-lesconect-2026';
const GATEWAY_MODE = (process.env.GATEWAY_MODE || 'hybrid').toLowerCase(); // 'sim_sms' | 'whatsapp' | 'hybrid' | 'console'

// Configuración de la Pasarela SIM Física Android (Capcom6 SMS Gateway / Termux)
const SIM_GATEWAY_URL = process.env.SIM_GATEWAY_URL || ''; // ej. 'http://192.168.1.150:8080'
const SIM_GATEWAY_USER = process.env.SIM_GATEWAY_USER || '';
const SIM_GATEWAY_PASSWORD = process.env.SIM_GATEWAY_PASSWORD || '';
const SIM_GATEWAY_TIMEOUT_MS = parseInt(process.env.SIM_GATEWAY_TIMEOUT_MS || '15000', 10);

// Almacén en memoria de códigos activos para pruebas locales
const activeOtps = new Map();

// Estadísticas de despacho
const stats = {
  totalSent: 0,
  byChannel: {
    sim_sms: 0,
    whatsapp: 0,
    console_fallback: 0,
  },
  lastDispatchedAt: null,
};

let waSock = null;
let isWaConnected = false;

// ----------------------------------------------------------------------------
// INICIALIZACIÓN DE WHATSAPP (SI APLICA)
// ----------------------------------------------------------------------------
async function initWhatsApp() {
  if (GATEWAY_MODE === 'sim_sms' || GATEWAY_MODE === 'console') {
    console.log(`ℹ️ [MODO ${GATEWAY_MODE.toUpperCase()}] WhatsApp Baileys omitido por configuración.`);
    return;
  }

  if (!makeWASocket) {
    console.log('[!] Dependencias de Baileys no instaladas. WhatsApp no estará activo.');
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
      const { connection, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP EN TU TELÉFONO:');
        console.log('   (WhatsApp > Ajustes > Dispositivos Vinculados > Vincular)');
        console.log('======================================================\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        isWaConnected = false;
        console.log('[!] Conexión de WhatsApp cerrada. Intentando reconectar en 5s...');
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
// DISPATCHER: ENVÍO VÍA SIM FÍSICA ANDROID (Capcom6 / Termux)
// ----------------------------------------------------------------------------
async function sendSmsViaPhysicalSim(phoneE164, message) {
  if (!SIM_GATEWAY_URL) {
    return { ok: false, error: 'SIM_GATEWAY_URL no configurada' };
  }

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(SIM_GATEWAY_URL);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      // Estructura compatible con Capcom6 android-sms-gateway API
      // Admite tanto 'phoneNumbers': [phone] como 'message': text
      const payload = JSON.stringify({
        phoneNumbers: [phoneE164],
        phone: phoneE164,
        message: message,
      });

      // Ruta estándar de envío de mensajes en Capcom6 SMS Gateway
      const pathname = urlObj.pathname && urlObj.pathname !== '/'
        ? urlObj.pathname
        : '/message';

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      };

      if (SIM_GATEWAY_USER && SIM_GATEWAY_PASSWORD) {
        const credentials = Buffer.from(`${SIM_GATEWAY_USER}:${SIM_GATEWAY_PASSWORD}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: pathname,
        method: 'POST',
        headers,
        timeout: SIM_GATEWAY_TIMEOUT_MS,
      };

      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, data });
          } else {
            resolve({
              ok: false,
              error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}`,
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: `Timeout al contactar teléfono Android tras ${SIM_GATEWAY_TIMEOUT_MS}ms` });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      req.write(payload);
      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

// ----------------------------------------------------------------------------
// DISPATCHER: ENVÍO VÍA WHATSAPP (Baileys)
// ----------------------------------------------------------------------------
async function sendWhatsAppOtp(cleanPhone, code) {
  if (!isWaConnected || !waSock) {
    return { ok: false, error: 'WhatsApp no está conectado' };
  }

  try {
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await waSock.sendPresenceUpdate('composing', jid);
    await new Promise((r) => setTimeout(r, 1200)); // Delay humano anti-spam

    const messageBody =
      `🔐 *LESCOnect — Código de Acceso*\n\n` +
      `Tu código de verificación es:\n` +
      `👉 *${code}*\n\n` +
      `⏱ Válido por 5 minutos. No lo compartas con nadie.\n` +
      `Ref: #${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    await waSock.sendMessage(jid, { text: messageBody });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// ENDPOINT 1: ESTADO DEL SERVIDOR Y PASARELAS
// ----------------------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  let simStatus = 'deshabilitado';
  if (SIM_GATEWAY_URL) {
    simStatus = 'configurado';
  }

  res.json({
    status: 'online',
    mode: GATEWAY_MODE,
    simGateway: {
      status: simStatus,
      url: SIM_GATEWAY_URL ? SIM_GATEWAY_URL.replace(/:\/\/.*@/, '://***@') : null,
      authConfigured: Boolean(SIM_GATEWAY_USER && SIM_GATEWAY_PASSWORD),
    },
    whatsAppGateway: {
      connected: isWaConnected,
    },
    activeOtpsCount: activeOtps.size,
    stats,
  });
});

// ----------------------------------------------------------------------------
// ENDPOINT 2: GENERAR Y ENVIAR CÓDIGO OTP
// ----------------------------------------------------------------------------
app.post('/api/send-otp', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { phone, code: clientProvidedCode } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
  }

  const rawDigits = phone.toString().replace(/[^0-9]/g, '');
  if (rawDigits.length < 8) {
    return res.status(400).json({ success: false, error: 'Número telefónico inválido' });
  }

  const cleanPhone = rawDigits.startsWith('506') ? rawDigits : `506${rawDigits}`;
  const phoneE164 = `+${cleanPhone}`;

  // Si la app envía un código de 6 dígitos, usarlo exactamente; si no, generar uno nuevo
  let code = '';
  if (clientProvidedCode && /^\d{6}$/.test(String(clientProvidedCode).trim())) {
    code = String(clientProvidedCode).trim();
  } else {
    code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  }
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos (OWASP MASVS)

  // Guardar hash seguro en memoria local (tanto para cleanPhone como para rawDigits)
  const hash = crypto.createHash('sha256').update(code + 'lesconect_salt').digest('hex');
  const otpRecord = { hash, code, expiresAt, attempts: 0 };
  activeOtps.set(cleanPhone, otpRecord);
  if (rawDigits !== cleanPhone) {
    activeOtps.set(rawDigits, otpRecord);
  }

  // Mensaje con formato compatible con Android SMS Retriever API
  const smsBody = `<#> LESCOnect: Tu código de verificación es ${code}. Válido por 5 minutos.`;

  let channelUsed = 'console_fallback';
  let deliveryDetails = null;

  // Lógica de ruteo según GATEWAY_MODE:
  // 1. Si el modo es 'sim_sms' o 'hybrid', intentar enviar por la SIM física Android
  if (GATEWAY_MODE === 'sim_sms' || GATEWAY_MODE === 'hybrid') {
    if (SIM_GATEWAY_URL) {
      console.log(`📡 Intentando despacho por SIM Física Android hacia ${phoneE164}...`);
      const simResult = await sendSmsViaPhysicalSim(phoneE164, smsBody);
      if (simResult.ok) {
        channelUsed = 'sim_sms';
        deliveryDetails = 'Despachado por SIM física GSM';
      } else {
        console.warn(`[!] SIM Física no respondió (${simResult.error}). Evaluando fallback...`);
      }
    }
  }

  // 2. Si no se despachó por SIM y el modo es 'whatsapp' o 'hybrid', intentar WhatsApp Baileys
  if (channelUsed === 'console_fallback' && (GATEWAY_MODE === 'whatsapp' || GATEWAY_MODE === 'hybrid')) {
    if (isWaConnected && waSock) {
      console.log(`📱 Intentando despacho por WhatsApp Baileys hacia ${cleanPhone}...`);
      const waResult = await sendWhatsAppOtp(cleanPhone, code);
      if (waResult.ok) {
        channelUsed = 'whatsapp';
        deliveryDetails = 'Despachado por WhatsApp propio';
      } else {
        console.warn(`[!] Falló envío WhatsApp (${waResult.error}).`);
      }
    }
  }

  // 3. Fallback visual en consola de desarrollo
  if (channelUsed === 'console_fallback') {
    deliveryDetails = 'Impreso en consola del desarrollador';
  }

  // Actualizar estadísticas
  stats.totalSent += 1;
  stats.byChannel[channelUsed] = (stats.byChannel[channelUsed] || 0) + 1;
  stats.lastDispatchedAt = new Date().toISOString();

  console.log(`\n📨 [OTP DISPATCHED] Teléfono: ${phoneE164} | Código: ${code} | Canal: ${channelUsed} (${deliveryDetails})`);

  const masked =
    cleanPhone.length >= 8
      ? `+${cleanPhone.slice(0, 3)} ****-${cleanPhone.slice(-4)}`
      : cleanPhone;

  return res.json({
    success: true,
    maskedPhone: masked,
    expiresIn: 300,
    channel: channelUsed,
    code,
    details: deliveryDetails,
  });
});

// ----------------------------------------------------------------------------
// ENDPOINT 3: VALIDAR CÓDIGO OTP
// ----------------------------------------------------------------------------
app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const rawDigits = (phone || '').toString().replace(/[^0-9]/g, '');
  const cleanCode = (code || '').toString().trim();

  const cleanPhone = rawDigits.startsWith('506') ? rawDigits : `506${rawDigits}`;

  const record = activeOtps.get(cleanPhone) || activeOtps.get(rawDigits);
  if (!record) {
    return res.status(400).json({ success: false, error: 'No hay código pendiente para este número.' });
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(cleanPhone);
    activeOtps.delete(rawDigits);
    return res.status(400).json({ success: false, error: 'El código ha expirado (máximo 5 minutos).' });
  }

  if (record.attempts >= 5) {
    activeOtps.delete(cleanPhone);
    activeOtps.delete(rawDigits);
    return res.status(400).json({ success: false, error: 'Demasiados intentos fallidos. Solicita uno nuevo por seguridad.' });
  }

  record.attempts += 1;
  const computedHash = crypto.createHash('sha256').update(cleanCode + 'lesconect_salt').digest('hex');

  // Comparación en tiempo constante para mitigar ataques de timing
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'utf8'),
    Buffer.from(record.hash, 'utf8')
  );

  if (!isMatch) {
    const remaining = 5 - record.attempts;
    return res.status(400).json({
      success: false,
      remainingAttempts: remaining,
      error: `Código incorrecto. Te quedan ${remaining} intento(s).`,
    });
  }

  // Válido: Limpiar registro
  activeOtps.delete(cleanPhone);
  activeOtps.delete(rawDigits);
  return res.json({
    success: true,
    message: 'Teléfono verificado exitosamente.',
    verifiedPhone: cleanPhone,
  });
});

// ----------------------------------------------------------------------------
// ENDPOINT 4: ENVÍO DIRECTO DE MENSAJES SMS / ALERTAS SOS
// ----------------------------------------------------------------------------
app.post('/api/send-sms', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'phone y message son requeridos' });
  }

  const rawDigits = phone.toString().replace(/[^0-9]/g, '');
  if (rawDigits.length < 8) {
    return res.status(400).json({ success: false, error: 'Número telefónico inválido' });
  }

  const cleanPhone = rawDigits.startsWith('506') ? rawDigits : `506${rawDigits}`;
  const phoneE164 = `+${cleanPhone}`;

  let channelUsed = 'none';
  let deliveryDetails = null;

  // 1. SIM Física Android (si está configurada)
  if (GATEWAY_MODE === 'sim_sms' || GATEWAY_MODE === 'hybrid') {
    if (SIM_GATEWAY_URL) {
      console.log(`📡 [SOS SMS] Intentando despacho por SIM Física Android hacia ${phoneE164}...`);
      const simResult = await sendSmsViaPhysicalSim(phoneE164, message);
      if (simResult.ok) {
        channelUsed = 'sim_sms';
        deliveryDetails = 'Despachado por SIM física GSM';
      } else {
        console.warn(`[!] SIM Física no respondió (${simResult.error}).`);
      }
    }
  }

  // 2. WhatsApp Multi-Device (Baileys) si está configurado y conectado
  if (channelUsed === 'none' && (GATEWAY_MODE === 'whatsapp' || GATEWAY_MODE === 'hybrid')) {
    if (isWaConnected && waSock) {
      console.log(`📱 [SOS SMS] Intentando despacho por WhatsApp Baileys hacia ${cleanPhone}...`);
      try {
        const jid = `${cleanPhone}@s.whatsapp.net`;
        await waSock.sendMessage(jid, { text: message });
        channelUsed = 'whatsapp';
        deliveryDetails = 'Despachado por WhatsApp propio';
      } catch (err) {
        console.warn(`[!] Falló WhatsApp SOS (${err.message}).`);
      }
    }
  }

  if (channelUsed === 'none') {
    // Si no hay SIM ni WhatsApp disponible, no reportar éxito falso
    console.log(`⚠️ [SOS SMS] No hay pasarela física activa para enviar a ${phoneE164}. Se requiere fallback nativo.`);
    return res.status(503).json({
      success: false,
      error: 'Pasarela física no disponible en este momento.',
    });
  }

  // Actualizar estadísticas
  stats.totalSent += 1;
  stats.byChannel[channelUsed] = (stats.byChannel[channelUsed] || 0) + 1;
  stats.lastDispatchedAt = new Date().toISOString();

  console.log(`\n🚨 [SOS SMS ENVIADO] Teléfono: ${phoneE164} | Canal: ${channelUsed} (${deliveryDetails})\n`);

  return res.json({
    success: true,
    channel: channelUsed,
    details: deliveryDetails,
  });
});

// ----------------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`🚀 LESCOnect Local OTP Gateway activo en puerto ${PORT}`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`🔧 Modo configurado: [${GATEWAY_MODE.toUpperCase()}]`);
  if (SIM_GATEWAY_URL) {
    console.log(`📱 Pasarela SIM Física: ${SIM_GATEWAY_URL}`);
  } else {
    console.log(`ℹ️ SIM_GATEWAY_URL no configurada (se usará WhatsApp o Consola)`);
  }
  console.log('======================================================\n');
  initWhatsApp();
});
