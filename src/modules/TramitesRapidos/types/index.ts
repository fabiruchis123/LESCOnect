export interface TramitePhrase {
  phrase: string;
  gloss: string;
  text: string;
}

export interface TramiteSituation {
  id: string;
  title: string;
  situationNum: number;
  icon: string;
  description: string;
  phrases: TramitePhrase[];
}

export interface TramiteCategory {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  icon: string;
  themeColor: string;
  bgColor: string;
  borderColor: string;
  rompehielo: {
    phrase: string;
    gloss: string;
  };
  situations: TramiteSituation[];
}

export interface VentanillaModalProps {
  visible: boolean;
  text: string;
  categoryThemeColor?: string;
  onSpeak?: (text: string) => void;
  onWatchLesco?: (phrase: string, gloss?: string) => void;
  onClose: () => void;
}
