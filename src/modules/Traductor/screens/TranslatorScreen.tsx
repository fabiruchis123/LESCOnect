import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ScreenWrapper,
  AppHeader,
  AppButton,
  Badge,
  AppCard,
} from '@/shared/components';
import { colors } from '@/shared/theme/colors';

export function TranslatorScreen() {
  const [activeTab, setActiveTab] = useState<'signToText' | 'textToSign'>('signToText');
  const [inputText, setInputText] = useState('');
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [lastRecognition, setLastRecognition] = useState(
    'Hola, necesito asistencia para un trámite en ventanilla'
  );

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <AppHeader
        title="Traductor LESCO"
        subtitle="Traducción bidireccional en tiempo real"
        showUserBadge={false}
      />

      <View style={styles.content}>
        {/* Selector de Modo (Tabs Señas↔Texto) */}
        <View style={styles.tabBarContainer}>
          <Pressable
            onPress={() => setActiveTab('signToText')}
            style={[
              styles.tabButton,
              activeTab === 'signToText' && styles.tabButtonActive,
            ]}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'signToText' && styles.tabTextActive,
              ]}>
              🤟 Señas a Texto
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('textToSign')}
            style={[
              styles.tabButton,
              activeTab === 'textToSign' && styles.tabButtonActive,
            ]}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'textToSign' && styles.tabTextActive,
              ]}>
              ✍️ Texto a Señas
            </Text>
          </Pressable>
        </View>

        {activeTab === 'signToText' ? (
          /* MODO 1: SEÑAS A TEXTO (CÁMARA / INFERENCIA) */
          <View style={styles.sectionContainer}>
            {/* Visor de Cámara Mockup */}
            <View style={styles.cameraViewport}>
              {/* Overlay de Estado */}
              <View style={styles.cameraHeaderOverlay}>
                <Badge
                  label="Inferencia LESCO • 30 FPS"
                  variant="salvia"
                  showDot
                />
                <Badge
                  label={isFrontCamera ? 'Frontal' : 'Posterior'}
                  variant="dark"
                />
              </View>

              {/* Marco de Escaneo de Manos */}
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <Text style={styles.scannerInstruction}>
                  Ubica tus manos dentro del recuadro
                </Text>
              </View>

              {/* Controles Flotantes Sobre Cámara */}
              <View style={styles.cameraControlsOverlay}>
                <Pressable
                  onPress={() => setIsFlashActive(!isFlashActive)}
                  style={[
                    styles.circleControlBtn,
                    isFlashActive && styles.circleControlBtnActive,
                  ]}>
                  <Text style={styles.controlIconText}>
                    {isFlashActive ? '⚡' : '💡'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsFrontCamera(!isFrontCamera)}
                  style={styles.circleControlBtn}>
                  <Text style={styles.controlIconText}>🔄</Text>
                </Pressable>

                <Pressable style={styles.circleControlBtn}>
                  <Text style={styles.controlIconText}>🔊</Text>
                </Pressable>

                <Pressable style={styles.circleControlBtn}>
                  <Text style={styles.controlIconText}>⛶</Text>
                </Pressable>
              </View>
            </View>

            {/* Tarjeta de Salida Reconocida */}
            <AppCard style={styles.recognitionCard} elevation={3}>
              <View style={styles.recognitionHeader}>
                <Text style={styles.recognitionTitle}>Traducción Detectada</Text>
                <Badge label="98% Confianza" variant="terracota" />
              </View>

              <Text style={styles.recognitionText}>"{lastRecognition}"</Text>

              <View style={styles.recognitionActionsRow}>
                <AppButton
                  title="Copiar"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  iconLeft={<Text>📋</Text>}
                  onPress={() => {}}
                />
                <AppButton
                  title="Escuchar"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  iconLeft={<Text>🔊</Text>}
                  onPress={() => {}}
                />
                <AppButton
                  title="Guardar"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  iconLeft={<Text>⭐</Text>}
                  onPress={() => {}}
                />
              </View>
            </AppCard>
          </View>
        ) : (
          /* MODO 2: TEXTO A SEÑAS (GENERADOR EN VIDEO) */
          <View style={styles.sectionContainer}>
            <AppCard style={styles.textInputCard}>
              <Text style={styles.inputCardTitle}>Escribe tu mensaje</Text>
              <Text style={styles.inputCardSubtitle}>
                El intérprete virtual traducirá tus palabras a Lenguaje de Señas
              </Text>

              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Ejemplo: Por favor indíqueme dónde queda la ventanilla 3 de cobros..."
                placeholderTextColor="#7A6E5C"
                value={inputText}
                onChangeText={setInputText}
              />

              <AppButton
                title="Convertir a LESCO en Video 🤟"
                variant="primary"
                onPress={() => {}}
              />
            </AppCard>

            {/* Visor de Video Avatar Mockup */}
            <AppCard style={styles.videoPlayerCard}>
              <View style={styles.videoPlayerViewport}>
                <Text style={styles.avatarEmoji}>🧑‍🏫</Text>
                <Text style={styles.videoStatusText}>
                  Intérprete listo para reproducir
                </Text>
                <Badge label="Señas Oficiales LESCO CR" variant="salvia" />
              </View>

              <View style={styles.playerControlsRow}>
                <AppButton
                  title="Reproducir Señas ▶"
                  variant="primary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => {}}
                />
                <AppButton
                  title="Repetir 🔁"
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onPress={() => {}}
                />
              </View>
            </AppCard>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EADA',
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  tabTextActive: {
    color: '#B5551A',
  },
  sectionContainer: {
    width: '100%',
  },
  cameraViewport: {
    width: '100%',
    height: 340,
    backgroundColor: '#1E1B18',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#3D342B',
  },
  cameraHeaderOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerFrame: {
    alignSelf: 'center',
    width: 220,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#B5551A',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scannerInstruction: {
    color: '#F3EADA',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cameraControlsOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  circleControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleControlBtnActive: {
    backgroundColor: '#B5551A',
    borderColor: '#F3EADA',
  },
  controlIconText: {
    fontSize: 18,
  },
  recognitionCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
  },
  recognitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recognitionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recognitionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B241C',
    lineHeight: 24,
    marginBottom: 16,
  },
  recognitionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  textInputCard: {
    marginBottom: 16,
  },
  inputCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 4,
  },
  inputCardSubtitle: {
    fontSize: 13,
    color: '#7A6E5C',
    marginBottom: 14,
  },
  textArea: {
    backgroundColor: '#FBF6EE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    padding: 14,
    fontSize: 15,
    color: '#2B241C',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 14,
  },
  videoPlayerCard: {
    backgroundColor: '#FFFFFF',
  },
  videoPlayerViewport: {
    height: 220,
    backgroundColor: '#F3EADA',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  avatarEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  videoStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B241C',
    marginBottom: 8,
  },
  playerControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
