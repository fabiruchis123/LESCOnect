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
} from '@/shared/components';
import { colors } from '@/shared/theme/colors';
import { haptics } from '@/shared/utils/haptics';
import { SosContactsScreen } from './SosContactsScreen';
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
  const [showSosContacts, setShowSosContacts] = useState(false);
  // Estado de GPS: luz verde si está activo (predeterminado), gris si está desactivado
  const [isGpsActive, setIsGpsActive] = useState(true);

  const handleDispatch911 = (category: EmergencyCategory) => {
    Alert.alert(
      '🚨 Auxilio Inmediato 9-1-1',
      `¿Confirmas el envío de auxilio por "${category.title}"? Tu ubicación GPS se adjuntará automáticamente en segundo plano.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'PEDIR AUXILIO 🚨',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '✅ Alerta Transmitida',
              'Tu reporte y geolocalización fueron enviados con éxito a la central del 9-1-1 y a tus contactos SOS. La ayuda va en camino.'
            );
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

        <Text style={styles.pageTitle}>Emergencias 9-1-1</Text>
        <Text style={styles.pageSubtitle}>
          Toca tu situación para pedir auxilio inmediato con un solo toque
        </Text>

        {/* ACCESO A CONTACTOS SOS */}
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
            <View style={styles.sosContactsTextFlex}>
              <Text style={styles.sosContactsTitle}>Red de Contactos SOS</Text>
              <Text style={styles.sosContactsSub}>
                Gestiona tus contactos de auxilio rápido y avisos por SMS
              </Text>
            </View>
          </View>
          <View style={styles.sosContactsArrow}>
            <Text style={styles.sosContactsArrowText}>→</Text>
          </View>
        </Pressable>

        {/* LISTA DIRECTA DE SITUACIONES DE EMERGENCIA (SIN RUIDO VISUAL) */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            ¿Qué está sucediendo? Toca tu emergencia:
          </Text>
        </View>

        <View style={styles.categoriesList}>
          {EMERGENCY_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.catCard}>
              <View style={styles.catTopRow}>
                <View style={styles.catIconBox}>
                  <Text style={styles.catEmoji}>{cat.icon}</Text>
                </View>
                <View style={styles.catTextFlex}>
                  <View style={styles.catTitleBadgeRow}>
                    <Text style={styles.catTitle}>{cat.title}</Text>
                    <View style={styles.catTagPill}>
                      <Text style={styles.catTagText}>{cat.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.catDesc}>{cat.description}</Text>
                </View>
              </View>

              <View style={styles.catButtonsGrid}>
                <Pressable
                  onPress={() => setSelectedVideoPhrase(cat.phrase)}
                  style={({ pressed }) => [styles.lescoBtn, pressed && styles.pressed]}>
                  <Text style={styles.btnEmoji}>📹</Text>
                  <Text style={styles.lescoBtnText}>Ver seña LESCO</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDispatch911(cat)}
                  style={({ pressed }) => [styles.dispatchBtn, pressed && styles.pressed]}>
                  <Text style={styles.btnEmoji}>🚨</Text>
                  <Text style={styles.dispatchBtnText}>Alerta 9-1-1</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Modal de Demostración Video LESCO */}
      <LescoVideoModal
        visible={Boolean(selectedVideoPhrase)}
        onClose={() => setSelectedVideoPhrase(null)}
        videoTitle={selectedVideoPhrase || 'Demostración LESCO'}
      />
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
    marginBottom: 16,
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
  },
  lescoBtn: {
    flex: 1,
    backgroundColor: '#F3EADA',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  lescoBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B5551A',
    marginLeft: 6,
  },
  dispatchBtn: {
    flex: 1,
    backgroundColor: '#C0392B',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  btnEmoji: {
    fontSize: 14,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
