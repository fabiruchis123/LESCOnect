import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenWrapper,
  Badge,
  LescoVideoModal,
  type LescoVideoInfo,
} from '@/shared/components';
import { colors } from '@/shared/theme/colors';
import { haptics } from '@/shared/utils/haptics';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { SosContactsScreen } from './SosContactsScreen';
import {
  dispatchEmergencySosAlert,
  requestAllAppPermissions,
} from '../services/emergencyLocationService';
import { SosContact } from '../types/emergencias.types';
import { EmergencyCategory, EmergenciesScreenProps } from '../types/emergencias.types';


const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  {
    id: 'fuego',
    title: 'Fuego / Incendio',
    tag: 'Urgente',
    description: 'Casa, edificio, lote o vehículo en llamas / Humo denso',
    icon: '🔥',
    phrase: '¡Fuego e incendio grave! Necesito ayuda urgente en mi ubicación.',
  },
  {
    id: 'accidente',
    title: 'Accidente / Choque',
    tag: 'Tránsito',
    description: 'Choque grave, atropello o vuelco con heridos',
    icon: '🚗',
    phrase: '¡Accidente de tránsito con heridos! Envíe ambulancia y policía.',
  },
  {
    id: 'salud',
    title: 'Emergencia Médica / Salud',
    tag: 'Salud',
    description: 'Paro cardíaco, desmayo, convulsión o corte grave',
    icon: '🚑',
    phrase: '¡Emergencia médica grave! Requiero paramédicos inmediatamente.',
  },
  {
    id: 'policia',
    title: 'Seguridad / Delito',
    tag: 'Policía',
    description: 'Asalto, robo en proceso o amenaza violenta',
    icon: '👮',
    phrase: '¡Asalto y delito en proceso! Necesito presencia policial urgente.',
  },
  {
    id: 'rescate',
    title: 'Rescate / Inundación',
    tag: 'Rescate',
    description: 'Atrapado por río, deslizamiento o estructura colapsada',
    icon: '🌊',
    phrase: '¡Situación de rescate e inundación! Envíe equipo de socorro.',
  },
];

