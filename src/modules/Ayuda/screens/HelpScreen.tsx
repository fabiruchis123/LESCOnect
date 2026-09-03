import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

interface TutorialCard {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  gloss: string;
}

const TUTORIALS: TutorialCard[] = [
  {
    id: 'abecedario',
    title: 'Abecedario Dactilológico',
    category: 'Básico LESCO',
    description: 'Aprende la configuración manual de las letras A-Z en Costa Rica.',
    icon: '🤟',
    gloss: 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z',
  },
  {
    id: 'saludos',
    title: 'Saludos y Cortesía',
    category: 'Ventanilla e Instituciones',
    description: 'Hola, buenos días, por favor, gracias y permiso en señas.',
    icon: '🗣️',
    gloss: 'HOLA / BUENOS DÍAS / POR FAVOR / MUCHAS GRACIAS / PERMISO',
  },
  {
    id: 'emergencias',
    title: 'Señas de Emergencia 9-1-1',
    category: 'Auxilio Inmediato',
    description: 'Cómo pedir auxilio, señalar peligro, fuego, dolor o asalto.',
    icon: '🚨',
    gloss: 'AYUDA URGENTE / BOMBEROS FUEGO / POLICÍA ASALTO / HOSPITAL DOLOR',
  },
];

const FAQS = [
  {
    q: '¿Cómo muestro una frase en pantalla grande al funcionario?',
    a: 'En Trámites Rápidos o Historial, toca el botón "📱 Mostrar en grande". Se abrirá una tarjeta de alto contraste con letras gigantes para enseñar al personal de ventanilla.',
  },
  {
    q: '¿Cómo funciona el envío silencioso al 9-1-1?',
    a: 'Al presionar un botón de emergencia, tus coordenadas GPS y el motivo de auxilio se enlazan automáticamente en segundo plano a las autoridades sin obligarte a hablar o escuchar.',
  },
  {
    q: '¿La app funciona sin conexión a internet?',
    a: 'Los mensajes rápidos, el modal de ventanilla y los contactos SOS funcionan offline en tu dispositivo. Solo la detección de cámara requiere conexión para actualizaciones de modelos.',
  },
];

export interface HelpScreenProps {
  onBackPress?: () => void;
}

export function HelpScreen({ onBackPress }: HelpScreenProps = {}) {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleOpenVideo = (item: TutorialCard) => {
    haptics.light();
    setActiveVideo({
      title: item.title,
      category: item.category,
      glossText: item.gloss,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver a Inicio</Text>
        </View>

        <Text style={styles.title}>Ayuda LESCO</Text>
        <Text style={styles.subtitle}>Aprende señas básicas y cómo usar la app</Text>

        {/* Banner Informativo */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Text style={{ fontSize: 28 }}>💡</Text>
          </View>
          <Text style={styles.heroTitle}>Tutoriales en video LESCO</Text>
          <Text style={styles.heroSub}>
            Desarrollados en colaboración con instructores certificados para facilitar la inclusión y comunicación.
          </Text>
        </View>

        {/* Lista de Tutoriales en Video */}
        <Text style={styles.sectionHeader}>Guías en video:</Text>
        <View style={styles.tutorialsList}>
          {TUTORIALS.map((tut) => (
            <TouchableOpacity
              key={tut.id}
              style={styles.tutorialCard}
              onPress={() => handleOpenVideo(tut)}
              activeOpacity={0.8}
            >
              <View style={styles.tutorialLeft}>
                <View style={styles.tutorialIconBox}>
                  <Text style={{ fontSize: 24 }}>{tut.icon}</Text>
                </View>
                <View style={styles.tutorialTextCol}>
                  <Text style={styles.tutorialCategory}>{tut.category}</Text>
                  <Text style={styles.tutorialTitle}>{tut.title}</Text>
                  <Text style={styles.tutorialDesc}>{tut.description}</Text>
                </View>
              </View>

              <View style={styles.playBtn}>
                <Text style={{ fontSize: 14 }}>📹</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preguntas Frecuentes (FAQ) */}
        <Text style={styles.sectionHeader}>Preguntas frecuentes:</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqCard}
              onPress={() => {
                haptics.light();
                setExpandedFaq(expandedFaq === idx ? null : idx);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={styles.faqArrow}>{expandedFaq === idx ? '−' : '+'}</Text>
              </View>
              {expandedFaq === idx && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal Video LESCO */}
      {activeVideo && (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl * 2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    ...Shadows.subtle,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B241C',
  },
  backBtnLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },
  title: {
    fontSize: 30,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.lg,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.subtle,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#C8DAC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  tutorialsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  tutorialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  tutorialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialTextCol: {
    flex: 1,
  },
  tutorialCategory: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
    textTransform: 'uppercase',
  },
  tutorialTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  tutorialDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    marginTop: 2,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqList: {
    gap: Spacing.sm,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    flex: 1,
    paddingRight: 8,
  },
  faqArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B5551A',
  },
  faqAnswer: {
    fontSize: 11,
    color: '#7A6E5C',
    lineHeight: 16,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3EADA',
    paddingTop: Spacing.sm,
  },
});
