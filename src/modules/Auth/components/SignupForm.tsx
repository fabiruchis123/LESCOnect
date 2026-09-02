import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/auth.styles';
import { SignupErrors, SignupFormValues } from '../types';
import { DatePickerModal } from './DatePickerModal';

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void;
  isLoading?: boolean;
}

export function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const [name, setName] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<SignupErrors>({});

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
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    setPhone(formatted);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // Formato Contacto de Emergencia (ej. 8888-8888)
  const handleEmergencyContactChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
    }
    setEmergencyContact(formatted);
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
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      apellidos: apellidos.trim(),
      cedula: cedula.trim(),
      phone: phone.trim(),
      birthDate: birthDate.trim(),
      emergencyContact: emergencyContact.trim(),
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
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={[styles.input, focusedField === 'phone' && styles.inputFocused]}
          placeholder="8888-8888"
          placeholderTextColor="#C4B8A6"
          value={phone}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
          keyboardType="phone-pad"
          maxLength={9}
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
            onPress={() => setIsDatePickerVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Abrir calendario"
          >
            <Text style={styles.trailingIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campo 5: Contacto de emergencia con Autoformato */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Contacto de emergencia</Text>
        <TextInput
          style={[styles.input, focusedField === 'emergency' && styles.inputFocused]}
          placeholder="8888-8888"
          placeholderTextColor="#C4B8A6"
          value={emergencyContact}
          onChangeText={handleEmergencyContactChange}
          onFocus={() => setFocusedField('emergency')}
          onBlur={() => setFocusedField(null)}
          keyboardType="phone-pad"
          maxLength={9}
        />
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
    </View>
  );
}
