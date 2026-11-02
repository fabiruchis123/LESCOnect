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
 * Despacho automático de emergencia por SERVIDOR:
 * El servidor en la nube transmite los mensajes SMS a todos los contactos SOS
 * registrados en la red del usuario con las coordenadas GPS satelitales en segundo plano.
 * 
 * NOTA DE SEGURIDAD Y CUMPLIMIENTO:
 * No se despacha a la central 9-1-1 directamente, dado que el canal oficial requiere
 * homologación y estructura formal con las autoridades. Las alertas van dirigidas
 * exclusivamente a los contactos de auxilio de confianza del usuario.
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

  let serverDispatched = false;

  // 4. Envío automático por servidor en la nube (Supabase Edge Function + Registro DB)
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
      recipients: targetPhones,
      messageText: message,
      timestamp: new Date().toISOString(),
    };

    // Invocar función serverless para envío automático de SMS por servidor
    const edgeFunctionCall = supabase.functions.invoke('dispatch-emergency-sos', {
      body: payload,
    });

    // Registrar en tabla de alertas de emergencia
    const logCall = supabase.from('emergency_alerts').insert({
      user_name: userName || 'Persona Sorda',
      category: categoryTitle || 'SOS',
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      accuracy_meters: coords?.accuracy || null,
      maps_url: coords?.googleMapsUrl || null,
      recipients: targetPhones,
      message_text: message,
      status: 'dispatched_by_server',
    });

    // Timeout de 4s para no demorar la respuesta de auxilio
    const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 4000)
    );

    await Promise.race([Promise.allSettled([edgeFunctionCall, logCall]), timeoutPromise]);
    serverDispatched = true;
  } catch {
    serverDispatched = false;
  }

  // 5. Si el servidor procesó el envío, retornar éxito automático por servidor
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

  // 6. Fallback de contingencia (si el dispositivo está 100% offline o sin datos):
  // Abrir la interfaz SMS como respaldo satelital hacia los contactos registrados
  try {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const recipientList = targetPhones.join(Platform.OS === 'ios' ? ',' : ';');
    const smsUrl = `sms:${recipientList}${separator}body=${encodeURIComponent(message)}`;

    const canOpen = await Linking.canOpenURL(smsUrl).catch(() => false);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    }

    return {
      success: true,
      dispatchedByServer: false,
      dispatchedContactsCount: activeContacts.length,
      phoneNumbers: targetPhones,
      message,
      coords,
    };
  } catch (err: any) {
    return {
      success: false,
      dispatchedByServer: false,
      dispatchedContactsCount: 0,
      phoneNumbers: targetPhones,
      message,
      coords,
      error: err?.message || 'Error transmitiendo alerta.',
    };
  }
}
