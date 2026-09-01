import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  Alert,
} from 'react-native';
import {
  ScreenWrapper,
  AppHeader,
  AppButton,
  Badge,
  AppCard,
} from '@/shared/components';
import { useAuthStore } from '@/shared/stores';
import { colors } from '@/shared/theme/colors';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [textSize, setTextSize] = useState<'Normal' | 'Grande' | 'Muy Grande'>('Normal');

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de LESCOnect?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <AppHeader
        title="Perfil de Usuario"
        subtitle="Ajustes de cuenta y accesibilidad"
        showUserBadge={false}
      />

      <View style={styles.content}>
        {/* TARJETA DE PERFIL DE USUARIO */}
        <AppCard style={styles.userProfileCard}>
          <View style={styles.userProfileRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>

            <View style={styles.userInfoFlex}>
              <Text style={styles.userName}>
                {user?.nombre} {user?.apellidos || 'Leiva'}
              </Text>
              <Text style={styles.userSub}>Cédula: {user?.cedula || '1-1234-5678'}</Text>
              <Text style={styles.userSub}>Tel: {user?.telefono || '8888-8888'}</Text>
              <View style={styles.badgeMargin}>
                <Badge label="Cuenta Sorda Verificada" variant="salvia" showDot />
              </View>
            </View>
          </View>
        </AppCard>

        {/* DATOS DE CONTACTO DE EMERGENCIA */}
        <AppCard style={styles.emergencyContactCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>🚨 Contacto de Emergencia</Text>
            <Badge label="Principal" variant="emergency" />
          </View>
          <Text style={styles.contactName}>Familiar / Amigo Registrado</Text>
          <Text style={styles.contactPhone}>
            📞 {user?.contactoEmergencia || '8765-4321'}
          </Text>
          <Text style={styles.contactNote}>
            Recibirá alertas SMS con tu ubicación GPS en caso de activar el botón SOS.
          </Text>
        </AppCard>

        {/* SECCIÓN ACCESIBILIDAD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accesibilidad y Preferencias LESCO</Text>
        </View>

        <AppCard style={styles.settingsCard}>
          {/* Tamaño de Fuente */}
          <View style={styles.settingItemRow}>
            <View style={styles.settingTextFlex}>
              <Text style={styles.settingTitle}>🔍 Tamaño de Texto</Text>
              <Text style={styles.settingSub}>Actual: {textSize}</Text>
            </View>
            <View style={styles.segmentedButtons}>
              <Pressable
                onPress={() => setTextSize('Normal')}
                style={[
                  styles.segBtn,
                  textSize === 'Normal' && styles.segBtnActive,
                ]}>
                <Text
                  style={[
                    styles.segBtnText,
                    textSize === 'Normal' && styles.segBtnTextActive,
                  ]}>
                  Normal
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTextSize('Grande')}
                style={[
                  styles.segBtn,
                  textSize === 'Grande' && styles.segBtnActive,
                ]}>
                <Text
                  style={[
                    styles.segBtnText,
                    textSize === 'Grande' && styles.segBtnTextActive,
                  ]}>
                  Grande
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Vibración Háptica */}
          <View style={styles.settingItemRow}>
            <View style={styles.settingTextFlex}>
              <Text style={styles.settingTitle}>📳 Vibración Háptica</Text>
              <Text style={styles.settingSub}>Respuesta al reconocer señas LESCO</Text>
            </View>
            <Switch
              value={isVibrationEnabled}
              onValueChange={setIsVibrationEnabled}
              trackColor={{ false: '#EAE0D0', true: '#B5551A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Modo Alto Contraste Exterior */}
          <View style={styles.settingItemRow}>
            <View style={styles.settingTextFlex}>
              <Text style={styles.settingTitle}>☀️ Modo Exterior / Alto Contraste</Text>
              <Text style={styles.settingSub}>Refuerza legibilidad bajo el sol</Text>
            </View>
            <Switch
              value={isHighContrastEnabled}
              onValueChange={setIsHighContrastEnabled}
              trackColor={{ false: '#EAE0D0', true: '#B5551A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AppCard>

        {/* BOTÓN CERRAR SESIÓN */}
        <View style={styles.logoutContainer}>
          <AppButton
            title="Cerrar Sesión 🚪"
            variant="outline"
            onPress={handleLogout}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  userProfileCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#F3EADA',
  },
  avatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  userInfoFlex: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 2,
  },
  userSub: {
    fontSize: 13,
    color: '#7A6E5C',
    fontWeight: '500',
  },
  badgeMargin: {
    marginTop: 6,
  },
  emergencyContactCard: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
    borderWidth: 1.5,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C0392B',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B5551A',
    marginBottom: 6,
  },
  contactNote: {
    fontSize: 12,
    color: '#7A6E5C',
    lineHeight: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B241C',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingTextFlex: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: '#7A6E5C',
  },
  segmentedButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3EADA',
    borderRadius: 12,
    padding: 3,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  segBtnTextActive: {
    color: '#B5551A',
  },
  divider: {
    height: 1,
    backgroundColor: '#FBF6EE',
    marginVertical: 4,
  },
  logoutContainer: {
    marginTop: 4,
  },
});
