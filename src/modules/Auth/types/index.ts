export interface SignupFormValues {
  name: string;
  apellidos: string;
  cedula: string;
  phone: string;
  birthDate?: string;
  emergencyContact?: string;
}

export interface SignupErrors {
  name?: string;
  apellidos?: string;
  cedula?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
}

export interface SignupScreenProps {
  onSuccess?: () => void;
  onNavigateBack?: () => void;
}
