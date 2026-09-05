import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as Contacts from 'expo-contacts/legacy';
import { Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { haptics } from '@/shared/utils/haptics';

export interface PhoneContact {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: { number?: string; label?: string }[];
}

interface ContactPickerModalProps {
  visible: boolean;
  contacts: PhoneContact[];
  onClose: () => void;
  onSelectContact: (name: string, phone: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const formatCRPhone = (raw: string): string => {
  if (!raw) return '';
  // Eliminar cualquier caracter no numérico
  let cleaned = raw.replace(/\D/g, '');

  // Si tiene prefijo internacional 00506, quitarlo
  if (cleaned.startsWith('00506')) {
    cleaned = cleaned.slice(5);
  }
  // Si comienza con código de país 506 y tiene más de 8 dígitos (ej. 50686734457 -> 86734457)
  else if (cleaned.startsWith('506') && cleaned.length > 8) {
    cleaned = cleaned.slice(3);
  }

  // Tomar los 8 dígitos correspondientes
  const digits = cleaned.slice(0, 8);

  // Formatear como XXXX-XXXX si tiene más de 4 dígitos
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};

export const extractNameFromContact = (c: any): string => {
  if (!c) return '';
  const first = (c.firstName || '').trim();
  const middle = (c.middleName || '').trim();
  const last = (c.lastName || '').trim();
  const composed = `${first} ${middle} ${last}`.replace(/\s+/g, ' ').trim();
  if (composed.length > 0) return composed;

  if (c.name && typeof c.name === 'string' && c.name.trim().length > 0) {
    return c.name.trim();
  }
  if (c.displayName && typeof c.displayName === 'string' && c.displayName.trim().length > 0) {
    return c.displayName.trim();
  }
  if (c.nickname && typeof c.nickname === 'string' && c.nickname.trim().length > 0) {
    return c.nickname.trim();
  }
  if (c.company && typeof c.company === 'string' && c.company.trim().length > 0) {
    return c.company.trim();
  }
  return 'Contacto';
};

export const extractPhoneFromContact = (contact: PhoneContact): string => {
  if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return '';
  for (const p of contact.phoneNumbers) {
    const raw = p.number || (p as any).digits || (p as any).formattedNumber;
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
  }
  return '';
};

export function ContactPickerModal({
  visible,
  contacts,
  onClose,
  onSelectContact,
}: ContactPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((c) => {
    const fullName = extractNameFromContact(c).toLowerCase();
    const rawPhone = extractPhoneFromContact(c);
    const formattedPhone = formatCRPhone(rawPhone);
    const q = searchQuery.toLowerCase().trim();
    return (
      fullName.includes(q) ||
      rawPhone.toLowerCase().includes(q) ||
      formattedPhone.includes(q)
    );
  });

  const handleSelect = (contact: PhoneContact) => {
    haptics.success();
    const fullName = extractNameFromContact(contact);
    const rawPhone = extractPhoneFromContact(contact);
    const formattedPhone = formatCRPhone(rawPhone);
    onSelectContact(fullName, formattedPhone);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.overlay}>
        <TouchableOpacity
          style={pickerStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={pickerStyles.sheetCard}>
          {/* Manija */}
          <View style={pickerStyles.dragHandle} />

          {/* Cabecera */}
          <View style={pickerStyles.headerRow}>
            <View>
              <Text style={pickerStyles.title}>👤 Mis Contactos</Text>
              <Text style={pickerStyles.subtitle}>
                Elige de tus contactos para emergencias SOS
              </Text>
            </View>
            <TouchableOpacity
              style={pickerStyles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={pickerStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={pickerStyles.searchBox}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Buscar por nombre o número..."
              placeholderTextColor="#A09482"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Lista de Contactos */}
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={pickerStyles.listContent}
            ListEmptyComponent={
              <View style={pickerStyles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                <Text style={pickerStyles.emptyText}>
                  {contacts.length === 0
                    ? 'No se encontraron contactos en tu dispositivo.'
                    : 'No hay coincidencias con la búsqueda.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const name = extractNameFromContact(item);
              const rawPhone = extractPhoneFromContact(item);
              const displayedPhone = rawPhone ? formatCRPhone(rawPhone) : 'Sin teléfono';
              const initial = (name[0] || 'C').toUpperCase();

              return (
                <TouchableOpacity
                  style={pickerStyles.contactItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={pickerStyles.avatarCircle}>
                    <Text style={pickerStyles.avatarText}>{initial}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={pickerStyles.contactName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={pickerStyles.contactPhone} numberOfLines={1}>
                      {displayedPhone}
                    </Text>
                  </View>

                  <Text style={pickerStyles.selectArrow}>→</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 23, 18, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FBF6EE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.75,
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    ...Shadows.card,
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#D1C4B2',
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2B241C',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE3D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A6E5C',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    paddingHorizontal: Spacing.md,
    height: 46,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2B241C',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.xl * 2,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EADA',
    borderWidth: 1.5,
    borderColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '600',
  },
  selectArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 13,
    color: '#7A6E5C',
    textAlign: 'center',
    fontWeight: '500',
  },
});
