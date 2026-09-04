import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Contacts from 'expo-contacts/legacy';
import { styles } from '../styles/auth.styles';
import { SignupErrors, SignupFormValues } from '../types';
import { DatePickerModal } from './DatePickerModal';
import { ContactPickerModal, PhoneContact, formatCRPhone } from './ContactPickerModal';
import { haptics } from '@/shared/utils/haptics';

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
  isLoading?: boolean;
}

const RELATION_OPTIONS = ['Familiar', 'Amigo', 'Médico', 'Otro'];

export function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const [name, setName] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
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

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<SignupErrors>({});

  // Abrir Libreta de Contactos Nativa Moderna
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
          Alert.alert('Libreta de Contactos', 'No se encontraron contactos en tu dispositivo.');
        }
      } else {
        Alert.alert(
          'Permiso de Contactos',
          'Permite el acceso a tus contactos en los ajustes para seleccionar de tu libreta.'
        );
      }
    } catch (error) {
      console.warn('Error al leer contactos:', error);
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

  const handleSubmit = () => {
    const newErrors: SignupErrors = {};
    if (!name.trim()) newErrors.name = 'Requerido';
    if (!apellidos.trim()) newErrors.apellidos = 'Requerido';
    if (!cedula.trim()) newErrors.cedula = 'Requerido';

    if (Object.keys(newErrors).length > 0) {
      haptics.warning();
      setErrors(newErrors);
      return;
    }

    haptics.success();
    onSubmit({
      name: name.trim(),
      apellidos: apellidos.trim(),
      cedula: cedula.trim(),
      phone: phone.trim(),
      birthDate: birthDate.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactRelation,
      emergencyContactKnowsLesco,
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

      {/* Campo 3: Teléfono */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Teléfono móvil</Text>
        <TextInput
          style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
          placeholder="Ej: 8673-4457"
          placeholderTextColor="#C4B8A6"
          value={phone}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
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

      {/* Sección 5: Tarjeta de Contacto de Emergencia / SOS */}
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
          <View style={[styles.checkbox, emergencyContactKnowsLesco && styles.checkboxActive]}>
            {emergencyContactKnowsLesco ? <Text style={styles.checkIcon}>✓</Text> : null}
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
          {isLoading ? 'Guardando...' : 'Crear cuenta'}
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
    </View>
  );
}
