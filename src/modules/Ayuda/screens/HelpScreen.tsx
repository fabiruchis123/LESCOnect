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
import { useSettingsStore } from '@/shared/stores/useSettingsStore';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/shared/components';

interface TutorialCard {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  r2Key: string;
  gloss: string;
}

const TUTORIALS: TutorialCard[] = [
  {
    id: 'controles',
    title: 'Controles de Video (0.5x y CC)',
    category: 'Aprendizaje Visual',
    description:
      'Aprende a pausar, repetir señas, activar cámara lenta (0.5x) y subtítulos sincronizados CC.',
    icon: '🐢',
    r2Key: 'lesco/v1/m2/2_4.mp4',
    gloss:
      'CONTROLES VIDEO DEBAJO / PAUSAR REPETIR SEÑA / VELOCIDAD LENTA 0.5X / SUBTÍTULOS CC',
  },
  {
    id: 'abecedario',
    title: 'Abecedario Dactilológico',
    category: 'Básico LESCO',
    description: 'Aprende la configuración manual de las letras A-Z en Costa Rica.',
    icon: '🤟',
    r2Key: 'lesco/v1/m3/3_2.mp4',
    gloss: 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z',
  },
  {
    id: 'saludos',
    title: 'Saludos y Cortesía',
    category: 'Ventanilla e Instituciones',
    description: 'Hola, buenos días, por favor, gracias y permiso en señas.',
    icon: '🗣️',
    r2Key: 'lesco/v1/m5/mensajes/0.mp4',
    gloss: 'HOLA / BUENOS DÍAS / POR FAVOR / MUCHAS GRACIAS / PERMISO',
  },
  {
    id: 'emergencias',
    title: 'Señas de Emergencia 9-1-1',
    category: 'Auxilio Inmediato',
    description: 'Cómo pedir auxilio, señalar peligro, fuego, dolor o asalto.',
    icon: '🚨',
    r2Key: 'lesco/v1/m4/4_1.mp4',
    gloss: 'AYUDA URGENTE / BOMBEROS FUEGO / POLICÍA ASALTO / HOSPITAL DOLOR',
  },
];

const FAQS = [
  {
    q: '¿Cómo muestro una frase en pantalla grande al funcionario?',
    a: 'En Trámites Rápidos o Historial, toca el botón "📱 Ventanilla". Se abrirá una tarjeta de alto contraste con letras gigantes para enseñar al personal de atención.',
  },
  {
    q: '¿Cómo funciona el envío silencioso al 9-1-1?',
    a: 'Al mantener presionado el botón de emergencia por 2 segundos, tus coordenadas GPS y el motivo de auxilio se enlazan automáticamente a tus contactos y autoridades sin obligarte a hablar o escuchar.',
  },
  {
    q: '¿La app funciona sin conexión a internet?',
    a: 'Sí. El catálogo de 54 videos con subtítulos CC, los trámites rápidos, el modal de ventanilla y los contactos SOS funcionan en modo offline una vez sincronizados en tu dispositivo.',
  },
];

export interface HelpScreenProps {
  onBackPress?: () => void;
}

