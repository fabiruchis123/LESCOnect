/**
 * @file appPermissionsService.ts
 * @description Gestor Unificado de Permisos del Sistema en el Arranque de la Aplicación:
 * 1. Mensajes / SMS (Lectura y recepción para detección y auto-completado de OTP del servidor)
 * 2. Contactos (Acceso a la agenda telefónica para importar contactos SOS)
 * 3. Ubicación GPS Satelital (Para despacho de coordenadas exactas en alertas SOS)
 * 4. Archivos / Almacenamiento (Para almacenamiento en caché local y precarga offline de videos)
 * 5. Cámara (Para el intérprete y traductor visual de señas LESCO)
 */

import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { Camera } from 'expo-camera';

export interface AppStartupPermissionsStatus {
  location: boolean;
  contacts: boolean;
  camera: boolean;
  sms: boolean;
  storage: boolean;
  allEssentialGranted: boolean;
}

class AppPermissionsService {
  private hasRequestedInitial = false;
  private currentStatus: AppStartupPermissionsStatus = {
    location: false,
    contacts: false,
    camera: false,
    sms: false,
    storage: false,
    allEssentialGranted: false,
  };

  /**
   * Solicita secuencialmente todos los permisos requeridos por LESCOnect
   * durante el inicio / splash de la aplicación.
   */
  async requestAllStartupPermissions(): Promise<AppStartupPermissionsStatus> {
    if (Platform.OS === 'web') {
      this.currentStatus = {
        location: true,
        contacts: false,
        camera: true,
        sms: false,
        storage: true,
        allEssentialGranted: true,
      };
      this.hasRequestedInitial = true;
      return this.currentStatus;
    }

    // 1. Ubicación Satelital GPS (Esencial para SOS)
    let locationGranted = false;
    try {
      const locRes = await Location.requestForegroundPermissionsAsync();
      locationGranted = locRes.granted;
    } catch {
      locationGranted = false;
    }

    // 2. Agenda de Contactos (Para seleccionar contactos SOS)
    let contactsGranted = false;
    try {
      const contRes = await Contacts.requestPermissionsAsync();
      contactsGranted = contRes.granted;
    } catch {
      contactsGranted = false;
    }

    // 3. Cámara (Para Traductor de señas LESCO)
    let cameraGranted = false;
    try {
      const camRes = await Camera.requestCameraPermissionsAsync();
      cameraGranted = camRes.granted;
    } catch {
      cameraGranted = false;
    }

    // 4. Mensajería SMS (Para interceptar / auto-leer el código OTP en Android)
    let smsGranted = false;
    if (Platform.OS === 'android') {
      try {
        const smsRead = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'Permiso de Mensajería SMS',
            message:
              'LESCOnect necesita verificar mensajes SMS entrantes para auto-completar tu código OTP de inicio de sesión de forma rápida y accesible.',
            buttonPositive: 'Permitir',
            buttonNegative: 'Omitir',
          }
        );
        smsGranted = smsRead === PermissionsAndroid.RESULTS.GRANTED;

        // Opcional: RECEIVE_SMS
        if (smsGranted) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
          ).catch(() => {});
        }
      } catch {
        smsGranted = false;
      }
    } else {
      // En iOS no existe permiso de lectura de SMS directo por sandbox de Apple,
      // Apple maneja el OTP automáticamente con UITextContentType="oneTimeCode"
      smsGranted = true;
    }

    // 5. Archivos / Almacenamiento (Para precarga de videos offline)
    let storageGranted = true;
    if (Platform.OS === 'android') {
      try {
        if (Number(Platform.Version) < 33) {
          const storageRes = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Almacenamiento y Archivos',
              message:
                'LESCOnect requiere almacenamiento para precargar los videos y recursos del diccionario LESCO sin conexión a internet.',
              buttonPositive: 'Permitir',
              buttonNegative: 'Omitir',
            }
          );
          storageGranted = storageRes === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 13+ (API 33+) utiliza almacenamiento contextual sin requerir READ_EXTERNAL_STORAGE
          storageGranted = true;
        }
      } catch {
        storageGranted = true;
      }
    }

    this.currentStatus = {
      location: locationGranted,
      contacts: contactsGranted,
      camera: cameraGranted,
      sms: smsGranted,
      storage: storageGranted,
      allEssentialGranted: locationGranted && cameraGranted,
    };

    this.hasRequestedInitial = true;
    return this.currentStatus;
  }

  /**
   * Abre el selector nativo de contactos del teléfono para importar un contacto SOS.
   * Retorna el nombre y teléfono limpio si el usuario seleccionó uno.
   */
  async pickPhoneContact(): Promise<{ name: string; phone: string } | null> {
    try {
      const { granted } = await Contacts.getPermissionsAsync();
      if (!granted) {
        const req = await Contacts.requestPermissionsAsync();
        if (!req.granted) return null;
      }

      // Probar si el selector nativo está disponible en el dispositivo
      if (typeof Contacts.presentContactPickerAsync === 'function') {
        const picked = await Contacts.presentContactPickerAsync();
        if (picked && picked.name && picked.phoneNumbers && picked.phoneNumbers.length > 0) {
          const rawPhone = picked.phoneNumbers[0]?.number || '';
          const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
          return {
            name: picked.name,
            phone: cleanPhone,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el estado actual de los permisos del sistema.
   */
  getStatus(): AppStartupPermissionsStatus {
    return this.currentStatus;
  }

  isInitialDone(): boolean {
    return this.hasRequestedInitial;
  }
}

export const appPermissionsService = new AppPermissionsService();
