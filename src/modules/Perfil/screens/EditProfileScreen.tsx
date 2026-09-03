import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { useAuthStore } from '@/shared/stores';

interface EditProfileScreenProps {
  onBackPress?: () => void;
}

export function EditProfileScreen({ onBackPress }: EditProfileScreenProps) {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [nombre, setNombre] = useState(user?.nombre || user?.name || 'Invitado');
  const [apellidos, setApellidos] = useState(user?.apellidos || 'Rodríguez Murillo');
  const [cedula, setCedula] = useState(user?.cedula || '1-1823-0492');
  const [telefono, setTelefono] = useState(user?.telefono || user?.phone || '8888-8888');
  const [emergencia, setEmergencia] = useState(user?.contactoEmergencia || user?.emergencyContact || '8765-4321 (Mamá)');

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa al menos tu nombre.');
      return;
    }
    haptics.success();
    updateUser({
      name: nombre.trim(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      cedula: cedula.trim(),
      phone: telefono.trim(),
      telefono: telefono.trim(),
      emergencyContact: emergencia.trim(),
      contactoEmergencia: emergencia.trim(),
    });
    Alert.alert('Perfil Actualizado', 'Tus datos fueron guardados exitosamente.', [
      { text: 'Aceptar', onPress: handleBack },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver al perfil</Text>
        </View>

        <Text style={styles.title}>Editar perfil</Text>
        <Text style={styles.subtitle}>Actualiza tus datos de contacto y emergencia</Text>

        <View style={styles.formCard}>
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre"
                placeholderTextColor="#7A6E5C"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={styles.input}
                value={apellidos}
                onChangeText={setApellidos}
                placeholder="Apellidos"
                placeholderTextColor="#7A6E5C"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cédula de identidad</Text>
            <TextInput
              style={styles.input}
              value={cedula}
              onChangeText={setCedula}
              placeholder="Cédula"
              placeholderTextColor="#7A6E5C"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Teléfono móvil</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Teléfono"
              placeholderTextColor="#7A6E5C"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contacto de emergencia directo</Text>
            <TextInput
              style={styles.input}
              value={emergencia}
              onChangeText={setEmergencia}
              placeholder="Contacto de emergencia"
              placeholderTextColor="#7A6E5C"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2B241C',
    fontWeight: Typography.weights.medium,
  },
  saveBtn: {
    backgroundColor: '#B5551A',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.primaryGlow,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
