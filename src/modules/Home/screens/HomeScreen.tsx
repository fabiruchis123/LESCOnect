import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenWrapper,
  AppHeader,
  Badge,
  LescoVideoModal,
} from '@/shared/components';
import { colors } from '@/shared/theme/colors';

export function HomeScreen() {
  const router = useRouter();
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <AppHeader
        showUserBadge
        onVideoTutorialPress={() => setIsVideoModalVisible(true)}
      />

      <View style={styles.content}>
        {/* ======================================================= */}
        {/* ⭐ PRIORIDAD 1: HERO CARD - TRADUCTOR (PALETA TERRACOTA) */}
        {/* ======================================================= */}
        <View style={styles.heroCard}>
          {/* Header del Hero */}
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadgeLeft}>
              <Badge label="✦ FUNCIÓN PRINCIPAL" variant="dark" />
            </View>
            <Pressable
              onPress={() => setIsVideoModalVisible(true)}
              style={({ pressed }) => [styles.heroVideoBtn, pressed && styles.pressed]}>
              <Text style={styles.heroVideoText}>📹 Tutorial LESCO</Text>
            </Pressable>
          </View>

          {/* Título e Icono de Encabezado */}
          <View style={styles.heroTitleRow}>
            <View style={styles.heroLogoCircle}>
              <Text style={styles.heroLogoEmoji}>🤟</Text>
            </View>
            <View style={styles.heroTitleTextFlex}>
              <Text style={styles.heroTitle}>Traductor LESCO</Text>
              <Text style={styles.heroSubtitleTag}>TRADUCCIÓN DIRECTA</Text>
            </View>
          </View>

          {/* BOTONES GRANDES APILADOS VERTICALMENTE EN COLUMNA (FIEL AL PROTOTIPO) */}
          <View style={styles.stackedButtonsColumn}>
            {/* Botón 1: Señas a Voz / Texto */}
            <Pressable
              onPress={() => router.push('/(tabs)/traductor')}
              style={({ pressed }) => [styles.stackedBtn, pressed && styles.stackedBtnPressed]}>
              <View style={styles.stackedBtnLeftRow}>
                <View style={[styles.stackedIconBox, styles.stackedIconBoxTerracota]}>
                  <Text style={styles.stackedEmoji}>📷</Text>
                </View>
                <View style={styles.stackedTextFlex}>
                  <Text style={styles.stackedBtnTitle}>Señas a Voz</Text>
                  <Text style={styles.stackedBtnSub}>Reconocimiento con cámara LESCO</Text>
                </View>
              </View>
              <View style={[styles.stackedArrowCircle, styles.stackedArrowTerracota]}>
                <Text style={styles.stackedArrowText}>→</Text>
              </View>
            </Pressable>

            {/* Botón 2: Voz / Texto a Señas */}
            <Pressable
              onPress={() => router.push('/(tabs)/traductor')}
              style={({ pressed }) => [styles.stackedBtn, pressed && styles.stackedBtnPressed]}>
              <View style={styles.stackedBtnLeftRow}>
                <View style={[styles.stackedIconBox, styles.stackedIconBoxSalvia]}>
                  <Text style={styles.stackedEmoji}>🎙️</Text>
                </View>
                <View style={styles.stackedTextFlex}>
                  <Text style={styles.stackedBtnTitle}>Voz a Señas</Text>
                  <Text style={styles.stackedBtnSub}>Dictado y clips de señas</Text>
                </View>
              </View>
              <View style={[styles.stackedArrowCircle, styles.stackedArrowSalvia]}>
                <Text style={styles.stackedArrowTextSalvia}>→</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ======================================================= */}
        {/* 🚨 PRIORIDAD 2: EMERGENCIAS (COLOR CORAL URGENTE)       */}
        {/* ======================================================= */}
        <Pressable
          onPress={() => router.push('/(tabs)/emergencias')}
          style={({ pressed }) => [styles.emergencyHeroCard, pressed && styles.pressed]}>
          <View style={styles.emergencyLeftRow}>
            <View style={styles.emergencyIconBox}>
              <Text style={styles.emergencyEmoji}>🚨</Text>
            </View>
            <View style={styles.emergencyTextFlex}>
              <View style={styles.emergencyHeaderBadgeRow}>
                <Text style={styles.emergencyTitle}>Emergencias</Text>
                <View style={styles.sosBadgePill}>
                  <Text style={styles.sosBadgeText}>SOS</Text>
                </View>
              </View>
              <Text style={styles.emergencySub}>Policía, Ambulancia, Bomberos</Text>
            </View>
          </View>
          <View style={styles.emergencyArrowCircle}>
            <Text style={styles.emergencyArrowText}>→</Text>
          </View>
        </Pressable>
      </View>

      {/* Modal de Tutorial Video LESCO */}
      <LescoVideoModal
        visible={isVideoModalVisible}
        onClose={() => setIsVideoModalVisible(false)}
        videoTitle="Bienvenida a LESCOnect"
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#B5551A',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D46B28',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroBadgeLeft: {
    alignSelf: 'flex-start',
  },
  heroVideoBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroVideoText: {
    color: '#F3EADA',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroLogoCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroLogoEmoji: {
    fontSize: 28,
  },
  heroTitleTextFlex: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSubtitleTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F3EADA',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  stackedButtonsColumn: {
    gap: 12,
  },
  stackedBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  stackedBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F3EADA',
  },
  stackedBtnLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stackedIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stackedIconBoxTerracota: {
    backgroundColor: '#F3EADA',
  },
  stackedIconBoxSalvia: {
    backgroundColor: '#EBF2EB',
  },
  stackedEmoji: {
    fontSize: 22,
  },
  stackedTextFlex: {
    flex: 1,
  },
  stackedBtnTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2B241C',
  },
  stackedBtnSub: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 1,
  },
  stackedArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  stackedArrowTerracota: {
    backgroundColor: '#F3EADA',
  },
  stackedArrowSalvia: {
    backgroundColor: '#EBF2EB',
  },
  stackedArrowText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
  },
  stackedArrowTextSalvia: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5C7A5C',
  },

  // Emergencias Hero Button
  emergencyHeroCard: {
    backgroundColor: '#C0392B',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E6B0AA',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emergencyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  emergencyEmoji: {
    fontSize: 24,
  },
  emergencyTextFlex: {
    flex: 1,
  },
  emergencyHeaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sosBadgePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sosBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C0392B',
  },
  emergencySub: {
    fontSize: 12,
    color: '#FADBD8',
    fontWeight: '500',
    marginTop: 2,
  },
  emergencyArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emergencyArrowText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C0392B',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
