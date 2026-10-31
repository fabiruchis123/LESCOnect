// =============================================================================
// Supabase Edge Function: auth-otp-server
// Archivo: index.ts
// Despacho de OTP en Servidor (WhatsApp Cloud API + SMS Gateway Fallback)
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const action = body.action || "send"; // "send" | "verify"
    const rawPhone = body.phone || "";
    const code = body.code || "";

    const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");

    // ACCIÓN 1: SOLICITAR CÓDIGO OTP (Generado 100% en DB / Servidor)
    if (action === "send") {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;

      // 1. Invocar función SQL de servidor que genera el código aleatorio y guarda el hash
      const { data: genResult, error: genError } = await supabaseClient.rpc(
        "generate_server_phone_otp",
        { p_phone: cleanPhone, p_ip: clientIp }
      );

      if (genError || !genResult?.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: genResult?.error || genError?.message || "Error generando código OTP.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const otpCode = genResult.code; // Código secreto generado por PostgreSQL

      // 2. Despacho por canal oficial (WhatsApp Cloud API preferente en Costa Rica / SMS fallback)
      const waToken = Deno.env.get("WHATSAPP_CLOUD_API_TOKEN");
      const waPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      let messageSent = false;

      if (waToken && waPhoneId) {
        try {
          // Enviar por WhatsApp Cloud API (Costo ~$0.0113 USD en Costa Rica)
          const waRes = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type: "template",
              template: {
                name: "auth_otp_code",
                language: { code: "es" },
                components: [
                  {
                    type: "body",
                    parameters: [{ type: "text", text: otpCode }],
                  },
                ],
              },
            }),
          });
          messageSent = waRes.ok;
        } catch {
          messageSent = false;
        }
      }

      // Si no hay WhatsApp o falló, probar SMS Gateway de respaldo (Twilio / Gateway local)
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!messageSent && twilioSid && twilioAuth && twilioFrom) {
        try {
          const smsText = `<#> LESCOnect: Tu código de verificación es: ${otpCode}. Válido por 5 minutos.`;
          const formData = new URLSearchParams();
          formData.append("To", cleanPhone);
          formData.append("From", twilioFrom);
          formData.append("Body", smsText);

          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: formData,
            }
          );
          messageSent = true;
        } catch {
          // No fatal
        }
      }

      // 3. Respuesta al cliente: NUNCA se envía el código 'otpCode'
      const masked =
        cleanPhone.length >= 8
          ? cleanPhone.slice(0, 4) + " ****-" + cleanPhone.slice(-4)
          : cleanPhone;

      return new Response(
        JSON.stringify({
          success: true,
          maskedPhone: masked,
          expiresIn: 300,
          cooldownSeconds: 60,
          channel: messageSent ? "whatsapp" : "sms",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACCIÓN 2: VERIFICAR CÓDIGO OTP (Comparación de hash en DB)
    if (action === "verify") {
      const { data: verResult, error: verError } = await supabaseClient.rpc(
        "verify_server_phone_otp",
        { p_phone: cleanPhone, p_code: code }
      );

      if (verError || !verResult?.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: verResult?.error || verError?.message || "Código inválido o expirado.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Autenticación exitosa.",
          user: verResult.user_profile,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Acción no reconocida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Error de servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
