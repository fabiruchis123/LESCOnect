const http = require('http');

const SERVER_URL = 'http://localhost:3001';
const TEST_PHONE = '+50684262854';

function requestJson(url, method, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
        timeout: 20000,
      },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(text) });
          } catch {
            resolve({ status: res.statusCode, body: text });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de conexión'));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('======================================================');
  console.log('🚀 PRUEBA INTEGRAL DE PASARELA OTP LOCAL (SIM FÍSICA)');
  console.log('======================================================\n');

  try {
    // 1. Estado
    const statusRes = await requestJson(`${SERVER_URL}/api/status`, 'GET');
    console.log('1. Estado de la Pasarela:', statusRes.body);

    // 2. Enviar OTP
    console.log(`\n2. Solicitando OTP para ${TEST_PHONE}...`);
    const sendRes = await requestJson(`${SERVER_URL}/api/send-otp`, 'POST', { phone: TEST_PHONE });
    console.log('Respuesta del servidor:', sendRes.body);

    if (sendRes.body && sendRes.body.success) {
      console.log(`\n✅ SMS despachado exitosamente.`);
      console.log(`📱 Canal utilizado: ${sendRes.body.channel} (${sendRes.body.details})`);
      console.log(`⏱ Vigencia: ${sendRes.body.expiresIn} segundos`);
    } else {
      console.log('⚠️ Error al solicitar OTP:', sendRes.body);
    }
  } catch (err) {
    console.error('❌ Error ejecutando prueba:', err.message);
  }
}

run();
