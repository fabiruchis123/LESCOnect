import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts/legacy';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';
import { useAuthStore } from '@/shared/stores';
import { DatePickerModal } from '@/modules/Auth/components/DatePickerModal';
import {
  ContactPickerModal,
  PhoneContact,
  formatCRPhone,
} from '@/modules/Auth/components/ContactPickerModal';

interface EditProfileScreenProps {
  onBackPress?: () => void;
}

const RELATION_OPTIONS = ['Familiar', 'Amigo', 'Médico', 'Otro'];

export function EditProfileScreen({ onBackPress }: EditProfileScreenProps) {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  // Estados de datos personales
  const [nombre, setNombre] = useState(user?.nombre || user?.name || '');
  const [apellidos, setApellidos] = useState(user?.apellidos || '');
  const [cedula] = useState(user?.cedula || '');
  const [telefono, setTelefono] = useState(user?.telefono || user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.fechaNacimiento || '');

  // Estados de contacto SOS
  const initialSos = user?.sosContacts?.[0];
  const [emergencyContactName, setEmergencyContactName] = useState(
    user?.contactoEmergenciaNombre || initialSos?.name || ''
  );
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(
    user?.contactoEmergenciaParentesco || initialSos?.relation || 'Familiar'
  );
  const [emergencyContact, setEmergencyContact] = useState(
    user?.contactoEmergencia || user?.emergencyContact || initialSos?.phone || ''
  );
  const [emergencyContactKnowsLesco, setEmergencyContactKnowsLesco] = useState(
    user?.contactoEmergenciaSabeLesco ?? initialSos?.knowsLesco ?? false
  );

  // Estados de modales
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<PhoneContact[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Abrir Libreta de Contactos Nativa
  const handlePickContact = async () => {
    haptics.light();
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.FirstName,
            Contacts.Fields.LastName,
            Contacts.Fields.PhoneNumbers,
          ],
          sort: Contacts.SortTypes.FirstName,
        });
        if (data && data.length > 0) {
          setDeviceContacts(data as PhoneContact[]);
          setIsContactPickerVisible(true);
        } else {
          Alert.alert('Mis Contactos', 'No se encontraron contactos en tu dispositivo.');
        }
      } else {
        Alert.alert(
          'Permiso de Contactos',
          'Permite el acceso a tus contactos en los ajustes para seleccionar de tu libreta.'
        );
      }
    } catch (error) {
      console.warn('Error al leer contactos:', error);
      Alert.alert('Aviso', 'No se pudo acceder a la lista de contactos.');
    }
  };

  // Formato de Teléfono Móvil
  const handlePhoneChange = (text: string) => {
    setTelefono(formatCRPhone(text));
  };

  // Formato de Teléfono SOS
  const handleEmergencyContactChange = (text: string) => {
    setEmergencyContact(formatCRPhone(text));
  };

  // Formato de Fecha
  const handleBirthDateTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setBirthDate(formatted);
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa al menos tu nombre.');
      return;
    }
    haptics.success();

    // Actualizar SOS Contacts array reactivo
    const formattedSosPhone = formatCRPhone(emergencyContact);
    const updatedSosList = emergencyContactName.trim() && formattedSosPhone
      ? [
          {
            id: initialSos?.id || Date.now().toString(),
            name: emergencyContactName.trim(),
            phone: formattedSosPhone,
            relation: emergencyContactRelation,
            knowsLesco: emergencyContactKnowsLesco,
            receivesSms: true,
          },
        ]
      : user?.sosContacts || [];

    updateUser({
      name: nombre.trim(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      phone: telefono.trim(),
      telefono: telefono.trim(),
      fechaNacimiento: birthDate.trim(),
      contactoEmergencia: formattedSosPhone,
      emergencyContact: formattedSosPhone,
      contactoEmergenciaNombre: emergencyContactName.trim(),
      contactoEmergenciaParentesco: emergencyContactRelation,
      contactoEmergenciaSabeLesco: emergencyContactKnowsLesco,
      sosContacts: updatedSosList,
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

        <View style={styles.formContainer}>
          {/* Fila 1: Nombre y Apellidos */}
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={[styles.input, focusedField === 'nombre' && styles.inputFocused]}
                value={nombre}
                onChangeText={setNombre}
                onFocus={() => setFocusedField('nombre')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nombre"
                placeholderTextColor="#C4B8A6"
                autoCapitalize="words"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                style={[styles.input, focusedField === 'apellidos' && styles.inputFocused]}
                value={apellidos}
                onChangeText={setApellidos}
                onFocus={() => setFocusedField('apellidos')}
                onBlur={() => setFocusedField(null)}
                placeholder="Apellidos"
                placeholderTextColor="#C4B8A6"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Campo 2: Cédula de identidad (BLOQUEADA / NO EDITABLE) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRowWithBadge}>
              <Text style={styles.label}>Cédula de identidad</Text>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>🔒 Única (no editable)</Text>
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.inputLocked]}
              value={cedula || '5-0454-0188'}
              editable={false}
              placeholder="Ej: 1-1234-5678"
              placeholderTextColor="#8A7E6C"
            />
          </View>

          {/* Campo 3: Teléfono móvil */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Teléfono móvil</Text>
            <TextInput
              style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
              value={telefono}
              onChangeText={handlePhoneChange}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ej: 8673-4457"
              placeholderTextColor="#C4B8A6"
              keyboardType="phone-pad"
              maxLength={16}
            />
          </View>

          {/* Campo 4: Fecha de nacimiento con Selector Desplegable */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <View style={[styles.inputWithIcon, focusedField === 'birthDate' && styles.inputFocused]}>
              <TextInput
                style={styles.textInputInside}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#C4B8A6"
                value={birthDate}
                onChangeText={handleBirthDateTextChange}
                onFocus={() => setFocusedField('birthDate')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity
                style={{ padding: 6 }}
                onPress={() => {
                  haptics.light();
                  setIsDatePickerVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Abrir calendario"
              >
                <Text style={styles.trailingIcon}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección 5: Tarjeta de Contacto de Emergencia SOS */}
          <View style={styles.sosSection}>
            <View style={styles.sosHeaderRow}>
              <View style={styles.sosHeaderLeft}>
                <Text style={{ fontSize: 16 }}>🚨</Text>
                <Text style={styles.sosHeaderTitle}>Contacto SOS</Text>
              </View>

              <TouchableOpacity
                style={styles.pickContactBtn}
                onPress={handlePickContact}
                activeOpacity={0.75}
                accessibilityLabel="Elegir de mis contactos"
              >
                <Text style={{ fontSize: 12 }}>👤</Text>
                <Text style={styles.pickContactBtnText}>Mis contactos</Text>
              </TouchableOpacity>
            </View>

            {/* Nombre del Contacto */}
            <View style={styles.sosFieldGroup}>
              <Text style={styles.sosFieldLabel}>Nombre</Text>
              <TextInput
                style={[styles.sosInput, focusedField === 'sosName' && styles.inputFocused]}
                placeholder="Ej: Mamá / Dra. Salas"
                placeholderTextColor="#C4B8A6"
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                onFocus={() => setFocusedField('sosName')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            {/* Teléfono del Contacto */}
            <View style={styles.sosFieldGroup}>
              <Text style={styles.sosFieldLabel}>Teléfono</Text>
              <TextInput
                style={[styles.sosInput, focusedField === 'emergency' && styles.inputFocused]}
                placeholder="Ej: 8673-4457"
                placeholderTextColor="#C4B8A6"
                value={emergencyContact}
                onChangeText={handleEmergencyContactChange}
                onFocus={() => setFocusedField('emergency')}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                maxLength={16}
              />
            </View>

            {/* Parentesco / Relación */}
            <View style={styles.sosFieldGroup}>
              <Text style={styles.sosFieldLabel}>Parentesco</Text>
              <View style={styles.relationChipsRow}>
                {RELATION_OPTIONS.map((rel) => {
                  const isActive = emergencyContactRelation === rel;
                  return (
                    <TouchableOpacity
                      key={rel}
                      style={[styles.relationChip, isActive && styles.relationChipActive]}
                      onPress={() => {
                        haptics.light();
                        setEmergencyContactRelation(rel);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.relationChipText, isActive && styles.relationChipTextActive]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Checkbox Interactivo LESCO */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                haptics.light();
                setEmergencyContactKnowsLesco(!emergencyContactKnowsLesco);
              }}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: emergencyContactKnowsLesco }}
              accessibilityLabel="Sabe LESCO"
            >
              <Text style={styles.checkboxLabel}>🤟 Sabe LESCO</Text>
              <View style={[styles.checkbox, emergencyContactKnowsLesco && styles.checkboxActive]}>
                {emergencyContactKnowsLesco ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          </View>

          {/* Botón Guardar Cambios */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Calendario */}
      <DatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        onSelectDate={(dateStr) => setBirthDate(dateStr)}
      />

      {/* Modal de Selección de Contacto Nativo */}
      <ContactPickerModal
        visible={isContactPickerVisible}
        contacts={deviceContacts}
        onClose={() => setIsContactPickerVisible(false)}
        onSelectContact={(cName, cPhone) => {
          setEmergencyContactName(cName);
          if (cPhone) {
            handleEmergencyContactChange(cPhone);
          } else {
            Alert.alert(
              'Contacto sin teléfono',
              `El contacto "${cName}" no tiene un número telefónico registrado en tu libreta.`
            );
          }
        }}
      />
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
    fontSize: 28,
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
  formContainer: {
    gap: Spacing.sm + 2,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fieldGroup: {
    marginBottom: Spacing.xs,
  },
  labelRowWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B241C',
    marginBottom: 4,
  },
  lockedBadge: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E8DFCE',
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A7E6C',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: '#2B241C',
  },
  inputLocked: {
    backgroundColor: '#F3EADA',
    borderColor: '#E8DFCE',
    color: '#6A5E4C',
    fontWeight: '700',
  },
  inputFocused: {
    borderColor: '#B5551A',
    backgroundColor: '#FFFFFF',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  textInputInside: {
    flex: 1,
    fontSize: 14,
    color: '#2B241C',
    height: '100%',
  },
  trailingIcon: {
    fontSize: 16,
  },

  // SOS Section
  sosSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  sosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  sosHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  sosHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B5551A',
    flexShrink: 1,
  },
  pickContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EADA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    flexShrink: 0,
  },
  pickContactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B5551A',
  },
  sosFieldGroup: {
    marginBottom: Spacing.xs + 2,
  },
  sosFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B241C',
    marginBottom: 4,
  },
  sosInput: {
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: '#2B241C',
  },
  relationChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  relationChip: {
    flex: 1,
    backgroundColor: '#FBF6EE',
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationChipActive: {
    backgroundColor: '#B5551A',
    borderColor: '#B5551A',
  },
  relationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  relationChipTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF6EE',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E8DFCE',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B241C',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C4B8A6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#B5551A',
    borderColor: '#B5551A',
  },
  checkIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },
  saveBtn: {
    backgroundColor: '#B5551A',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
