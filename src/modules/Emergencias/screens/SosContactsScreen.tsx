import React, { useState } from 'react';
import {
  Alert,
  Linking,
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
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { formatCRPhone } from '@/modules/Auth/components/ContactPickerModal';
import { SosContact, SosContactsScreenProps } from '../types/emergencias.types';

export function SosContactsScreen({ onBackPress }: SosContactsScreenProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Contactos SOS 100% reales derivados del perfil del usuario
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

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);

  // Campos del formulario
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [knowsLesco, setKnowsLesco] = useState(false);
  const [receivesSms, setReceivesSms] = useState(true);

  const handleBack = () => {
    haptics.light();
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleCall = (phone: string) => {
    haptics.medium();
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Discado', `Llamando a: ${phone}`);
    });
  };

  const handleSms = (phone: string) => {
    haptics.medium();
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(
      '🚨 ALERTA SOS LESCOnect: Soy una persona no oyente y necesito auxilio urgente. Mi GPS está activo.'
    );
    Linking.openURL(`sms:${cleanPhone}?body=${message}`).catch(() => {
      Alert.alert('SMS SOS', `Enviando alerta por SMS a: ${phone}`);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (contacts.length <= 1) {
      Alert.alert(
        'Aviso de Seguridad',
        'Debes conservar al menos 1 contacto de emergencia SOS registrado.'
      );
      return;
    }

    Alert.alert(
      'Eliminar Contacto',
      `¿Deseas eliminar a "${name}" de tu red SOS?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            haptics.light();
            const updated = contacts.filter((c) => c.id !== id);
            updateUser({ sosContacts: updated });
          },
        },
      ]
    );
  };

  const handleSaveContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Campos Requeridos', 'Por favor ingresa el nombre y teléfono del contacto.');
      return;
    }

    if (contacts.length >= 5) {
      Alert.alert('Límite Alcanzado', 'El límite máximo es de 5 contactos SOS.');
      return;
    }

    haptics.success();
    const formattedPhone = formatCRPhone(newPhone);
    const newContact: SosContact = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: formattedPhone,
      relation: newRelation.trim() || 'Contacto SOS',
      knowsLesco,
      receivesSms,
    };

    const updated = [...contacts, newContact];
    updateUser({ sosContacts: updated });

    // Limpiar formulario
    setNewName('');
    setNewPhone('');
    setNewRelation('');
    setKnowsLesco(false);
    setReceivesSms(true);
    setIsFormVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Barra de Navegación Superior */}
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.backBtnLabel}>Volver a Emergencias</Text>

          {/* Botón de Video LESCO explicativo */}
          <TouchableOpacity
            style={styles.lescoHelpBtn}
            onPress={() =>
              setActiveVideo({
                title: 'Contactos de Emergencia SOS',
                category: 'Red de Auxilio en Señas',
                glossText: 'CONTACTO FAMILIAR AMIGO / EMERGENCIAS SOS / LLAMAR MENSAJE AYUDA RÁPIDO',
              })
            }
            activeOpacity={0.8}
            accessibilityLabel="Ver explicación de contactos SOS en señas LESCO"
          >
            <Text style={{ fontSize: 13, marginRight: 4 }}>📹</Text>
            <Text style={styles.lescoHelpBtnText}>Ver en señas</Text>
          </TouchableOpacity>
        </View>

        {/* Header Principal */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Red de Auxilio</Text>
          </View>
        </View>
        <Text style={styles.title}>Contactos SOS</Text>
        <Text style={styles.subtitle}>Mínimo 1 y máximo 5 contactos de auxilio rápido</Text>

        {/* Tarjeta Principal de Contactos */}
        <View style={styles.card}>
          {/* Header de la Tarjeta con Contador y Botón + Agregar */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.countTitle}>{contacts.length} de 5 contactos registrados</Text>
              <Text style={styles.countSub}>Toca llamar o enviar SMS para auxilio inmediato</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.addBtn,
                contacts.length >= 5 && styles.addBtnDisabled,
              ]}
              onPress={() => {
                if (contacts.length >= 5) {
                  Alert.alert('Límite alcanzado', 'Ya tienes el máximo de 5 contactos SOS.');
                  return;
                }
                haptics.light();
                setIsFormVisible(!isFormVisible);
              }}
              activeOpacity={0.8}
              disabled={contacts.length >= 5}
            >
              <Text style={styles.addBtnIcon}>+</Text>
              <Text style={styles.addBtnText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario Desplegable para Agregar Contacto */}
          {isFormVisible && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Nuevo Contacto de Emergencia</Text>

              <TextInput
                style={styles.input}
                placeholder="Nombre completo (Ej: Mamá / Dra. Salas)"
                placeholderTextColor="#7A6E5C"
                value={newName}
                onChangeText={setNewName}
              />

              <TextInput
                style={styles.input}
                placeholder="Número de teléfono (Ej: 8888-8888)"
                placeholderTextColor="#7A6E5C"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <TextInput
                style={styles.input}
                placeholder="Parentesco / Rol (Ej: Familiar / Intérprete / Amigo)"
                placeholderTextColor="#7A6E5C"
                value={newRelation}
                onChangeText={setNewRelation}
              />

              {/* Ajustes Clave para Personas No Oyentes */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.switchLabel}>🤟 Sabe señas LESCO o es intérprete</Text>
                  <Text style={styles.switchSub}>Te facilitará comunicación por videollamada</Text>
                </View>
                <Switch
                  value={knowsLesco}
                  onValueChange={setKnowsLesco}
                  trackColor={{ false: '#EAE0D0', true: Colors.secondary.border }}
                  thumbColor={knowsLesco ? Colors.secondary.main : '#FFFFFF'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.switchLabel}>💬 Recibe alertas por SMS</Text>
                  <Text style={styles.switchSub}>Se le enviará mensaje con tu ubicación GPS</Text>
                </View>
                <Switch
                  value={receivesSms}
                  onValueChange={setReceivesSms}
                  trackColor={{ false: '#EAE0D0', true: Colors.primary.border }}
                  thumbColor={receivesSms ? Colors.primary.main : '#FFFFFF'}
                />
              </View>

              {/* Botones de Guardar / Cancelar */}
              <View style={styles.formButtonsRow}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveContact}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>Guardar contacto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsFormVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lista Dinámica de Contactos */}
          <View style={styles.contactsList}>
            {contacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📇</Text>
                <Text style={styles.emptyTitle}>Sin contactos SOS registrados</Text>
                <Text style={styles.emptySub}>
                  Toca el botón "+ Agregar" arriba para registrar un contacto de auxilio rápido para emergencias.
                </Text>
              </View>
            ) : (
              contacts.map((contact, index) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactLeft}>
                    {/* Número indexado */}
                    <View style={styles.indexCircle}>
                      <Text style={styles.indexCircleText}>{index + 1}</Text>
                    </View>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>
                      {contact.phone} •{' '}
                      <Text style={styles.contactRelation}>{contact.relation}</Text>
                    </Text>

                    {/* Chips de Accesibilidad */}
                    <View style={styles.chipsRow}>
                      {contact.knowsLesco && (
                        <View style={styles.lescoChip}>
                          <Text style={styles.lescoChipText}>🤟 LESCO</Text>
                        </View>
                      )}
                      {contact.receivesSms && (
                        <View style={styles.smsChip}>
                          <Text style={styles.smsChipText}>💬 SMS</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Acciones de Llamada, Mensaje (SMS) y Borrar */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(contact.phone)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Llamar a ${contact.name}`}
                  >
                    <Text style={styles.callBtnIcon}>📞</Text>
                    <Text style={styles.callBtnText}>Llamar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.smsActionBtn}
                    onPress={() => handleSms(contact.phone)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Enviar mensaje a ${contact.name}`}
                  >
                    <Text style={styles.smsActionBtnIcon}>💬</Text>
                  </TouchableOpacity>

                  {contacts.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(contact.id, contact.name)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Eliminar ${contact.name}`}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )))}
          </View>
        </View>
      </ScrollView>

      {/* Modal Video LESCO */}
      {activeVideo && (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
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
    flex: 1,
  },
  lescoHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  lescoHelpBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    color: '#C0392B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl * 1.2,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    ...Shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D0',
    marginBottom: Spacing.md,
  },
  countTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
  },
  countSub: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B5551A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
    ...Shadows.subtle,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  formContainer: {
    backgroundColor: '#FBF6EE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: Typography.weights.medium,
    color: '#2B241C',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },
  switchSub: {
    fontSize: 10,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 6,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#B5551A',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#7A6E5C',
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  contactsList: {
    gap: Spacing.sm * 1.2,
  },
  contactItem: {
    backgroundColor: '#FBF6EE',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  indexCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleText: {
    fontSize: 13,
    fontWeight: Typography.weights.black,
    color: '#B5551A',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
  },
  contactPhone: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 1,
  },
  contactRelation: {
    color: '#B5551A',
    fontWeight: Typography.weights.bold,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  lescoChip: {
    backgroundColor: '#EBF2EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  lescoChipText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: '#5C7A5C',
  },
  smsChip: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  smsChipText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: '#B5551A',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0392B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    gap: 4,
  },
  callBtnIcon: {
    fontSize: 12,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  smsActionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsActionBtnIcon: {
    fontSize: 14,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#C0392B',
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#FBF6EE',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#7A6E5C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
});
