const http = require('http');

const SIM_URL = 'http://192.168.40.4:8080/message';
const USERNAME = 'sms';
const PASSWORD = 'rNK4xZA4';
const PHONE = '+50684262854';
const CODE = Math.floor(100000 + Math.random() * 900000).toString();
const MESSAGE = `<#> LESCOnect: Tu código de verificación es ${CODE}. Válido por 5 minutos.`;

async function testSend() {
  console.log(`📡 Conectando con teléfono Android en ${SIM_URL}...`);
  console.log(`📱 Destinatario: ${PHONE}`);
  console.log(`🔐 Código generado: ${CODE}`);
  console.log(`💬 Mensaje: "${MESSAGE}"\n`);

  const payload = JSON.stringify({
    phoneNumbers: [PHONE],
    message: MESSAGE,
  });

  const url = new URL(SIM_URL);
  const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Basic ${credentials}`,
    },
    timeout: 10000,
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Respuesta del celular:`, data);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`\n✅ ¡ÉXITO! El SMS fue recibido por el teléfono Android y despachado por la tarjeta SIM.`);
      } else {
        console.log(`\n⚠️ El celular respondió con código de error HTTP ${res.statusCode}.`);
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    console.error('❌ Timeout: No se pudo contactar al teléfono en 10 segundos.');
  });

  req.on('error', (err) => {
    console.error('❌ Error de conexión:', err.message);
  });

  req.write(payload);
  req.end();
}

testSend();