export function HelpScreen({ onBackPress }: HelpScreenProps = {}) {
  const router = useRouter();
  const fontScale = useSettingsStore((state) => state.fontScale);
  const scaleFont = (size: number) => Math.round(size * fontScale);

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
      r2Key: item.r2Key,
      glossText: item.gloss,
    });
  };

  const handleOpenSupportVideo = () => {
    haptics.light();
    setActiveVideo({
      title: 'Ayuda y Recursos LESCO',
      category: 'Módulo 7 • Soporte e Inclusión',
      r2Key: 'lesco/v1/m7/7_2.mp4',
      glossText:
        'DUDAS USO LESCONECT / PREGUNTAS FRECUENTES / CONTACTO WHATSAPP CORREO ASISTENCIA',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Volver a Inicio"
          >
            <Text style={[styles.backBtnText, { fontSize: scaleFont(18) }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.backBtnLabel, { fontSize: scaleFont(Typography.sizes.xs) }]}>
            Volver a Inicio
          </Text>

          <TouchableOpacity
            onPress={handleOpenSupportVideo}
            style={styles.supportVideoChip}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ver video de soporte en señas LESCO"
          >
            <Text style={{ fontSize: scaleFont(13) }}>📹</Text>
            <Text style={[styles.supportVideoChipText, { fontSize: scaleFont(11) }]}>
              Ver en señas
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { fontSize: scaleFont(30) }]}>Ayuda LESCO</Text>
        <Text style={[styles.subtitle, { fontSize: scaleFont(Typography.sizes.xs) }]}>
          Aprende señas básicas y cómo usar todas las funciones de la app
        </Text>

        {/* Banner Informativo Interactuable */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={handleOpenSupportVideo}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Abrir video introductorio de Ayuda y Soporte en LESCO"
        >
          <View style={styles.heroIconBox}>
            <Text style={{ fontSize: scaleFont(28) }}>💡</Text>
          </View>
          <Text style={[styles.heroTitle, { fontSize: scaleFont(Typography.sizes.md) }]}>
            Tutoriales en video LESCO
          </Text>
          <Text
            style={[
              styles.heroSub,
              {
                fontSize: scaleFont(Typography.sizes.xs),
                lineHeight: scaleFont(18),
              },
            ]}
          >
            Desarrollados en colaboración con instructores certificados para facilitar la inclusión y comunicación con subtítulos CC sincronizados.
          </Text>
          <View style={styles.heroActionPill}>
            <Text style={[styles.heroActionPillText, { fontSize: scaleFont(11) }]}>
              🤟 Reproducir guía de soporte (7_2)
            </Text>
          </View>
        </TouchableOpacity>

        {/* Lista de Tutoriales en Video */}
        <Text style={[styles.sectionHeader, { fontSize: scaleFont(13) }]}>
          Guías en video:
        </Text>
        <View style={styles.tutorialsList}>
          {TUTORIALS.map((tut) => (
            <TouchableOpacity
              key={tut.id}
              style={styles.tutorialCard}
              onPress={() => handleOpenVideo(tut)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Ver video tutorial: ${tut.title}`}
            >
              <View style={styles.tutorialLeft}>
                <View style={styles.tutorialIconBox}>
                  <Text style={{ fontSize: scaleFont(24) }}>{tut.icon}</Text>
                </View>
                <View style={styles.tutorialTextCol}>
                  <Text style={[styles.tutorialCategory, { fontSize: scaleFont(9) }]}>
                    {tut.category}
                  </Text>
                  <Text
                    style={[
                      styles.tutorialTitle,
                      { fontSize: scaleFont(Typography.sizes.sm) },
                    ]}
                  >
                    {tut.title}
                  </Text>
                  <Text style={[styles.tutorialDesc, { fontSize: scaleFont(11) }]}>
                    {tut.description}
                  </Text>
                </View>
              </View>

              <View style={styles.playBtn}>
                <Text style={{ fontSize: scaleFont(14) }}>📹</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preguntas Frecuentes (FAQ) */}
        <Text style={[styles.sectionHeader, { fontSize: scaleFont(13) }]}>
          Preguntas frecuentes:
        </Text>
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
              accessibilityRole="button"
              accessibilityState={{ expanded: expandedFaq === idx }}
            >
              <View style={styles.faqHeader}>
                <Text
                  style={[
                    styles.faqQuestion,
                    { fontSize: scaleFont(Typography.sizes.xs) },
                  ]}
                >
                  {faq.q}
                </Text>
                <Text style={[styles.faqArrow, { fontSize: scaleFont(18) }]}>
                  {expandedFaq === idx ? '−' : '+'}
                </Text>
              </View>
              {expandedFaq === idx && (
                <Text
                  style={[
                    styles.faqAnswer,
                    {
                      fontSize: scaleFont(11),
                      lineHeight: scaleFont(17),
                    },
                  ]}
                >
                  {faq.a}
                </Text>
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
          onClose={() => {
            haptics.light();
            setActiveVideo(null);
          }}
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
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
  },
  supportVideoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.secondary.surface,
    borderWidth: 1,
    borderColor: Colors.secondary.border,
    gap: 4,
  },
  supportVideoChipText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
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
    marginBottom: Spacing.sm,
  },
  heroActionPill: {
    backgroundColor: Colors.primary.surface,
    borderColor: Colors.primary.light,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  heroActionPillText: {
    color: Colors.primary.main,
    fontWeight: Typography.weights.bold,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
