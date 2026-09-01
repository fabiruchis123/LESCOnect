import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, AppButton, Badge, AppInput } from '@/shared/components';
import { useAuthStore } from '@/shared/stores';
import { colors } from '@/shared/theme/colors';

export function SignupScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [nombre, setNombre] = useState('Pamela');
  const [apellidos, setApellidos] = useState('Leiva');
  const [cedula, setCedula] = useState('1-1234-5678');
  const [telefono, setTelefono] = useState('8888-8888');
  const [fecha, setFecha] = useState('1998-05-15');
  const [emergencia, setEmergencia] = useState('8765-4321');

  const handleSubmit = () => {
    login(
      {
        id: 'user-1',
        name: `${nombre} ${apellidos}`,
        nombre,
        apellidos,
        cedula,
        telefono,
        fechaNacimiento: fecha,
        contactoEmergencia: emergencia,
      },
      'demo-token-123'
    );
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    login(
      {
        id: 'user-guest',
        name: 'Invitado Sordo',
        nombre: 'Invitado',
        apellidos: 'LESCO',
      },
      'guest-token'
    );
    router.replace('/(tabs)');
  };

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <View style={styles.content}>
        <View style={styles.headerBadgeRow}>
          <Badge label="PASO 1 DE 1" variant="terracota" />
        </View>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Ingresa tus datos para personalizar tu experiencia en LESCOnect
        </Text>

        <View style={styles.formGrid}>
          <View style={styles.nameRow}>
            <View style={styles.halfInput}>
              <AppInput
                label="Nombre"
                placeholder="Ej: Pamela"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
            <View style={styles.halfInput}>
              <AppInput
                label="Apellidos"
                placeholder="Ej: Leiva"
                value={apellidos}
                onChangeText={setApellidos}
              />
            </View>
          </View>

          <AppInput
            label="Cédula de identidad"
            placeholder="Ej: 1-1234-5678"
            keyboardType="numeric"
            value={cedula}
            onChangeText={setCedula}
          />

          <AppInput
            label="Teléfono"
            placeholder="8888-8888"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />

          <AppInput
            label="Fecha de nacimiento"
            placeholder="AAAA-MM-DD"
            value={fecha}
            onChangeText={setFecha}
          />

          <AppInput
            label="Contacto de emergencia (SOS)"
            placeholder="Teléfono de familiar o amigo"
            keyboardType="phone-pad"
            helper="Recibirá tus alertas con coordenadas GPS en emergencias"
            value={emergencia}
            onChangeText={setEmergencia}
          />

          <View style={styles.buttonsContainer}>
            <AppButton
              title="Crear cuenta →"
              variant="primary"
              size="lg"
              onPress={handleSubmit}
            />

            <View style={styles.buttonSpacer} />

            <AppButton
              title="Omitir por el momento"
              variant="secondary"
              size="md"
              onPress={handleSkip}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  headerBadgeRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#2B241C',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6E5C',
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGrid: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  buttonsContainer: {
    marginTop: 16,
  },
  buttonSpacer: {
    height: 12,
  },
});
