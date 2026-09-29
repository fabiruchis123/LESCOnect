import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { formatCRPhone } from '@/modules/Auth/components/ContactPickerModal';
import { SosContact } from '../types/emergencias.types';

/**
 * AddSosContactScreen — Pantalla dedicada para agregar un nuevo contacto SOS.
 *
 * Diseñada para población sorda (LESCO / LESCOnect):
 * - Campos grandes con etiquetas claras y descriptivas
 * - Touch targets mínimo de 52pt
 * - Feedback visual inmediato
 * - Sin modales inline — flujo limpio en pantalla completa
 */
export function AddSosContactScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const contacts: SosContact[] = React.useMemo(() => {
    if (user?.sosContacts && user.sosContacts.length > 0) {
      return user.sosContacts as SosContact[];
    }
    if (user?.contactoEmergenciaNombre || user?.contactoEmergencia || user?.emergencyContact) {
      return [
        {
          id: 'sos-primary',
          name: user.contactoEmergenciaNombre || 'Contacto SOS',
          phone: user.contactoEmergencia || user.emergencyContact || '',
          relation: user.contactoEmergenciaParentesco || 'Familiar SOS',
          knowsLesco: user.contactoEmergenciaSabeLesco ?? true,
          receivesSms: true,
        },
      ];
    }
    return [];
  }, [
    user?.sosContacts,
    user?.contactoEmergenciaNombre,
    user?.contactoEmergencia,
    user?.emergencyContact,
    user?.contactoEmergenciaParentesco,
    user?.contactoEmergenciaSabeLesco,
  ]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [knowsLesco, setKnowsLesco] = useState(false);
  const [receivesSms, setReceivesSms] = useState(true);

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(
        'Campos requeridos',
        'Por favor ingresa el nombre y número de teléfono del contacto.'
      );
      return;
    }

    if (contacts.length >= 5) {
      Alert.alert(
        'Límite alcanzado',
        'El límite máximo es de 5 contactos SOS. Elimina uno antes de agregar otro.'
      );
      return;
    }

    haptics.success();
    const formattedPhone = formatCRPhone(phone);
    const newContact: SosContact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: formattedPhone,
      relation: relation.trim() || 'Contacto SOS',
      knowsLesco,
      receivesSms,
    };

    const updated = [...contacts, newContact];
    updateUser({ sosContacts: updated });
    router.back();
  };

  const isLimitReached = contacts.length >= 5;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header de navegación */}
      <View style={styles.navBar}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver a Contactos SOS"
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.navTitle}>Nuevo Contacto SOS</Text>
        <View style={styles.navRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >


        {/* Alerta de límite */}
        {isLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              ⚠️ Ya tienes 5 contactos SOS (límite máximo). Elimina uno desde la pantalla anterior.
            </Text>
          </View>
        )}

        {/* Formulario */}
        <View style={styles.formCard}>
          {/* Nombre */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>👤 Nombre completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mamá / Dr. Vargas / Vecino Juan"
              placeholderTextColor="#9E9280"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!isLimitReached}
              accessibilityLabel="Nombre completo del contacto"
            />
          </View>

          {/* Teléfono */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📞 Número de teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 8888-8888"
              placeholderTextColor="#9E9280"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              returnKeyType="next"
              editable={!isLimitReached}
              accessibilityLabel="Número de teléfono del contacto"
            />
          </View>

          {/* Parentesco */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>🤝 Parentesco o rol</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Familiar / Intérprete LESCO / Amigo"
              placeholderTextColor="#9E9280"
              value={relation}
              onChangeText={setRelation}
              returnKeyType="done"
              editable={!isLimitReached}
              accessibilityLabel="Parentesco o rol del contacto"
            />
          </View>

          <View style={styles.divider} />

          {/* Switch: Sabe señas LESCO */}
          <TouchableOpacity
            style={styles.switchRow}
            activeOpacity={0.7}
            onPress={() => !isLimitReached && setKnowsLesco(!knowsLesco)}
            accessibilityRole="switch"
            accessibilityState={{ checked: knowsLesco }}
            accessibilityLabel="Este contacto sabe señas LESCO o es intérprete"
          >
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>🤟 Sabe señas LESCO o es intérprete</Text>
              <Text style={styles.switchSub}>Comunicación por videollamada</Text>
            </View>
            <Switch
              value={knowsLesco}
              onValueChange={setKnowsLesco}
              trackColor={{ false: '#EAE0D0', true: Colors.secondary?.border ?? '#7DA87B' }}
              thumbColor={knowsLesco ? (Colors.secondary?.main ?? '#5C7A5C') : '#FFFFFF'}
              disabled={isLimitReached}
            />
          </TouchableOpacity>

          {/* Switch: Recibe alertas SMS */}
          <TouchableOpacity
            style={styles.switchRow}
            activeOpacity={0.7}
            onPress={() => !isLimitReached && setReceivesSms(!receivesSms)}
            accessibilityRole="switch"
            accessibilityState={{ checked: receivesSms }}
            accessibilityLabel="Este contacto recibirá alertas por mensaje de texto SMS"
          >
            <View style={styles.switchTextCol}>
              <Text style={styles.switchLabel}>💬 Recibe alertas por SMS</Text>
              <Text style={styles.switchSub}>Recibirá tu ubicación GPS</Text>
            </View>
            <Switch
              value={receivesSms}
              onValueChange={setReceivesSms}
              trackColor={{ false: '#EAE0D0', true: Colors.primary?.border ?? '#F5B7B1' }}
              thumbColor={receivesSms ? (Colors.primary?.main ?? '#C0392B') : '#FFFFFF'}
              disabled={isLimitReached}
            />
          </TouchableOpacity>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.saveBtn, isLimitReached && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isLimitReached}
          accessibilityRole="button"
          accessibilityLabel="Guardar este contacto SOS"
        >
          <Text style={styles.saveBtnIcon}>✓</Text>
          <Text style={styles.saveBtnText}>Guardar contacto</Text>
        </TouchableOpacity>

        {/* Botón Cancelar */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancelar y volver"
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },

  // Barra de navegación superior
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FBF6EE',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D0',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B241C',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  navRight: {
    width: 44,
  },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.md,
  },

  // Header section
  headerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FDEDEC',
    borderWidth: 2,
    borderColor: '#F5B7B1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  headerIcon: {
    fontSize: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  // Alerta de límite
  limitBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1.5,
    borderColor: '#FFCA28',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  limitBannerText: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    color: '#6D4C00',
    lineHeight: 20,
  },

  // Card del formulario
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#FBF6EE',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: Typography.weights.medium,
    color: '#2B241C',
    minHeight: 52,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE0D0',
    marginVertical: 2,
  },

  // Filas de Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    lineHeight: 20,
  },
  switchSub: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 2,
    lineHeight: 16,
  },

  // Botón Guardar
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5551A',
    borderRadius: Radius.xl,
    paddingVertical: 18,
    gap: 8,
    minHeight: 60,
    ...Shadows.subtle,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: Typography.weights.black,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Botón Cancelar
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    minHeight: 56,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },

  // Nota informativa
  infoCard: {
    backgroundColor: '#F3EADA',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  infoText: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
    textAlign: 'center',
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