export function EmergenciesScreen({ onNavigateToSosContacts, onBackPress }: EmergenciesScreenProps) {
  const router = useRouter();
  const [selectedVideoPhrase, setSelectedVideoPhrase] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const [activeGuideVideo, setActiveGuideVideo] = useState<LescoVideoInfo | null>(null);
  const [showSosContacts, setShowSosContacts] = useState(false);
  // Estado de GPS: luz verde si está activo (predeterminado), gris si está desactivado
  const [isGpsActive, setIsGpsActive] = useState(true);

  // Solicitar permisos al cargar
  React.useEffect(() => {
    requestAllAppPermissions().then((res) => {
      setIsGpsActive(res.locationGranted);
    }).catch(() => {});
  }, []);

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
  }, [user]);

  const handleDispatchSosAlert = (category: EmergencyCategory) => {
    if (contacts.length === 0) {
      Alert.alert(
        'Sin Contactos SOS',
        'No tienes contactos registrados en tu red de auxilio. Agrega al menos un familiar o persona de confianza para enviarle la alerta con tu ubicación GPS.',
        [
          { text: 'Configurar Contactos', onPress: () => setShowSosContacts(true) },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    const contactNames = contacts.map((c) => c.name).join(', ');

    Alert.alert(
      '🚨 Alerta SOS a Red de Contactos',
      `¿Confirmas el envío de auxilio por "${category.title}" a tus contactos (${contactNames})?\n\nTu ubicación GPS satelital se adjuntará automáticamente en segundo plano.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'PEDIR AUXILIO 🚨',
          style: 'destructive',
          onPress: async () => {
            haptics.emergency();
            const res = await dispatchEmergencySosAlert(contacts, category.title, user?.name);
            if (res.success) {
              const coordsNotice = res.coords
                ? `\n\n📍 Coordenadas: ${res.coords.formattedText}`
                : '';
              const deliveryNote = res.dispatchedByServer
                ? 'El servidor transmitió automáticamente el mensaje con tus coordenadas satelitales en segundo plano.'
                : 'Se preparó el mensaje con tus coordenadas satelitales.';
              Alert.alert(
                '✅ Alerta SOS Transmitida',
                `${deliveryNote}${coordsNotice}\n\nNotificados: ${res.phoneNumbers.join(', ')}.`
              );
            } else {
              Alert.alert('Alerta SOS', res.error || 'Verifica los permisos de GPS en tu dispositivo.');
            }
          },
        },
      ]
    );
  };

  if (showSosContacts) {
    return <SosContactsScreen onBackPress={() => setShowSosContacts(false)} />;
  }

  return (
    <ScreenWrapper scrollable backgroundColor={colors.background}>
      <View style={styles.content}>
        {/* Barra Superior Limpia con Emote GPS y Luz Verde/Gris */}
        <View style={styles.topHeaderRow}>
          <Pressable
            onPress={() => (onBackPress ? onBackPress() : router.push('/(tabs)'))}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Volver a Inicio"
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>

          {/* Indicador Minimalista: Emote GPS y Luz Verde/Gris */}
          <TouchableOpacity
            style={styles.gpsLightPill}
            onPress={() => setIsGpsActive(!isGpsActive)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`GPS ${isGpsActive ? 'Activo' : 'Desactivado'}. Toca para alternar prueba de estado.`}
          >
            <Text style={styles.gpsPinEmoji}>📍</Text>
            <View
              style={[
                styles.statusLightDot,
                isGpsActive ? styles.lightDotGreen : styles.lightDotGray,
              ]}
            />
            <Text style={styles.gpsLightText}>
              {isGpsActive ? 'GPS Activo' : 'GPS Apagado'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Encabezado Módulo 4 */}
        <Text style={styles.pageTitle}>Emergencias y Red SOS</Text>
        <Text style={styles.pageSubtitle}>
          Auxilio inmediato con ubicación GPS satelital transmitida a tus contactos SOS
        </Text>

        <View style={styles.module4GuidesRow}>
          <TouchableOpacity
            style={styles.module4GuideChip}
            onPress={() => {
              haptics.light();
              setActiveGuideVideo({
                r2Key: 'lesco/v1/m4/4_1.mp4',
                title: 'Centro de Emergencias y Botón de Pánico SOS',
                category: 'Emergencias y Auxilio SOS',
                glossText:
                  'MANTENER PRESIONADO BOTÓN ROJO SOS 2 SEGUNDOS / ALERTA SILENCIOSA SMS / UBICACIÓN GPS CONTACTOS AUXILIO',
              });
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ver en señas LESCO cómo funciona el botón de pánico SOS"
          >
            <Text style={{ fontSize: 13 }}>📹</Text>
            <Text style={styles.module4GuideChipText}>Botón SOS en señas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.module4GuideChip}
            onPress={() => {
              haptics.light();
              setActiveGuideVideo({
                r2Key: 'lesco/v1/m4/4_2.mp4',
                title: 'Conexión y Despacho con el 911',
                category: 'Emergencias y Auxilio SOS',
                glossText:
                  'CONECTAR 911 / COMPARTIR CONDICIÓN PERSONA SORDA / UBICACIÓN GPS / AMBULANCIA POLICÍA BOMBEROS',
              });
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ver en señas LESCO cómo funciona la conexión y despacho con el 9-1-1"
          >
            <Text style={{ fontSize: 13 }}>📹</Text>
            <Text style={styles.module4GuideChipText}>Despacho 911 en señas</Text>
          </TouchableOpacity>
        </View>

        <Pressable
          onPress={() => {
            haptics.light();
            if (onNavigateToSosContacts) {
              onNavigateToSosContacts();
            } else {
              setShowSosContacts(true);
            }
          }}
          style={({ pressed }) => [styles.sosContactsCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Abrir red de contactos de emergencia SOS"
        >
          <View style={styles.sosContactsLeftRow}>
            <View style={styles.sosContactsIconBox}>
              <Text style={styles.sosContactsEmoji}>👥</Text>
            </View>
            <Text style={styles.sosContactsTitle}>Red de Contactos SOS</Text>
          </View>
          <View style={styles.sosContactsArrow}>
            <Text style={styles.sosContactsArrowText}>→</Text>
          </View>
        </Pressable>



        <View style={styles.categoriesList}>
          {EMERGENCY_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.catCard}>
              <View style={styles.catTopRow}>
                <View style={styles.catIconBox}>
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                </View>
                <Text style={styles.catTitle}>{cat.title}</Text>
              </View>

              <View style={styles.catButtonsGrid}>
                <Pressable
                  onPress={() => setSelectedVideoPhrase(cat.phrase)}
                  style={({ pressed }) => [styles.lescoBtn, pressed && styles.pressed]}>
                  <Text style={styles.btnEmoji}>📹</Text>
                  <Text style={styles.lescoBtnText}>Ver seña</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDispatchSosAlert(cat)}
                  style={({ pressed }) => [styles.dispatchBtn, pressed && styles.pressed]}>
                  <Text style={styles.btnEmoji}>🚨</Text>
                  <Text style={styles.dispatchBtnText}>Alerta SOS</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Modal de Demostración Video LESCO */}
      {selectedVideoPhrase ? (
        <LescoVideoModal
          visible={true}
          onClose={() => setSelectedVideoPhrase(null)}
          videoTitle={selectedVideoPhrase}
        />
      ) : null}

      {/* Modal de Guías Oficiales Módulo 4 (4.1 y 4.2) */}
      {activeGuideVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeGuideVideo}
          onClose={() => setActiveGuideVideo(null)}
        />
      ) : null}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    marginRight: 10,
  },
  backBtnText: {
    fontSize: 18,
    color: '#2B241C',
    fontWeight: '800',
  },
  backLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gpsLightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    gap: 6,
  },
  gpsPinEmoji: {
    fontSize: 14,
  },
  statusLightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lightDotGreen: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  lightDotGray: {
    backgroundColor: '#9E9280',
  },
  gpsLightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B241C',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#C0392B',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginBottom: 12,
  },
  module4GuidesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  module4GuideChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F3EADA',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  module4GuideChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B5551A',
  },
  sosContactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sosContactsLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sosContactsIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  sosContactsEmoji: {
    fontSize: 22,
  },
  sosContactsTextFlex: {
    flex: 1,
  },
  sosContactsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B241C',
  },
  sosContactsSub: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 1,
  },
  sosContactsArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sosContactsArrowText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B5551A',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7A6E5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  categoriesList: {
    gap: 14,
  },
  catCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F5B7B1',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  catIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FDEDEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#F5B7B1',
  },
  catEmoji: {
    fontSize: 26,
  },
  catTextFlex: {
    flex: 1,
  },
  catTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#C0392B',
  },
  catTagPill: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C0392B',
  },
  catDesc: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 2,
  },
  catButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  lescoBtn: {
    flex: 1,
    backgroundColor: '#F3EADA',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    minHeight: 56,
  },
  lescoBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B5551A',
    marginLeft: 6,
  },
  dispatchBtn: {
    flex: 2,
    backgroundColor: '#C0392B',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dispatchBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  btnEmoji: {
    fontSize: 16,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
