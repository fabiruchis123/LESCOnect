/**
 * @file emergencyLocationService.ts
 * @description Servicio de Geolocalización GPS Satelital de Alta Precisión,
 * Gestión de Permisos y Despacho Automático por Servidor de Alertas SOS
 * a los Contactos de la Red de Auxilio del Usuario (sin envío directo a 9-1-1).
 */

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { supabase } from '@/lib/supabase';
import { SosContact } from '../types/emergencias.types';

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number; // en metros
  googleMapsUrl: string;
  formattedText: string;
  timestamp: number;
}

export interface AppPermissionsStatus {
  locationGranted: boolean;
  cameraGranted: boolean;
  canAskAgainLocation: boolean;
  canAskAgainCamera: boolean;
}

export interface EmergencyDispatchResult {
  success: boolean;
  dispatchedByServer: boolean;
  dispatchedContactsCount: number;
  phoneNumbers: string[];
  message: string;
  coords: GpsCoordinates | null;
  error?: string;
}

/**
 * Solicita y verifica los permisos del sistema:
 * 1. GPS / Ubicación en primer plano
 * 2. Cámara (para el traductor visual LESCO)
 */
export async function requestAllAppPermissions(): Promise<AppPermissionsStatus> {
  let locationGranted = false;
  let canAskAgainLocation = true;
  let cameraGranted = false;
  let canAskAgainCamera = true;

  try {
    if (Platform.OS !== 'web') {
      const locRes = await Location.requestForegroundPermissionsAsync();
      locationGranted = locRes.granted;
      canAskAgainLocation = locRes.canAskAgain;
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      locationGranted = true;
    }
  } catch {
    locationGranted = false;
  }

  try {
    if (Platform.OS !== 'web') {
      const camRes = await Camera.requestCameraPermissionsAsync();
      cameraGranted = camRes.granted;
      canAskAgainCamera = camRes.canAskAgain;
    } else {
      cameraGranted = true;
    }
  } catch {
    cameraGranted = false;
  }

  return {
    locationGranted,
    cameraGranted,
    canAskAgainLocation,
    canAskAgainCamera,
  };
}

/**
 * Obtiene las coordenadas GPS exactas en tiempo real del dispositivo.
 * Utiliza precisión alta (`Accuracy.High`) y fallback satelital.
 */
export async function getPreciseGpsCoordinates(): Promise<GpsCoordinates | null> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const acc = pos.coords.accuracy || 15;
          const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`;
          resolve({
            latitude: lat,
            longitude: lon,
            accuracy: Math.round(acc),
            googleMapsUrl: mapsUrl,
            formattedText: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)} (±${Math.round(acc)}m)`,
            timestamp: pos.timestamp || Date.now(),
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
      );
    });
  }

  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) {
      const req = await Location.requestForegroundPermissionsAsync();
      if (!req.granted) return null;
    }

    let loc: Location.LocationObject | null = null;
    try {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch {
      loc = await Location.getLastKnownPositionAsync();
    }

    if (!loc) return null;

    const lat = loc.coords.latitude;
    const lon = loc.coords.longitude;
    const acc = Math.round(loc.coords.accuracy ?? 15);
    const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

    return {
      latitude: lat,
      longitude: lon,
      accuracy: acc,
      googleMapsUrl: mapsUrl,
      formattedText: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)} (±${acc}m)`,
      timestamp: loc.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Construye el mensaje de auxilio SOS para contactos de emergencia de personas sordas
 * con enlace satelital directo de Google Maps y coordenadas numéricas exactas.
 * Instruye a los familiares/contactos para que gestionen la ayuda o llamen al 9-1-1 en su nombre.
 */
export function buildEmergencySosMessage(
  coords: GpsCoordinates | null,
  emergencyReason?: string,
  userName?: string
): string {
  const reasonText = emergencyReason ? ` Motivo: ${emergencyReason.toUpperCase()}.` : '';
  const senderText = userName ? ` (${userName})` : '';

  if (coords) {
    return (
      `🚨 ALERTA SOS LESCOnect${senderText}: Soy una persona sorda y requiero auxilio urgente.${reasonText}\n\n` +
      `📍 Mi ubicación exacta en tiempo real:\n${coords.googleMapsUrl}\n` +
      `Coordenadas: ${coords.formattedText}\n\n` +
      `Por favor ayúdame o llama al 9-1-1 por mí reportando esta ubicación exacta.`
    );
  }

  return (
    `🚨 ALERTA SOS LESCOnect${senderText}: Soy una persona sorda y requiero auxilio urgente.${reasonText}\n\n` +
    `Por favor comunícate conmigo de inmediato o llama al 9-1-1 por mí.`
  );
}

/**
 * Abre de forma segura y robusta la aplicación de mensajería SMS nativa
 * del sistema operativo con el destinatario o destinatarios y el mensaje prellenado.
 *
 * Formato estándar según plataforma:
 * - Android: sms:<telefonos>?body=<mensaje>
 * - iOS: sms:<telefonos>&body=<mensaje>
 */
export async function openEmergencySmsFallback(
  recipients: string | string[],
  message: string
): Promise<boolean> {
  try {
    const list = (Array.isArray(recipients) ? recipients : [recipients])
      .map((p) => p.replace(/[^0-9+]/g, ''))
      .filter((p) => p.replace(/[^0-9]/g, '').length >= 8);

    if (list.length === 0) return false;

    const isIos = Platform.OS === 'ios';
    const separator = isIos ? '&' : '?';
    // iOS usa coma para separar múltiples teléfonos, Android soporta coma o punto y coma
    const recipientStr = list.join(isIos ? ',' : ';');
    const smsUrl = `sms:${recipientStr}${separator}body=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(smsUrl);
      return true;
    } catch {
      // Si la app nativa de SMS falla al procesar la lista múltiple, intentar con el primer número
      const singleUrl = `sms:${list[0]}${separator}body=${encodeURIComponent(message)}`;
      await Linking.openURL(singleUrl);
      return true;
    }
  } catch (err) {
    console.warn('[emergencyLocationService] Error abriendo cliente SMS nativo:', err);
    return false;
  }
}

