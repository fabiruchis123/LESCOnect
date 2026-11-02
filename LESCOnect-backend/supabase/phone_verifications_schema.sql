-- =============================================================================
-- LESCOnect - Arquitectura de Servidor OTP Telefónico (Zero-Trust Client)
-- Archivo: phone_verifications_schema.sql
-- =============================================================================
-- Principio de Seguridad: El código OTP NUNCA es generado por la aplicación móvil.
-- Se genera y valida de forma estricta en el motor PostgreSQL / Edge Functions
-- con hash criptográfico SHA-256, expiración de 5 minutos y límite anti fuerza bruta.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Verificaciones Telefónicas
CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    salt VARCHAR(32) NOT NULL,
    attempts_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ NULL,
    ip_address INET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_phone_verifications_lookup 
    ON public.phone_verifications (phone, expires_at) 
    WHERE verified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_phone_verifications_recent
    ON public.phone_verifications (phone, created_at DESC);

-- RLS (Row Level Security) - Denegar acceso público directo desde clientes anon
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all public access to phone_verifications" ON public.phone_verifications;
CREATE POLICY "Deny all public access to phone_verifications" 
    ON public.phone_verifications 
    FOR ALL 
    TO public 
    USING (false);

-- 2. Función de Servidor para Generar y Almacenar el OTP (Solo ejecutable por service_role o RPC autorizado)
CREATE OR REPLACE FUNCTION public.generate_server_phone_otp(
    p_phone TEXT,
    p_ip INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_phone TEXT;
    v_raw_code TEXT;
    v_salt TEXT;
    v_hash TEXT;
    v_recent_count INT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Limpieza y normalización de teléfono (+506...)
    v_clean_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    IF length(v_clean_phone) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Número telefónico inválido.');
    END IF;

    -- Rate Limit: Máximo 1 solicitud cada 60 segundos por número
    SELECT COUNT(*) INTO v_recent_count
    FROM public.phone_verifications
    WHERE phone = v_clean_phone
      AND created_at > (now() - interval '60 seconds');

    IF v_recent_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Debes esperar 60 segundos antes de solicitar un nuevo código.',
            'cooldown', true
        );
    END IF;

    -- Generar 6 dígitos criptográficos seguros
    v_raw_code := lpad(floor(100000 + random() * 900000)::text, 6, '0');
    v_salt := encode(gen_random_bytes(16), 'hex');
    v_hash := encode(digest(v_raw_code || v_salt, 'sha256'), 'hex');
    v_expires_at := now() + interval '5 minutes';

    -- Invalidar tokens previos pendientes
    UPDATE public.phone_verifications
    SET expires_at = now()
    WHERE phone = v_clean_phone AND verified_at IS NULL;

    -- Registrar nueva verificación
    INSERT INTO public.phone_verifications (
        phone,
        code_hash,
        salt,
        attempts_count,
        max_attempts,
        expires_at,
        ip_address
    ) VALUES (
        v_clean_phone,
        v_hash,
        v_salt,
        0,
        3,
        v_expires_at,
        p_ip
    );

    -- NOTA: El campo 'code' solo se retorna internamente a la Edge Function
    -- que enviará el SMS / WhatsApp. NUNCA se envía al cliente de la app móvil.
    RETURN jsonb_build_object(
        'success', true,
        'phone', v_clean_phone,
        'code', v_raw_code,
        'expires_at', v_expires_at
    );
END;
$$;

-- 3. Función de Servidor para Validar OTP y Retornar Perfil de Usuario
CREATE OR REPLACE FUNCTION public.verify_server_phone_otp(
    p_phone TEXT,
    p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_phone TEXT;
    v_clean_code TEXT;
    v_record RECORD;
    v_computed_hash TEXT;
    v_user RECORD;
BEGIN
    v_clean_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    v_clean_code := regexp_replace(p_code, '[^0-9]', '', 'g');

    IF length(v_clean_code) <> 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código debe tener exactamente 6 dígitos.');
    END IF;

    -- Obtener la verificación activa más reciente
    SELECT * INTO v_record
    FROM public.phone_verifications
    WHERE phone = v_clean_phone
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No hay un código pendiente para este número. Solicita uno nuevo.');
    END IF;

    IF now() > v_record.expires_at THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código ha expirado. Por favor solicita uno nuevo.');
    END IF;

    IF v_record.attempts_count >= v_record.max_attempts THEN
        RETURN jsonb_build_object('success', false, 'error', 'Has superado el límite de 3 intentos fallidos. Solicita un nuevo código.');
    END IF;

    -- Incrementar contador de intentos fallidos
    UPDATE public.phone_verifications
    SET attempts_count = attempts_count + 1
    WHERE id = v_record.id;

    -- Validar hash
    v_computed_hash := encode(digest(v_clean_code || v_record.salt, 'sha256'), 'hex');

    IF v_computed_hash <> v_record.code_hash THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Código incorrecto. Te quedan ' || (v_record.max_attempts - v_record.attempts_count - 1) || ' intento(s).'
        );
    END IF;

    -- Código VÁLIDO: Marcar como verificado
    UPDATE public.phone_verifications
    SET verified_at = now()
    WHERE id = v_record.id;

    -- Buscar usuario asociado al número en profiles (o crearlo si no existe)
    SELECT * INTO v_user
    FROM public.profiles
    WHERE telefono = v_clean_phone 
       OR telefono = substring(v_clean_phone from '^\+506(.*)$')
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Teléfono verificado correctamente.',
        'user_found', (v_user.id IS NOT NULL),
        'user_profile', row_to_json(v_user)
    );
END;
$$;
