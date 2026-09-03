export interface SosContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  knowsLesco?: boolean;  // Crucial para personas no oyentes: contacto sabe comunicarse en señas
  receivesSms?: boolean; // Contacto preparado para recibir alertas por SMS
}

export interface EmergencyCategory {
  id: string;
  title: string;
  tag: string;
  description: string;
  icon: string;
  phrase: string;
}

export interface EmergenciesScreenProps {
  onNavigateToSosContacts?: () => void;
  onBackPress?: () => void;
}

export interface SosContactsScreenProps {
  onBackPress?: () => void;
}
