export type AuthMode = 'signup' | 'sms_login';

export interface SignupFormValues {
  name: string;
  apellidos: string;
  cedula: string;
  phone: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactKnowsLesco?: boolean;
  phoneVerified?: boolean;
}

export interface SignupErrors {
  name?: string;
  apellidos?: string;
  cedula?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
}

export interface SignupScreenProps {
  onSuccess?: () => void;
  onNavigateBack?: () => void;
  initialMode?: AuthMode;
}

export interface OtpSendResult {
  success: boolean;
  normalizedPhone: string;
  displayPhone: string;
  channel: 'supabase' | 'assisted_local';
  /** Código de 6 dígitos recibido en el dispositivo para autocompletado asistido sin salir de la app */
  incomingSmsCode?: string;
  expiresAt: number;
  cooldownSeconds: number;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  token?: string;
  supabaseUserId?: string;
  remainingAttempts?: number;
  lockedSeconds?: number;
  error?: string;
}
