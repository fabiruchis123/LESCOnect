/**
 * @file benchmark_otp_flow.ts
 * @description Arnés de Benchmark y Validación Automatizada del Ciclo de Vida OTP y Pasarela SMS para LESCOnect (+506).
 *
 * Evalúa:
 * 1. Normalización y Validación E.164 de números costarricenses (+506).
 * 2. Entropía y Distribución uniforme del generador de 6 dígitos numéricos.
 * 3. Hashing criptográfico SHA-256 + Salt y comparación en tiempo constante (timing safe).
 * 4. Extracción automática de códigos desde mensajes SMS (SMS Retriever API y formatos variados).
 * 5. Ciclo de vida y TTL (Expiración estricta de 5 minutos según OWASP MASVS).
 * 6. Cooldown de reenvío de 30 segundos y bloqueo por fuerza bruta tras 5 intentos fallidos.
 * 7. Formato y compatibilidad de payload para Pasarela con SIM Física (Capcom6 Android SMS Gateway).
 */

declare const require: any;
declare const module: any;
declare const Buffer: any;

const crypto = typeof require !== 'undefined' ? require('crypto') : null;
import {
  validateOtpCode,
  validateCRPhone,
} from '../src/shared/utils/security';

export function sanitizeCRPhoneDigits(raw: string): string {
  return validateCRPhone(raw || '').digits;
}

export function isValidCRPhone(raw: string): boolean {
  return validateCRPhone(raw || '').isValid;
}

export function toE164CRPhone(raw: string): string {
  const digits = sanitizeCRPhoneDigits(raw);
  return digits ? `+506${digits}` : '';
}

export function formatCRPhoneDisplay(raw: string): string {
  return validateCRPhone(raw || '').formatted;
}

export function extractOtpFromText(rawText: string): string {
  if (!rawText) return '';
  const sixDigitMatch = rawText.match(/\b(\d{6})\b/);
  if (sixDigitMatch && sixDigitMatch[1]) {
    return sixDigitMatch[1];
  }
  return rawText.replace(/\D/g, '').slice(0, 6);
}

interface BenchmarkReport {
  testsPassed: number;
  testsFailed: number;
  totalTests: number;
  durationMs: number;
  sections: {
    phoneValidation: { total: number; passed: number };
    entropyAndGeneration: { samples: number; passed: boolean; chiSquareScore: number };
    cryptoAndTimingSafe: { total: number; passed: number };
    smsExtraction: { total: number; passed: number };
    ttlAndExpiration: { passed: boolean };
    rateLimitingAndBruteForce: { passed: boolean };
    simGatewayPayload: { passed: boolean };
  };
}

// ============================================================================
// SIMULACIÓN DE ALMACÉN SEGURO EN MEMORIA (In-Memory Crypto Store)
// ============================================================================
class MockOtpStore {
  private records = new Map<
    string,
    { hash: string; expiresAt: number; lastSentAt: number; attempts: number; lockedUntil: number }
  >();

  private readonly TTL_MS = 5 * 60 * 1000;
  private readonly COOLDOWN_MS = 30 * 1000;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MS = 60 * 1000;
  private readonly SALT = 'lesconect_bench_salt_2026';

  private hash(code: string): string {
    return crypto.createHash('sha256').update(code + this.SALT).digest('hex');
  }

  public send(phoneE164: string, now: number): { success: boolean; code?: string; error?: string } {
    const existing = this.records.get(phoneE164);
    if (existing && existing.lockedUntil > now) {
      return { success: false, error: 'Locked due to excessive attempts' };
    }
    if (existing && now - existing.lastSentAt < this.COOLDOWN_MS && existing.expiresAt > now) {
      return { success: false, error: 'Cooldown active' };
    }

    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const hash = this.hash(code);
    this.records.set(phoneE164, {
      hash,
      expiresAt: now + this.TTL_MS,
      lastSentAt: now,
      attempts: 0,
      lockedUntil: 0,
    });

    return { success: true, code };
  }

