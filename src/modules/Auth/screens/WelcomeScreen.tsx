import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Badge, LescoVideoModal } from '@/shared/components';
import { colors } from '@/shared/theme/colors';

export function WelcomeScreen() {
  const router = useRouter();
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  return (
    <ScreenWrapper scrollable={false} backgroundColor={colors.background}>
      <View style={styles.container}>
        {/* Botón de Video LESCO Superior */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setIsVideoModalVisible(true)}
            style={({ pressed }) => [styles.videoBtn, pressed && styles.pressed]}>
            <Text style={styles.videoBtnIcon}>📹</Text>
          </Pressable>
        </View>

        {/* Contenido Central */}
        <View style={styles.centerContent}>
          {/* Icono Principal LESCO */}
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🤟</Text>
          </View>

          <Badge label="✦ Accesibilidad Sin Barreras" variant="salvia" showDot />

          <Text style={styles.title}>LESCOnect</Text>
          <Text style={styles.subtitle}>
            Traducción y comunicación bidireccional en Lenguaje de Señas Costarricense.
          </Text>
        </View>

        {/* Botón / Deslizar de Inicio */}
        <Pressable
          onPress={() => router.push('/(auth)/signup')}
          style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}>
          <View style={styles.actionTextFlex}>
            <Text style={styles.actionLabel}>COMENZAR</Text>
            <Text style={styles.actionTitle}>Toca para ingresar</Text>
          </View>

          <View style={styles.arrowCircle}>
            <Text style={styles.arrowText}>→</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'flex-end',
  },
  videoBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoBtnIcon: {
    fontSize: 20,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F3EADA',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2B241C',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7A6E5C',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 280,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: '#B5551A',
  },
  actionTextFlex: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A6E5C',
    letterSpacing: 0.8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
    marginTop: 2,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B5551A',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
