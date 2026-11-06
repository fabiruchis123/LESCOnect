const http = require('http');
const https = require('https');

// Configuración por defecto: Modo Cloud permanente de Capcom6
// Permite al teléfono recibir y despachar SMS en cualquier red (Wi-Fi o 4G/5G)
const SIM_URL = process.env.SIM_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1/message';
const USERNAME = process.env.SIM_GATEWAY_USER || 'YGLUIQ';
const PASSWORD = process.env.SIM_GATEWAY_PASSWORD || 'lx8qy1jnqa4xvf';
const PHONE = process.env.TEST_PHONE || '+50684262854';
const SIM_NUMBER = parseInt(process.env.SIM_NUMBER || '2', 10); // SIM 2 = Kölbi ICE

const CODE = Math.floor(100000 + Math.random() * 900000).toString();
const MESSAGE = `<#> LESCOnect: Tu código de verificación es ${CODE}. Válido por 5 minutos.`;

async function testSend() {
  console.log(`======================================================`);
  console.log(`📡 Conectando con pasarela SMS en: ${SIM_URL}`);
  console.log(`📱 Destinatario: ${PHONE}`);
  console.log(`📟 Ranura SIM seleccionada: SIM ${SIM_NUMBER} (Kölbi ICE)`);
  console.log(`🔐 Código generado: ${CODE}`);
  console.log(`💬 Mensaje: "${MESSAGE}"`);
  console.log(`======================================================\n`);

  const payload = JSON.stringify({
    phoneNumbers: [PHONE],
    message: MESSAGE,
    simNumber: SIM_NUMBER,
  });

  const url = new URL(SIM_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Basic ${credentials}`,
    },
    timeout: 15000,
  };

  const req = client.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Respuesta de la pasarela:`, data);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`\n✅ ¡ÉXITO! El SMS fue recibido por la pasarela Cloud para despacho por SIM 2.`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) {
            console.log(`📋 ID de Mensaje: ${parsed.id}`);
            console.log(`📟 Estado Inicial: ${parsed.state || 'Pending'}`);
          }
        } catch {}
      } else {
        console.log(`\n⚠️ La pasarela respondió con código de error HTTP ${res.statusCode}.`);
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    console.error('❌ Timeout: No se pudo contactar a la pasarela en 15 segundos.');
  });

  req.on('error', (err) => {
    console.error('❌ Error de conexión:', err.message);
  });

  req.write(payload);
  req.end();
}

testSend();
