export interface QuickMessageCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  themeKey: 'hospital' | 'policia' | 'banco' | 'general';
}

export interface HomeScreenProps {
  onNavigateToTranslator?: (mode?: 'signs_to_text' | 'text_to_signs') => void;
  onNavigateToEmergencies?: () => void;
  onNavigateToTramites?: (category?: string) => void;
  onNavigateToHistory?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToProfile?: () => void;
}
