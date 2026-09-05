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
}
