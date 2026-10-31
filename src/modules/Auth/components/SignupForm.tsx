import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { styles } from '../styles/auth.styles';
import { SignupErrors, SignupFormValues } from '../types';
import { DatePickerModal } from './DatePickerModal';
import { ContactPickerModal, PhoneContact, formatCRPhone } from './ContactPickerModal';
import { isValidCRPhone, sanitizeCRPhoneDigits } from '../services/otpService';
import { sanitizeText, validateAndFormatCedulaCR } from '@/shared/utils/security';
import { haptics } from '@/shared/utils/haptics';
import { LescoVideoModal, type LescoVideoInfo } from '@/shared/components';

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
  onRequestPhoneOtp?: (phone: string, userName: string, onVerified: () => void) => void;
  isLoading?: boolean;
}

const RELATION_OPTIONS = ['Familiar', 'Amigo', 'Médico', 'Otro'];

export function SignupForm({
  onSubmit,
  onRequestPhoneOtp,
  isLoading = false,
}: SignupFormProps) {
  const [name, setName] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [birthDate, setBirthDate] = useState('');

  // Contacto SOS Extendido
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Familiar');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyContactKnowsLesco, setEmergencyContactKnowsLesco] = useState(false);

  // Modales
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isContactPickerVisible, setIsContactPickerVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<PhoneContact[]>([]);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<SignupErrors>({});

  // Abrir Libreta de Contactos Nativa Moderna
  const handlePickContact = async () => {
    haptics.light();
    if (Platform.OS === 'web') {
      Alert.alert(
        'Libreta de Contactos',
        'En navegador web escribe el nombre y teléfono manualmente. En el celular puedes elegir directamente de tus contactos.'
      );
      return;
    }
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
          Alert.alert('Libreta de Contactos', 'No se encontraron contactos en tu dispositivo.');
        }
      } else {
        Alert.alert(
          'Permiso de Contactos',
          'Permite el acceso a tus contactos en los ajustes para seleccionar de tu libreta.'
        );
      }
    } catch {
      Alert.alert('Aviso', 'No se pudo acceder a la libreta de contactos.');
    }
  };

  // Formato Cédula (ej. 1-1234-5678)
  const handleCedulaChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 1 && cleaned.length <= 5) {
      formatted = `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
    } else if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 9)}`;
    }
    setCedula(formatted);
    if (errors.cedula) setErrors((prev) => ({ ...prev, cedula: undefined }));
  };

  // Formato Teléfono (ej. 8888-8888)
  const handlePhoneChange = (text: string) => {
    const formatted = formatCRPhone(text);
    setPhone(formatted);
    setPhoneVerified(false);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // Formato Teléfono SOS (ej. 8888-8888)
  const handleEmergencyContactChange = (text: string) => {
    const formatted = formatCRPhone(text);
    setEmergencyContact(formatted);
    if (errors.emergencyContact) setErrors((prev) => ({ ...prev, emergencyContact: undefined }));
  };

  // Formato Fecha de Nacimiento (ej. dd/mm/aaaa)
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

  const phoneDigits = sanitizeCRPhoneDigits(phone);
  const hasCompletePhone = isValidCRPhone(phone);

  const handleSubmit = () => {
    const newErrors: SignupErrors = {};
    const cleanName = sanitizeText(name, 60);
    const cleanApellidos = sanitizeText(apellidos, 80);
    const cedulaCheck = validateAndFormatCedulaCR(cedula);

    if (!cleanName) newErrors.name = 'Requerido';
    if (!cleanApellidos) newErrors.apellidos = 'Requerido';
    if (!cedulaCheck.isValid) {
      newErrors.cedula = 'Ingresa los 9 dígitos de tu cédula (ej: 1-1234-5678)';
    }
    if (phoneDigits.length > 0 && !hasCompletePhone) {
      newErrors.phone = 'Ingresa un celular válido de 8 dígitos (ej: 8888-8888)';
    }

    if (Object.keys(newErrors).length > 0) {
      haptics.warning();
      setErrors(newErrors);
      return;
    }

    haptics.success();
    onSubmit({
      name: cleanName,
      apellidos: cleanApellidos,
      cedula: cedulaCheck.formatted || cedula.trim(),
      phone: phone.trim(),
      birthDate: sanitizeText(birthDate, 20),
      emergencyContact: emergencyContact.trim(),
      emergencyContactName: sanitizeText(emergencyContactName, 80),
      emergencyContactRelation,
      emergencyContactKnowsLesco,
      phoneVerified,
    });
  };

  return (
    <View>
      {/* Fila 1: Nombre y Apellidos */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            placeholder="Ej: Pamela"
            placeholderTextColor="#C4B8A6"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
            maxLength={60}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        <View style={styles.halfField}>
          <Text style={styles.label}>Apellidos</Text>
          <TextInput
            style={[styles.input, focusedField === 'apellidos' && styles.inputFocused]}
            placeholder="Ej: Leiva"
            placeholderTextColor="#C4B8A6"
            value={apellidos}
            onChangeText={(t) => {
              setApellidos(t);
              if (errors.apellidos) setErrors((prev) => ({ ...prev, apellidos: undefined }));
            }}
            onFocus={() => setFocusedField('apellidos')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
            maxLength={80}
          />
          {errors.apellidos ? <Text style={styles.errorText}>{errors.apellidos}</Text> : null}
        </View>
      </View>

      {/* Campo 2: Cédula de identidad */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Cédula de identidad</Text>
        <TextInput
          style={[styles.input, focusedField === 'cedula' && styles.inputFocused]}
          placeholder="Ej: 1-1234-5678"
          placeholderTextColor="#C4B8A6"
          value={cedula}
          onChangeText={handleCedulaChange}
          onFocus={() => setFocusedField('cedula')}
          onBlur={() => setFocusedField(null)}
          keyboardType="numeric"
          maxLength={11}
        />
        {errors.cedula ? <Text style={styles.errorText}>{errors.cedula}</Text> : null}
      </View>

      {/* Campo 3: Teléfono con Verificación Automática SMS */}
      <View style={styles.fieldGroup}>
        <View style={localStyles.labelWithBadgeRow}>
          <Text style={[styles.label, { marginBottom: 0 }]}>Teléfono móvil (SMS)</Text>
          {phoneVerified ? (
            <View style={localStyles.verifiedPill}>
              <Text style={localStyles.verifiedPillText}>✓ Verificado por SMS</Text>
            </View>
          ) : (
            <Text style={localStyles.smsHelperTag}>✨ Autocompletado de código</Text>
          )}
        </View>

        <View
          style={[
            styles.inputWithIcon,
            focusedField === 'phone' && styles.inputFocused,
            phoneVerified && localStyles.inputVerifiedBorder,
          ]}
        >
          <Text style={localStyles.countryPrefix}>🇨🇷 +506</Text>
          <TextInput
            style={styles.textInputInside}
            placeholder="Ej: 8673-4457"
            placeholderTextColor="#C4B8A6"
            value={phone}
            onChangeText={handlePhoneChange}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={16}
          />

          {hasCompletePhone && !phoneVerified && onRequestPhoneOtp ? (
            <TouchableOpacity
              style={localStyles.verifyNowChip}
              onPress={() => {
                haptics.light();
                onRequestPhoneOtp(phone, name.trim(), () => {
                  setPhoneVerified(true);
                });
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Verificar teléfono por código SMS ahora"
            >
              <Text style={localStyles.verifyNowChipText}>📲 Verificar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
      </View>

      {/* Campo 4: Fecha de nacimiento con Selector Desplegable */}
      <View style={styles.fieldGroup}>
        <View style={localStyles.labelWithBadgeRow}>
          <Text style={[styles.label, { marginBottom: 0 }]}>Fecha de nacimiento</Text>
          <TouchableOpacity
            style={localStyles.lescoFieldChip}
            onPress={() => {
              haptics.light();
              setActiveVideo({
                r2Key: 'lesco/v1/m1/1_3.mp4',
                title: 'Selector de Fecha de Nacimiento',
                category: 'Registro y Configuración',
                glossText: 'TOCAR FECHA NACIMIENTO / ELEGIR AÑO / ELEGIR MES / GUARDAR FECHA',
              });
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Ver en señas LESCO cómo elegir la fecha de nacimiento"
          >
            <Text style={{ fontSize: 11 }}>📹</Text>
            <Text style={localStyles.lescoFieldChipText}>Ver en señas</Text>
          </TouchableOpacity>
        </View>
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

      {/* Sección 5: Tarjeta de Contacto de Emergencia / SOS */}
      <View style={styles.sosSection}>
        <View style={styles.sosHeaderRow}>
          <View style={styles.sosHeaderLeft}>
            <Text style={{ fontSize: 16 }}>🚨</Text>
            <Text style={styles.sosHeaderTitle}>Contacto SOS</Text>
          </View>

          <View style={localStyles.sosHeaderActionsRow}>
            <TouchableOpacity
              style={localStyles.lescoFieldChip}
              onPress={() => {
                haptics.light();
                setActiveVideo({
                  r2Key: 'lesco/v1/m1/1_4.mp4',
                  title: 'Selector de Contacto de Emergencia SOS',
                  category: 'Registro y Configuración',
                  glossText:
                    'TARJETA EMERGENCIA / TOCAR MIS CONTACTOS / ELEGIR PARENTESCO / MARCAR SABE LESCO',
                });
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Ver en señas LESCO cómo configurar el contacto SOS"
            >
              <Text style={{ fontSize: 11 }}>📹</Text>
              <Text style={localStyles.lescoFieldChipText}>Señas</Text>
            </TouchableOpacity>

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
            maxLength={80}
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
                  <Text
                    style={[
                      styles.relationChipText,
                      isActive && styles.relationChipTextActive,
                    ]}
                  >
                    {rel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Checkbox Interactivo: Texto a la izquierda y casilla [✓] a la derecha */}
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
          <View
            style={[
              styles.checkbox,
              emergencyContactKnowsLesco && styles.checkboxActive,
            ]}
          >
            {emergencyContactKnowsLesco ? (
              <Text style={styles.checkIcon}>✓</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      {/* Botón de envío */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <Text style={styles.submitButtonText}>
          {isLoading
            ? 'Guardando...'
            : hasCompletePhone && !phoneVerified
              ? '📲 Verificar SMS y Crear cuenta'
              : 'Crear cuenta'}
        </Text>
      </TouchableOpacity>

      {/* Modal Desplegable del Calendario */}
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

      {/* Modal de Video LESCO (1_3 Fecha de nacimiento y 1_4 Contacto SOS) */}
      {activeVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      ) : null}
    </View>
  );
}

const localStyles = StyleSheet.create({
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sosHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lescoFieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EADA',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  lescoFieldChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B5551A',
  },
  smsHelperTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C7A5C',
  },
  verifiedPill: {
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#5C7A5C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5C7A5C',
  },
  inputVerifiedBorder: {
    borderColor: '#5C7A5C',
    backgroundColor: '#F7FAF7',
  },
  countryPrefix: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A6E5C',
    marginRight: 8,
  },
  verifyNowChip: {
    backgroundColor: '#F3EADA',
    borderWidth: 1,
    borderColor: '#B5551A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 6,
  },
  verifyNowChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B5551A',
  },
});