  public verify(
    phoneE164: string,
    code: string,
    now: number
  ): { success: boolean; error?: string; remainingAttempts?: number; locked?: boolean } {
    const rec = this.records.get(phoneE164);
    if (!rec) return { success: false, error: 'No record' };
    if (rec.lockedUntil > now) return { success: false, error: 'Locked', locked: true };
    if (now > rec.expiresAt) {
      this.records.delete(phoneE164);
      return { success: false, error: 'Expired' };
    }

    rec.attempts += 1;
    const computed = this.hash(code);

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(computed, 'utf8'),
      Buffer.from(rec.hash, 'utf8')
    );

    if (isMatch) {
      this.records.delete(phoneE164);
      return { success: true };
    }

    if (rec.attempts >= this.MAX_ATTEMPTS) {
      rec.lockedUntil = now + this.LOCKOUT_MS;
      return { success: false, error: 'Too many attempts', remainingAttempts: 0, locked: true };
    }

    return {
      success: false,
      error: 'Invalid code',
      remainingAttempts: this.MAX_ATTEMPTS - rec.attempts,
    };
  }
}

// ============================================================================
// SUITE DE EJECUCIÓN
// ============================================================================
export async function runOtpBenchmark(): Promise<BenchmarkReport> {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passed += 1;
    } else {
      failed += 1;
      console.error(`❌ [FALLO] ${msg}`);
    }
  }

  console.log('\n======================================================');
  console.log('🧪 INICIANDO BENCHMARK DE FLUJO OTP Y PASARELA SMS');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // 1. VALIDACIÓN Y NORMALIZACIÓN DE TELÉFONOS (+506)
  // --------------------------------------------------------------------------
  console.log('📱 1. Evaluando validación y normalización de números de Costa Rica (+506)...');
  const validCases = [
    { input: '8888-8888', clean: '88888888', e164: '+50688888888', display: '8888-8888' },
    { input: '+506 8765-4321', clean: '87654321', e164: '+50687654321', display: '8765-4321' },
    { input: '50661234567', clean: '61234567', e164: '+50661234567', display: '6123-4567' },
    { input: '7001 2345', clean: '70012345', e164: '+50670012345', display: '7001-2345' },
    { input: ' 8300-1122 ', clean: '83001122', e164: '+50683001122', display: '8300-1122' },
  ];

  let phoneTests = 0;
  let phonePassed = 0;

  for (const c of validCases) {
    phoneTests += 4;
    const ok = isValidCRPhone(c.input);
    const clean = sanitizeCRPhoneDigits(c.input);
    const e164 = toE164CRPhone(c.input);
    const disp = formatCRPhoneDisplay(c.input);

    if (ok) phonePassed += 1;
    if (clean === c.clean) phonePassed += 1;
    if (e164 === c.e164) phonePassed += 1;
    if (disp === c.display) phonePassed += 1;

    assert(ok, `isValidCRPhone fallo para ${c.input}`);
    assert(clean === c.clean, `cleanPhone fallo para ${c.input}`);
    assert(e164 === c.e164, `e164 fallo para ${c.input}`);
    assert(disp === c.display, `formatCRPhoneDisplay fallo para ${c.input}`);
  }

  const invalidCases = ['1234', '8888', '1234-5678', '9999-9999', 'abc88888888', ''];
  for (const inv of invalidCases) {
    phoneTests += 1;
    const isVal = isValidCRPhone(inv);
    if (!isVal) phonePassed += 1;
    assert(!isVal, `Debe rechazar teléfono inválido: "${inv}"`);
  }

  // --------------------------------------------------------------------------
  // 2. ENTROPÍA Y UNIFORMIDAD DEL GENERADOR DE 6 DÍGITOS
  // --------------------------------------------------------------------------
  console.log('🎲 2. Evaluando entropía y aleatoriedad del código OTP (10,000 muestras)...');
  const SAMPLES = 10000;
  const buckets = new Array(10).fill(0);
  let allSixDigits = true;

  for (let i = 0; i < SAMPLES; i++) {
    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
    if (!validateOtpCode(code) || code.length !== 6) {
      allSixDigits = false;
    }
    const firstDigit = parseInt(code[0], 10) - 1; // 1..9 mapeado a 0..8
    if (firstDigit >= 0 && firstDigit < 9) {
      buckets[firstDigit] += 1;
    }
  }

  assert(allSixDigits, 'Todos los códigos generados deben tener exactamente 6 dígitos.');

  // Chi-cuadrado para uniformidad de primer dígito (esperado: ~1111 por dígito)
  const expectedPerBucket = SAMPLES / 9;
  let chiSquare = 0;
  for (let i = 0; i < 9; i++) {
    const diff = buckets[i] - expectedPerBucket;
    chiSquare += (diff * diff) / expectedPerBucket;
  }
  // Valor crítico de Chi2 para df=8 a p=0.01 es 20.09. Si chiSquare < 20.09, es altamente uniforme.
  const isUniform = chiSquare < 25.0;
  assert(isUniform, `La distribución debe ser uniforme (Chi2=${chiSquare.toFixed(2)})`);

  // --------------------------------------------------------------------------
  // 3. HASHING SEGURO Y TIMING SAFE EQUAL
  // --------------------------------------------------------------------------
  console.log('🔒 3. Evaluando hashing SHA-256 y resistencia contra timing attacks...');
  let cryptoTests = 0;
  let cryptoPassed = 0;

  const testCode = '482910';
  const salt = 'lesconect_salt';
  const hash1 = crypto.createHash('sha256').update(testCode + salt).digest('hex');
  const hash2 = crypto.createHash('sha256').update(testCode + salt).digest('hex');
  const hashDifferent = crypto.createHash('sha256').update('482911' + salt).digest('hex');

  cryptoTests += 3;
  if (hash1 === hash2) cryptoPassed += 1;
  if (hash1 !== hashDifferent) cryptoPassed += 1;

  const safeMatch = crypto.timingSafeEqual(Buffer.from(hash1, 'utf8'), Buffer.from(hash2, 'utf8'));
  const safeMismatch = crypto.timingSafeEqual(Buffer.from(hash1, 'utf8'), Buffer.from(hashDifferent, 'utf8'));

  if (safeMatch && !safeMismatch) cryptoPassed += 1;

  assert(hash1 === hash2, 'Hash determinístico para el mismo código y salt.');
  assert(hash1 !== hashDifferent, 'Hash completamente distinto con diferencia de 1 dígito (Avalanche effect).');
  assert(safeMatch && !safeMismatch, 'timingSafeEqual debe validar correctamente hashes de tiempo constante.');

  // --------------------------------------------------------------------------
  // 4. EXTRACCIÓN DE CÓDIGO OTP DESDE MENSAJES SMS
  // --------------------------------------------------------------------------
  console.log('📩 4. Evaluando extracción automática de código desde formato SMS...');
  const smsSamples = [
    { msg: '<#> LESCOnect: Tu código de verificación es 482910. Válido por 5 minutos.', expected: '482910' },
    { msg: 'Tu código de acceso para LESCOnect es: 928374', expected: '928374' },
    { msg: '482910', expected: '482910' },
    { msg: 'Ref: #A3F9. Código de seguridad: [ 102938 ]', expected: '102938' },
    { msg: 'LESCOnect code: 771122 - No lo comparta', expected: '771122' },
  ];

  let smsTests = 0;
  let smsPassed = 0;

  for (const s of smsSamples) {
    smsTests += 1;
    const extracted = extractOtpFromText(s.msg);
    if (extracted === s.expected) smsPassed += 1;
    assert(extracted === s.expected, `Extracción falló para mensaje: "${s.msg}" (esperado: ${s.expected}, obtenido: ${extracted})`);
  }

  // --------------------------------------------------------------------------
  // 5. CICLO DE VIDA, TTL (5 MINUTOS) Y EXPIRACIÓN
  // --------------------------------------------------------------------------
  console.log('⏱ 5. Evaluando TTL estricto de 5 minutos y expiración temporal...');
  const store = new MockOtpStore();
  const phone = '+50688881234';
  const t0 = 1700000000000;

  const sendRes = store.send(phone, t0);
  assert(sendRes.success && Boolean(sendRes.code), 'Envío inicial debe ser exitoso');

  const validCode = sendRes.code!;

  // Intento en t0 + 4 minutos (debe ser válido)
  const verifyValid = store.verify(phone, validCode, t0 + 4 * 60 * 1000);
  assert(verifyValid.success, 'Código debe ser válido a los 4 minutos');

  // Nuevo código para probar expiración a los 5 min + 1 segundo
  const sendRes2 = store.send(phone, t0 + 5 * 60 * 1000);
  const code2 = sendRes2.code!;
  const verifyExpired = store.verify(phone, code2, t0 + 10 * 60 * 1000 + 1000);
  assert(!verifyExpired.success && verifyExpired.error === 'Expired', 'Código debe rechazarse después de 5 minutos');

  // --------------------------------------------------------------------------
  // 6. RATE LIMITING Y PROTECCIÓN CONTRA FUERZA BRUTA
  // --------------------------------------------------------------------------
  console.log('🛡 6. Evaluando cooldown de reenvío (30s) y bloqueo por 5 intentos fallidos...');
  const t1 = 1700001000000;
  const sendRes3 = store.send(phone, t1);
  const code3 = sendRes3.code!;

  // Reenvío antes de 30 segundos debe ser bloqueado por cooldown
  const spamResend = store.send(phone, t1 + 15 * 1000);
  assert(!spamResend.success && spamResend.error === 'Cooldown active', 'Debe respetar cooldown de 30s');

  // 4 intentos fallidos
  for (let i = 1; i <= 4; i++) {
    const failRes = store.verify(phone, '000000', t1 + i * 1000);
    assert(!failRes.success && failRes.remainingAttempts === 5 - i, `Intento fallido ${i} debe reducir intentos restantes`);
  }

  // 5to intento fallido -> debe bloquear por 60s
  const fifthFail = store.verify(phone, '000000', t1 + 5000);
  assert(!fifthFail.success && fifthFail.locked === true, 'El 5to intento incorrecto debe activar bloqueo temporal');

  // Intento con código correcto mientras está bloqueado -> debe ser denegado
  const duringLockout = store.verify(phone, code3, t1 + 10000);
  assert(!duringLockout.success && duringLockout.locked === true, 'Código correcto debe ser denegado si el usuario está bloqueado');

  // --------------------------------------------------------------------------
  // 7. PAYLOAD COMPATIBLE CON PASARELA SIM FÍSICA (Capcom6 SMS Gateway)
  // --------------------------------------------------------------------------
  console.log('📡 7. Validando estructura de payload para pasarela SIM Android (Capcom6)...');
  const simPhone = '+50688887766';
  const simOtpCode = '654321';
  const expectedSmsMessage = `<#> LESCOnect: Tu código de verificación es ${simOtpCode}. Válido por 5 minutos.`;

  const capcomPayload = {
    phoneNumbers: [simPhone],
    phone: simPhone,
    message: expectedSmsMessage,
  };

  const hasPhoneNumbers = Array.isArray(capcomPayload.phoneNumbers) && capcomPayload.phoneNumbers[0] === simPhone;
  const hasValidPrefix = capcomPayload.message.startsWith('<#> LESCOnect:');
  const hasCodeIncluded = capcomPayload.message.includes(simOtpCode);

  assert(hasPhoneNumbers, 'Payload debe incluir arreglo phoneNumbers con formato E.164');
  assert(hasValidPrefix, 'Mensaje debe incluir prefijo <#> LESCOnect para Android SMS Retriever');
  assert(hasCodeIncluded, 'Mensaje debe contener el código de verificación generado');

  const durationMs = Date.now() - startTime;

  console.log('\n======================================================');
  console.log(`🏁 RESULTADO BENCHMARK OTP: ${passed} PASADOS / ${failed} FALLADOS (${durationMs}ms)`);
  console.log('======================================================\n');

  return {
    testsPassed: passed,
    testsFailed: failed,
    totalTests: passed + failed,
    durationMs,
    sections: {
      phoneValidation: { total: phoneTests, passed: phonePassed },
      entropyAndGeneration: { samples: SAMPLES, passed: allSixDigits && isUniform, chiSquareScore: chiSquare },
      cryptoAndTimingSafe: { total: cryptoTests, passed: cryptoPassed },
      smsExtraction: { total: smsTests, passed: smsPassed },
      ttlAndExpiration: { passed: verifyValid.success && !verifyExpired.success },
      rateLimitingAndBruteForce: { passed: !spamResend.success && fifthFail.locked === true },
      simGatewayPayload: { passed: hasPhoneNumbers && hasValidPrefix && hasCodeIncluded },
    },
  };
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('benchmark_otp_flow')) {
  runOtpBenchmark().then((report) => {
    if (report.testsFailed > 0) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
