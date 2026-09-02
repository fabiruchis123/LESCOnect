import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSettingsStore } from '@/shared/stores/useSettingsStore';
import { haptics } from '@/shared/utils/haptics';
import { Radius, Shadows, Spacing } from '@/shared/theme';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const vibrationEnabled = useSettingsStore((state) => state.vibrationEnabled);
  const toggleVibration = useSettingsStore((state) => state.toggleVibration);

  const [currentView, setCurrentView] = useState<'menu' | 'vibration'>('menu');
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const handleToggleVib = () => {
    toggleVibration();
    // Emitir pulso táctil inmediato tanto al activar como al desactivar
    haptics.test();
  };

  const handleTestVib = () => {
    haptics.test();
  };

  const handleAuthAction = () => {
    haptics.light();
    if (isAuthenticated) {
      logout();
      router.replace('/(auth)/welcome');
    } else {
      router.push('/(auth)/signup');
    }
  };

  const initial = (user?.name?.[0] || 'P').toUpperCase();
  const displayName = user?.name || 'Génesis Pamela';
  const displaySubtitle = 'Persona Sorda • LESCO';

  return (
    <SafeAreaView style={profileStyles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />

      {/* VISTA 1: SUB-PANTALLA DE VIBRACIÓN (Fiel al Prototipo) */}
      {currentView === 'vibration' ? (
        <ScrollView contentContainerStyle={profileStyles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Top Bar con Volver y Video LESCO */}
          <View style={profileStyles.subHeaderRow}>
            <TouchableOpacity
              style={profileStyles.backButton}
              onPress={() => {
                haptics.light();
                setCurrentView('menu');
              }}
              activeOpacity={0.8}
            >
              <Text style={profileStyles.backArrow}>←</Text>
              <Text style={profileStyles.backText}>Volver al perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={profileStyles.videoIconBtn}
              onPress={() => {
                haptics.light();
                setActiveVideo({
                  title: 'Configuración de Vibración',
                  category: 'Accesibilidad Táctil',
                  glossText: 'CONFIGURAR VIBRAR CELULAR / TOCAR BOTÓN CELULAR VIBRAR CONFIRMAR / MENSAJE LLEGAR SENTIR TACTO',
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>📹</Text>
            </TouchableOpacity>
          </View>

          {/* Título y Subtítulo */}
          <View style={profileStyles.subTitleBox}>
            <Text style={profileStyles.mainTitle}>Vibración</Text>
            <Text style={profileStyles.mainSubtitle}>
              Configuración de retroalimentación háptica
            </Text>
          </View>

          {/* Tarjeta de Configuración de Vibración con Checkbox */}
          <TouchableOpacity
            style={profileStyles.vibrationCard}
            onPress={handleToggleVib}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={profileStyles.cardTitle}>Activar vibración táctil</Text>
              <Text style={profileStyles.cardSubtitle}>
                Vibrar al tocar botones y al recibir mensajes
              </Text>
            </View>

            {/* Checkbox Visual Fiel al Prototipo */}
            <View style={[profileStyles.checkbox, vibrationEnabled && profileStyles.checkboxActive]}>
              {vibrationEnabled ? <Text style={profileStyles.checkboxCheck}>✓</Text> : null}
            </View>
          </TouchableOpacity>

          {/* Botón de Prueba de Vibración */}
          <TouchableOpacity
            style={profileStyles.testVibButton}
            onPress={handleTestVib}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>📳</Text>
            <Text style={profileStyles.testVibText}>Toca aquí para probar la vibración</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* VISTA 2: MENÚ DE PERFIL PRINCIPAL (Fiel al Prototipo) */
        <ScrollView contentContainerStyle={profileStyles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Título Superior */}
          <View style={profileStyles.headerBox}>
            <Text style={profileStyles.mainTitle}>Perfil</Text>
            <Text style={profileStyles.mainSubtitle}>Configuración de tu cuenta</Text>
          </View>

          {/* Avatar Cuadrado Redondeado Terracota */}
          <View style={profileStyles.avatarBox}>
            <View style={profileStyles.avatarCard}>
              <Text style={profileStyles.avatarLetter}>{initial}</Text>
            </View>
            <Text style={profileStyles.userName}>{displayName}</Text>
            <Text style={profileStyles.userStatus}>{displaySubtitle}</Text>
          </View>

          {/* Lista de Opciones */}
          <View style={profileStyles.optionsList}>
            {/* Opción 1: Editar perfil */}
            <TouchableOpacity
              style={profileStyles.optionCard}
              onPress={() => {
                haptics.light();
                router.push('/(auth)/signup');
              }}
              activeOpacity={0.85}
            >
              <View style={profileStyles.optionIconBox}>
                <Text style={{ fontSize: 18 }}>✏️</Text>
              </View>
              <View style={profileStyles.optionTextBox}>
                <Text style={profileStyles.optionTitle}>Editar perfil</Text>
                <Text style={profileStyles.optionSubtitle}>Actualiza nombre, cédula y teléfonos</Text>
              </View>
              <View style={profileStyles.optionRight}>
                <View style={profileStyles.videoPill}>
                  <Text style={{ fontSize: 13 }}>📹</Text>
                </View>
                <Text style={profileStyles.optionArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Opción 2: Tamaño de texto */}
            <TouchableOpacity
              style={profileStyles.optionCard}
              onPress={() => haptics.light()}
              activeOpacity={0.85}
            >
              <View style={[profileStyles.optionIconBox, { backgroundColor: '#EAF2F8' }]}>
                <Text style={{ fontSize: 16 }}>🔤</Text>
              </View>
              <View style={profileStyles.optionTextBox}>
                <Text style={profileStyles.optionTitle}>Tamaño de texto</Text>
                <Text style={profileStyles.optionSubtitle}>Ajusta el tamaño de la letra</Text>
              </View>
              <View style={profileStyles.optionRight}>
                <View style={[profileStyles.videoPill, { backgroundColor: '#EAF5EA' }]}>
                  <Text style={{ fontSize: 13 }}>📹</Text>
                </View>
                <Text style={profileStyles.optionArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Opción 3: Vibración */}
            <TouchableOpacity
              style={profileStyles.optionCard}
              onPress={() => {
                haptics.light();
                setCurrentView('vibration');
              }}
              activeOpacity={0.85}
            >
              <View style={[profileStyles.optionIconBox, { backgroundColor: '#FEF9E7' }]}>
                <Text style={{ fontSize: 18 }}>📳</Text>
              </View>
              <View style={profileStyles.optionTextBox}>
                <Text style={profileStyles.optionTitle}>Vibración</Text>
                <Text style={profileStyles.optionSubtitle}>
                  {vibrationEnabled ? 'Activada (Táctil)' : 'Desactivada'}
                </Text>
              </View>
              <View style={profileStyles.optionRight}>
                <View style={[profileStyles.videoPill, { backgroundColor: '#FEF9E7' }]}>
                  <Text style={{ fontSize: 13 }}>📹</Text>
                </View>
                <Text style={profileStyles.optionArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Botón Verde / Salvia Fiel al Prototipo */}
          <TouchableOpacity
            style={profileStyles.authButton}
            onPress={handleAuthAction}
            activeOpacity={0.85}
          >
            <Text style={profileStyles.authButtonText}>
              Cerrar Sesión / Probar Registro
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal de Video LESCO explicativo */}
      {activeVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  scrollContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  headerBox: {
    marginBottom: Spacing.md,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2B241C',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#7A6E5C',
    fontWeight: '600',
    marginTop: 2,
  },
  avatarBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  avatarCard: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.primaryGlow,
  },
  avatarLetter: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2B241C',
    marginTop: 4,
  },
  userStatus: {
    fontSize: 13,
    color: '#7A6E5C',
    fontWeight: '600',
    marginTop: 2,
  },
  optionsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    ...Shadows.card,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B241C',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#F3EADA',
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  optionArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A6E5C',
  },
  authButton: {
    backgroundColor: '#5C7A5C',
    borderRadius: 18,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B241C',
  },
  videoIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#F9E79F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitleBox: {
    marginBottom: Spacing.xl,
  },
  vibrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4B8A6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#5C7A5C',
    borderColor: '#455E45',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  testVibButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.xl,
    backgroundColor: '#F3EADA',
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E6B08A',
  },
  testVibText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B5551A',
  },
});