/**
 * Intenta enviar la alerta de auxilio a través de los canales de servidor:
 * 1. Pasarela física Android GSM / WhatsApp (si EXPO_PUBLIC_OTP_GATEWAY_URL está activa).
 * 2. Supabase Edge Function 'dispatch-emergency-sos'.
 *
 * Criterio de Seguridad Estricto:
 * Solo retorna `true` si el servidor responde con status 200/202 y confirmación { success: true }
 * dentro del límite de 3 segundos. Nunca asume éxito sin respuesta verificada.
 */
async function attemptServerDispatch(
  phones: string[],
  message: string,
  userName?: string,
  categoryTitle?: string,
  coords?: GpsCoordinates | null
): Promise<boolean> {
  const gatewayUrl = (
    process.env.EXPO_PUBLIC_OTP_GATEWAY_URL ||
    process.env.SIM_GATEWAY_URL ||
    ''
  ).replace(/\/+$/, '');

  // 1. Intento por Pasarela Local / Cloud (SIM física GSM o WhatsApp)
  if (gatewayUrl) {
    try {
      const controller = new AbortController();
      const gwTimeout = setTimeout(() => controller.abort(), 3000);

      const gwPromises = phones.map((p) =>
        fetch(`${gatewayUrl}/api/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: p, message }),
          signal: controller.signal,
        })
      );

      const results = await Promise.allSettled(gwPromises);
      clearTimeout(gwTimeout);

      let anySuccess = false;
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.ok) {
          try {
            const data = await res.value.json();
            if (data?.success === true) {
              anySuccess = true;
              break;
            }
          } catch {
            // Ignorar error al parsear JSON
          }
        }
      }

      if (anySuccess) {
        return true;
      }
    } catch {
      // Si la pasarela local no responde, continuar con Edge Function
    }
  }

  // 2. Intento por Supabase Edge Function + Registro de Auditoría
  try {
    const payload = {
      senderName: userName || 'Usuario LESCOnect',
      emergencyCategory: categoryTitle || 'Alerta de Auxilio SOS',
      coordinates: coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            googleMapsUrl: coords.googleMapsUrl,
          }
        : null,
      recipients: phones,
      messageText: message,
      timestamp: new Date().toISOString(),
    };

    const edgeFunctionCall = supabase.functions.invoke('dispatch-emergency-sos', {
      body: payload,
    });

    // Auditoría en base de datos en segundo plano
    (async () => {
      try {
        await supabase.from('emergency_alerts').insert({
          user_name: userName || 'Persona Sorda',
          category: categoryTitle || 'SOS',
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          accuracy_meters: coords?.accuracy || null,
          maps_url: coords?.googleMapsUrl || null,
          recipients: phones,
          message_text: message,
          status: 'attempted',
        });
      } catch {
        // Ignorar fallo de auditoría
      }
    })();

    // Timeout estricto de 3 segundos para garantizar rapidez de auxilio
    const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 3000)
    );

    const raceResult = await Promise.race([edgeFunctionCall, timeoutPromise]);

    if ('data' in raceResult && !raceResult.error && raceResult.data) {
      const data = raceResult.data;
      if (data.success === true || data.status === 'success') {
        return true;
      }
    }
  } catch {
    // Falla la conexión a la nube
  }

  return false;
}

/**
 * Despacha un mensaje de auxilio SOS a un contacto individual específico.
 * 1. Obtiene las coordenadas GPS satelitales en tiempo real.
 * 2. Construye el mensaje con enlace satelital de Google Maps.
 * 3. Intenta el despacho por servidor/pasarela con timeout de 3 segundos.
 * 4. Si el servidor no responde o no confirma entrega real, abre de inmediato
 *    la aplicación de mensajería SMS nativa con el texto prellenado.
 */
export async function dispatchSingleContactSms(
  phone: string,
  contactName?: string,
  senderName?: string,
  categoryTitle?: string
): Promise<EmergencyDispatchResult> {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 8) {
    return {
      success: false,
      dispatchedByServer: false,
      dispatchedContactsCount: 0,
      phoneNumbers: [],
      message: '',
      coords: null,
      error: 'El número telefónico no es válido o tiene menos de 8 dígitos.',
    };
  }

  // 1. Obtener coordenadas GPS exactas
  const coords = await getPreciseGpsCoordinates();

  // 2. Construir mensaje de auxilio
  const reason = categoryTitle || (contactName ? `Auxilio para ${contactName}` : 'Auxilio inmediato');
  const message = buildEmergencySosMessage(coords, reason, senderName);

  // 3. Intento de despacho por servidor (timeout de 3s)
  const serverDispatched = await attemptServerDispatch(
    [cleanPhone],
    message,
    senderName,
    reason,
    coords
  );

  if (serverDispatched) {
    return {
      success: true,
      dispatchedByServer: true,
      dispatchedContactsCount: 1,
      phoneNumbers: [cleanPhone],
      message,
      coords,
    };
  }

  // 4. Fallback inmediato: Abrir cliente SMS nativo
  const opened = await openEmergencySmsFallback(cleanPhone, message);

  return {
    success: opened,
    dispatchedByServer: false,
    dispatchedContactsCount: opened ? 1 : 0,
    phoneNumbers: [cleanPhone],
    message,
    coords,
    error: opened ? undefined : 'No se pudo abrir la aplicación de mensajería SMS.',
  };
}

/**
 * Despacho de emergencia SOS a toda la Red de Contactos:
 * Intenta el envío por servidor/pasarela en segundo plano; si no hay
 * confirmación real 200 en 3 segundos, abre la mensajería SMS nativa.
 */
export async function dispatchEmergencySosAlert(
  contacts: SosContact[],
  categoryTitle?: string,
  userName?: string
): Promise<EmergencyDispatchResult> {
  const activeContacts = contacts.filter((c) => c.phone && c.phone.trim().length >= 8);
  const targetPhones = activeContacts.map((c) => c.phone.replace(/[^0-9+]/g, ''));

  // 1. Validar que existan contactos configurados en la red del usuario
  if (targetPhones.length === 0) {
    return {
      success: false,
      dispatchedByServer: false,
      dispatchedContactsCount: 0,
      phoneNumbers: [],
      message: '',
      coords: null,
      error:
        'No tienes contactos SOS configurados en tu red de auxilio. Agrega al menos un familiar o persona de confianza para recibir tu alerta y ubicación GPS.',
    };
  }

  // 2. Obtener coordenadas GPS exactas en tiempo real
  const coords = await getPreciseGpsCoordinates();

  // 3. Construir mensaje de auxilio con coordenadas y enlace satelital
  const message = buildEmergencySosMessage(coords, categoryTitle, userName);

  // 4. Intento de despacho por servidor (timeout de 3s)
  const serverDispatched = await attemptServerDispatch(
    targetPhones,
    message,
    userName,
    categoryTitle,
    coords
  );

  // 5. Si el servidor confirmó el envío con éxito real
  if (serverDispatched) {
    return {
      success: true,
      dispatchedByServer: true,
      dispatchedContactsCount: activeContacts.length,
      phoneNumbers: targetPhones,
      message,
      coords,
    };
  }

  // 6. Fallback de contingencia:
  // Abrir la interfaz SMS nativa hacia los contactos registrados
  const opened = await openEmergencySmsFallback(targetPhones, message);

  return {
    success: opened,
    dispatchedByServer: false,
    dispatchedContactsCount: opened ? activeContacts.length : 0,
    phoneNumbers: targetPhones,
    message,
    coords,
    error: opened ? undefined : 'No se pudo abrir la aplicación de mensajería SMS.',
  };
}
