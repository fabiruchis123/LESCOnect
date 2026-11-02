import React, { useState, useRef, useCallback } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuthStore, User, SosContactItem } from '@/shared/stores/useAuthStore';
import { LescoVideoModal, type LescoVideoInfo } from '@/shared/components';
import { haptics } from '@/shared/utils/haptics';
import { validateAndFormatCedulaCR, validateCRPhone } from '@/shared/utils/security';
import { SignupForm } from '../components/SignupForm';
import { formatCRPhone } from '../components/ContactPickerModal';
import { SmsOtpVerificationModal } from '../components/SmsOtpVerificationModal';
import { isValidCRPhone, otpService } from '../services/otpService';
import { styles } from '../styles/auth.styles';
import { AuthMode, OtpVerifyResult, SignupFormValues, SignupScreenProps } from '../types';

/**
 * Formatea dinámicamente un teléfono de 8 dígitos (XXXX-XXXX) o una cédula de 9-12 dígitos (X-XXXX-XXXX).
 */
function formatPhoneOrCedulaInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 8) {
    return formatCRPhone(digits);
  }
  return validateAndFormatCedulaCR(digits).formatted || digits;
}

export function SignupScreen({ onSuccess, initialMode = 'signup' }: SignupScreenProps) {
  const login = useAuthStore((state) => state.login);
  const existingUser = useAuthStore((state) => state.user);
  const findRegisteredUser = useAuthStore((state) => state.findRegisteredUser);
  const getLastRegisteredUser = useAuthStore((state) => state.getLastRegisteredUser);
  // Suscribirse a cambios en el directorio persistido para actualizar la tarjeta de 1 toque
  const lastRegisteredPhone = useAuthStore((state) => state.lastRegisteredPhone);
  const registeredAccounts = useAuthStore((state) => state.registeredAccounts);
  const lastRegisteredUser = React.useMemo(
    () => getLastRegisteredUser(),
    [getLastRegisteredUser, lastRegisteredPhone, registeredAccounts, existingUser]
  );

  const scrollViewRef = useRef<ScrollView>(null);

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para modo "📱 Ingresar con código SMS" (acepta teléfono de 8 dígitos o cédula)
  const [quickPhone, setQuickPhone] = useState(
    existingUser?.telefono || lastRegisteredUser?.phone || lastRegisteredUser?.telefono || ''
  );
  const [quickName, setQuickName] = useState(
    existingUser?.nombre || lastRegisteredUser?.nombre || ''
  );
  const [quickPhoneError, setQuickPhoneError] = useState<string | null>(null);

  const matchedQuickAccount = React.useMemo(
    () => (quickPhone.trim() ? findRegisteredUser(quickPhone) : null),
    [findRegisteredUser, quickPhone, registeredAccounts]
  );

  // Estado para el Modal de Verificación Automática por SMS
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpTargetPhone, setOtpTargetPhone] = useState('');
  const [otpTargetName, setOtpTargetName] = useState('');
  const pendingOtpCallbackRef = useRef<((res: OtpVerifyResult) => void) | null>(null);

  // Bloquear el botón 'Atrás' para que no regrese al video omitido
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const finalizeSessionLogin = useCallback(
    (userPayload: User, sessionToken: string) => {
      setIsLoading(true);
      login(userPayload, sessionToken);
      void otpService.syncProfileNonBlocking(userPayload);
      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    [login, onSuccess]
  );

  const buildUserFromSignup = (values: SignupFormValues, userId?: string): User => {
    const fullName = `${values.name} ${values.apellidos}`.trim();
    const priorAccount =
      findRegisteredUser(values.phone) || findRegisteredUser(values.cedula);
    const priorSos: SosContactItem[] = Array.isArray(priorAccount?.sosContacts)
      ? priorAccount.sosContacts
      : [];

    const initialSos: SosContactItem[] = [];
    if (values.emergencyContact || values.emergencyContactName) {
      initialSos.push({
        id: 'sos-1',
        name: values.emergencyContactName || 'Contacto de Emergencia',
        phone: values.emergencyContact || '',
        relation: values.emergencyContactRelation || 'Familiar',
        knowsLesco: values.emergencyContactKnowsLesco ?? false,
        receivesSms: true,
      });
    }

    // Si ya existía una cuenta con ese teléfono o cédula, preservar sus contactos SOS adicionales
    if (priorSos.length > 0) {
      for (const prev of priorSos) {
        const prevDigits = validateCRPhone(prev.phone).digits;
        const alreadyIncluded = initialSos.some(
          (c) => validateCRPhone(c.phone).digits === prevDigits
        );
        if (!alreadyIncluded && initialSos.length < 5) {
          initialSos.push(prev);
        }
      }
    }

    const primarySos = initialSos[0];

    return {
      id: userId || priorAccount?.id || Date.now().toString(),
      name: fullName,
      nombre: values.name,
      apellidos: values.apellidos,
      cedula: values.cedula,
      phone: values.phone,
      telefono: values.phone,
      fechaNacimiento: values.birthDate || priorAccount?.fechaNacimiento,
      emergencyContact:
        values.emergencyContact ||
        priorAccount?.emergencyContact ||
        primarySos?.phone ||
        '',
      contactoEmergencia:
        values.emergencyContact ||
        priorAccount?.contactoEmergencia ||
        primarySos?.phone ||
        '',
      contactoEmergenciaNombre:
        values.emergencyContactName ||
        priorAccount?.contactoEmergenciaNombre ||
        primarySos?.name ||
        '',
      contactoEmergenciaParentesco:
        values.emergencyContactRelation ||
        priorAccount?.contactoEmergenciaParentesco ||
        primarySos?.relation ||
        'Familiar',
      contactoEmergenciaSabeLesco:
        values.emergencyContactKnowsLesco ??
        priorAccount?.contactoEmergenciaSabeLesco ??
        primarySos?.knowsLesco ??
        false,
      sosContacts: initialSos,
    };
  };

  // Solicitud de OTP desde el botón "📲 Verificar" dentro de SignupForm
  const handleInlinePhoneOtpRequest = (
    phoneToVerify: string,
    userName: string,
    onVerifiedSuccess: () => void
  ) => {
    setOtpTargetPhone(phoneToVerify);
    setOtpTargetName(userName);
    pendingOtpCallbackRef.current = () => {
      onVerifiedSuccess();
    };
    setOtpModalVisible(true);
  };

  // Envío del formulario "🆕 Crear cuenta"
  const handleSignup = (values: SignupFormValues) => {
    // Si ingresó un teléfono válido y aún no lo ha verificado, abrir el modal de recepción automática SMS
    if (values.phone && isValidCRPhone(values.phone) && !values.phoneVerified) {
      setOtpTargetPhone(values.phone);
      setOtpTargetName(values.name);
      pendingOtpCallbackRef.current = (otpRes) => {
        const userObj = buildUserFromSignup(values, otpRes.supabaseUserId);
        finalizeSessionLogin(
          userObj,
          otpRes.token || 'token-lesconect-persistent'
        );
      };
      setOtpModalVisible(true);
      return;
    }

    // Si ya verificó el teléfono o no ingresó teléfono, completar registro directo
    const userObj = buildUserFromSignup(values);
    finalizeSessionLogin(userObj, 'token-lesconect-persistent');
  };

  // Reconstruye el perfil completo al completar la verificación por SMS
  const handleQuickSmsSuccess = useCallback(
    async (
      otpRes: OtpVerifyResult,
      resolvedPhone: string,
      originalInput: string,
      fallbackDisplayName: string
    ) => {
      const localMatch =
        findRegisteredUser(resolvedPhone) ||
        findRegisteredUser(originalInput) ||
        existingUser;
      const remoteOrMerged =
        (await otpService.resolveRegisteredAccount(resolvedPhone)) ||
        (originalInput !== resolvedPhone
          ? await otpService.resolveRegisteredAccount(originalInput)
          : null);

      const sourceAccount = remoteOrMerged || localMatch;

      const restoredUser: User = {
        id:
          otpRes.supabaseUserId ||
          sourceAccount?.id ||
          Date.now().toString(),
        name:
          sourceAccount?.name ||
          fallbackDisplayName ||
          'Usuario LESCOnect',
        nombre:
          sourceAccount?.nombre ||
          fallbackDisplayName ||
          'Usuario LESCOnect',
        apellidos: sourceAccount?.apellidos || '',
        cedula: sourceAccount?.cedula || '',
        phone: sourceAccount?.phone || sourceAccount?.telefono || resolvedPhone,
        telefono: sourceAccount?.telefono || sourceAccount?.phone || resolvedPhone,
        fechaNacimiento: sourceAccount?.fechaNacimiento,
        emergencyContact:
          sourceAccount?.emergencyContact ||
          sourceAccount?.contactoEmergencia ||
          sourceAccount?.sosContacts?.[0]?.phone ||
          '',
        contactoEmergencia:
          sourceAccount?.contactoEmergencia ||
          sourceAccount?.emergencyContact ||
          sourceAccount?.sosContacts?.[0]?.phone ||
          '',
        contactoEmergenciaNombre:
          sourceAccount?.contactoEmergenciaNombre ||
          sourceAccount?.sosContacts?.[0]?.name ||
          '',
        contactoEmergenciaParentesco:
          sourceAccount?.contactoEmergenciaParentesco ||
          sourceAccount?.sosContacts?.[0]?.relation ||
          'Familiar',
        contactoEmergenciaSabeLesco:
          sourceAccount?.contactoEmergenciaSabeLesco ??
          sourceAccount?.sosContacts?.[0]?.knowsLesco ??
          false,
        sosContacts: Array.isArray(sourceAccount?.sosContacts)
          ? sourceAccount.sosContacts
          : [],
      };

      finalizeSessionLogin(
        restoredUser,
        otpRes.token || 'token-lesconect-sms-verified'
      );
    },
    [existingUser, finalizeSessionLogin, findRegisteredUser]
  );

  // Re-Ingreso Rápido de 1 Toque desde la tarjeta de cuenta recordada
  const handleOneTapRelogin = (account: User) => {
    const targetPhone = account.phone || account.telefono || '';
    if (!isValidCRPhone(targetPhone)) {
      return;
    }
    setQuickPhoneError(null);
    setQuickPhone(targetPhone);
    setQuickName(account.nombre || account.name);
    haptics.light();

    setOtpTargetPhone(targetPhone);
    setOtpTargetName(account.nombre || account.name);
    pendingOtpCallbackRef.current = (otpRes) => {
      void handleQuickSmsSuccess(
        otpRes,
        targetPhone,
        account.cedula || targetPhone,
        account.name
      );
    };
    setOtpModalVisible(true);
  };

  // Envío del modo rápido "📱 Ingresar con código SMS" (por teléfono o por cédula)
  const handleStartQuickSmsLogin = () => {
    const trimmedInput = quickPhone.trim();
    const matchedAccount = findRegisteredUser(trimmedInput);
    const cedulaCheck = validateAndFormatCedulaCR(trimmedInput);

    // Si ingresó su cédula y la cuenta está registrada, resolver su teléfono asociado
    const resolvedPhone = isValidCRPhone(trimmedInput)
      ? formatCRPhone(trimmedInput)
      : matchedAccount?.phone || matchedAccount?.telefono || '';

    if (!isValidCRPhone(resolvedPhone)) {
      haptics.warning();
      if (cedulaCheck.isValid && !matchedAccount) {
        setQuickPhoneError(
          'No encontramos una cuenta con esa cédula en este dispositivo. Escribe los 8 números de tu celular (ej: 8673-4457).'
        );
      } else {
        setQuickPhoneError(
          'Escribe los 8 números de tu celular (ej: 8888-8888) o tu cédula registrada'
        );
      }
      return;
    }

    setQuickPhoneError(null);
    haptics.light();
    const cleanDisplayName =
      matchedAccount?.name ||
      quickName.trim() ||
      existingUser?.nombre ||
      'Usuario LESCOnect';

    setOtpTargetPhone(resolvedPhone);
    setOtpTargetName(matchedAccount?.nombre || cleanDisplayName);
    pendingOtpCallbackRef.current = (otpRes) => {
      void handleQuickSmsSuccess(
        otpRes,
        resolvedPhone,
        trimmedInput,
        cleanDisplayName
      );
    };
    setOtpModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 25}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Top Bar: Paso 1 de 1 + Botón LESCO */}
          <View style={styles.topBar}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {authMode === 'signup' ? 'PASO 1 DE 1' : 'ACCESO SIN CONTRASEÑA'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.lescoBtn}
              onPress={() =>
                setActiveVideo(
                  authMode === 'signup'
                    ? {
                        r2Key: 'lesco/v1/m1/1_2.mp4',
                        title: 'Cómo crear tu cuenta',
                        category: 'Registro Rápido',
                        glossText:
                          'REGISTRO / NOMBRE APELLIDOS / CÉDULA IDENTIDAD / TELÉFONO SMS AUTOMÁTICO / LISTO',
                      }
                    : {
                        r2Key: 'lesco/v1/m1/1_2.mp4',
                        title: 'Cómo entrar con código SMS',
                        category: 'Acceso Fácil',
                        glossText:
                          'ESCRIBIR CELULAR / RECIBIR SMS / APP COMPLETA CÓDIGO SOLA / ENTRAR DIRECTO',
                      }
                )
              }
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12 }}>📹</Text>
              <Text style={styles.lescoBtnText}>Ver en señas</Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Modo Dual (Deaf-UX & Zero-Friction) */}
          <View style={modeStyles.segmentedContainer}>
            <TouchableOpacity
              style={[
                modeStyles.segmentTab,
                authMode === 'signup' && modeStyles.segmentTabActive,
              ]}
              onPress={() => {
                haptics.light();
                setAuthMode('signup');
              }}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === 'signup' }}
            >
              <Text style={{ fontSize: 15 }}>🆕</Text>
              <Text
                style={[
                  modeStyles.segmentTabText,
                  authMode === 'signup' && modeStyles.segmentTabTextActive,
                ]}
              >
                Crear cuenta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modeStyles.segmentTab,
                authMode === 'sms_login' && modeStyles.segmentTabActive,
              ]}
              onPress={() => {
                haptics.light();
                setAuthMode('sms_login');
              }}
              activeOpacity={0.85}
              accessibilityRole="tab"
              accessibilityState={{ selected: authMode === 'sms_login' }}
            >
              <Text style={{ fontSize: 15 }}>📱</Text>
              <Text
                style={[
                  modeStyles.segmentTabText,
                  authMode === 'sms_login' && modeStyles.segmentTabTextActive,
                ]}
              >
                Ingresar con SMS
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'signup' ? (
            <>
              {/* Título y Subtítulo Registro */}
              <View style={styles.titleBox}>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>
                  Ingresa tus datos para personalizar tu experiencia
                </Text>
              </View>

              {/* Formulario Completo */}
              <SignupForm
                onSubmit={handleSignup}
                onRequestPhoneOtp={handleInlinePhoneOtpRequest}
                isLoading={isLoading}
              />
            </>
          ) : (
            /* Modo Acceso Rápido por SMS para personas no informáticas */
            <View>
              <View style={styles.titleBox}>
                <Text style={styles.title}>Acceso con SMS</Text>
                <Text style={styles.subtitle}>
                  Sin contraseñas complicadas. Escribe tu celular o cédula y la aplicación completará el código por ti.
                </Text>
              </View>

              {/* Tarjeta de Re-Ingreso Rápido de 1 Toque (cuando hay una cuenta registrada en el dispositivo) */}
              {lastRegisteredUser &&
              (lastRegisteredUser.phone || lastRegisteredUser.telefono) ? (
                <View style={modeStyles.oneTapCard}>
                  <View style={modeStyles.oneTapHeaderRow}>
                    <View style={modeStyles.oneTapAvatar}>
                      <Text style={modeStyles.oneTapAvatarText}>
                        {(lastRegisteredUser.name?.[0] || 'U').toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modeStyles.oneTapGreeting}>
                        👋 ¡Hola de nuevo, {lastRegisteredUser.name || lastRegisteredUser.nombre}!
                      </Text>
                      <Text style={modeStyles.oneTapMeta}>
                        Tel: {lastRegisteredUser.phone || lastRegisteredUser.telefono}
                        {lastRegisteredUser.cedula
                          ? ` • Cédula: ${lastRegisteredUser.cedula}`
                          : ''}
                      </Text>
                    </View>
                  </View>

                  {Array.isArray(lastRegisteredUser.sosContacts) &&
                  lastRegisteredUser.sosContacts.length > 0 ? (
                    <View style={modeStyles.oneTapSosBadge}>
                      <Text style={{ fontSize: 12 }}>🛡️</Text>
                      <Text style={modeStyles.oneTapSosBadgeText}>
                        {lastRegisteredUser.sosContacts.length}{' '}
                        {lastRegisteredUser.sosContacts.length === 1
                          ? 'contacto SOS guardado'
                          : 'contactos SOS guardados'}{' '}
                        en tu perfil
                      </Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={modeStyles.oneTapBtn}
                    onPress={() => handleOneTapRelogin(lastRegisteredUser)}
                    disabled={isLoading}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Enviar código SMS a mi número ${
                      lastRegisteredUser.phone || lastRegisteredUser.telefono
                    }`}
                  >
                    <Text style={{ fontSize: 16 }}>📲</Text>
                    <Text style={modeStyles.oneTapBtnText}>
                      Enviar código SMS a mi número
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Guía Visual de 3 Pasos con Íconos */}
              <View style={modeStyles.stepsCard}>
                <View style={modeStyles.stepItem}>
                  <View style={modeStyles.stepCircle}>
                    <Text style={{ fontSize: 16 }}>📱</Text>
                  </View>
                  <Text style={modeStyles.stepLabel}>1. Celular o cédula</Text>
                </View>

                <Text style={modeStyles.stepArrow}>→</Text>

                <View style={modeStyles.stepItem}>
                  <View style={modeStyles.stepCircle}>
                    <Text style={{ fontSize: 16 }}>💬</Text>
                  </View>
                  <Text style={modeStyles.stepLabel}>2. Llega SMS</Text>
                </View>

                <Text style={modeStyles.stepArrow}>→</Text>

                <View style={modeStyles.stepItem}>
                  <View style={[modeStyles.stepCircle, modeStyles.stepCircleHighlight]}>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                  </View>
                  <Text style={[modeStyles.stepLabel, { color: '#5C7A5C' }]}>
                    3. Se llena solo
                  </Text>
                </View>
              </View>

              {/* Tarjeta Principal de Ingreso por Teléfono o Cédula */}
              <View style={modeStyles.smsLoginCard}>
                <Text style={styles.label}>
                  Tu número de teléfono celular o cédula
                </Text>
                <View
                  style={[
                    modeStyles.giantPhoneInputRow,
                    Boolean(quickPhoneError) && modeStyles.giantPhoneInputError,
                    Boolean(matchedQuickAccount) && modeStyles.giantPhoneInputRecognized,
                  ]}
                >
                  <View style={modeStyles.crFlagBadge}>
                    <Text style={modeStyles.crFlagText}>
                      {quickPhone.replace(/\D/g, '').length > 8
                        ? '🪪 C.R.'
                        : '🇨🇷 +506'}
                    </Text>
                  </View>

                  <TextInput
                    style={modeStyles.giantPhoneTextInput}
                    placeholder="8888-8888 o cédula"
                    placeholderTextColor="#C4B8A6"
                    value={quickPhone}
                    onChangeText={(txt) => {
                      const formatted = formatPhoneOrCedulaInput(txt);
                      setQuickPhone(formatted);
                      if (quickPhoneError) setQuickPhoneError(null);
                    }}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={14}
                  />
                </View>
                {quickPhoneError ? (
                  <Text style={styles.errorText}>{quickPhoneError}</Text>
                ) : null}

                {matchedQuickAccount ? (
                  <View style={modeStyles.recognizedAccountBanner}>
                    <Text style={{ fontSize: 14 }}>✓</Text>
                    <Text style={modeStyles.recognizedAccountText}>
                      Cuenta reconocida: {matchedQuickAccount.name} • Tel:{' '}
                      {matchedQuickAccount.phone || matchedQuickAccount.telefono}
                      {Array.isArray(matchedQuickAccount.sosContacts) &&
                      matchedQuickAccount.sosContacts.length > 0
                        ? ` (${matchedQuickAccount.sosContacts.length} SOS)`
                        : ''}
                    </Text>
                  </View>
                ) : null}

                {/* Nombre opcional para saludo personalizado */}
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.label}>Tu nombre (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Génesis Pamela"
                    placeholderTextColor="#C4B8A6"
                    value={matchedQuickAccount?.name || quickName}
                    onChangeText={setQuickName}
                    autoCapitalize="words"
                    maxLength={60}
                  />
                </View>

                <TouchableOpacity
                  style={modeStyles.smsSubmitBtn}
                  onPress={handleStartQuickSmsLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 18 }}>📲</Text>
                  <Text style={modeStyles.smsSubmitBtnText}>
                    Recibir código automático por SMS
                  </Text>
                </TouchableOpacity>

                <View style={modeStyles.zeroFrictionNote}>
                  <Text style={{ fontSize: 15 }}>🤟</Text>
                  <Text style={modeStyles.zeroFrictionNoteText}>
                    No tienes que salir de LESCOnect ni memorizar números: cuando llegue el SMS se escribirá automáticamente.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Recepción y Autocompletado Automático de Código SMS */}
      <SmsOtpVerificationModal
        visible={otpModalVisible}
        phone={otpTargetPhone}
        userName={otpTargetName}
        onClose={() => setOtpModalVisible(false)}
        onVerified={(res) => {
          setOtpModalVisible(false);
          if (pendingOtpCallbackRef.current) {
            pendingOtpCallbackRef.current(res);
            pendingOtpCallbackRef.current = null;
          }
        }}
      />

      {/* Modal de Video LESCO explicativo */}
      {activeVideo ? (
        <LescoVideoModal
          visible={true}
          videoInfo={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const modeStyles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDE3D2',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    gap: 6,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 13,
    gap: 6,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A6E5C',
  },
  segmentTabTextActive: {
    color: '#B5551A',
    fontWeight: '900',
  },
  stepsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EADA',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleHighlight: {
    backgroundColor: '#EBF2EB',
    borderColor: '#5C7A5C',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B241C',
  },
  stepArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
  },
  smsLoginCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  giantPhoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF6EE',
    borderWidth: 2,
    borderColor: '#B5551A',
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 12,
    gap: 10,
  },
  giantPhoneInputError: {
    borderColor: '#C0392B',
    backgroundColor: '#FDEDEC',
  },
  giantPhoneInputRecognized: {
    borderColor: '#5C7A5C',
    backgroundColor: '#F7FAF7',
  },
  recognizedAccountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#5C7A5C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  recognizedAccountText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#2B4C2B',
  },
  oneTapCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5C7A5C',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  oneTapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  oneTapAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#5C7A5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTapAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  oneTapGreeting: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2B241C',
  },
  oneTapMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C7A5C',
    marginTop: 2,
  },
  oneTapSosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    alignSelf: 'flex-start',
  },
  oneTapSosBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B4C2B',
  },
  oneTapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C7A5C',
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  oneTapBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  crFlagBadge: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8DFCE',
  },
  crFlagText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B241C',
  },
  giantPhoneTextInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#2B241C',
    letterSpacing: 1,
  },
  smsSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5551A',
    minHeight: 56,
    borderRadius: 16,
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  smsSubmitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  zeroFrictionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2EB',
    borderWidth: 1,
    borderColor: '#C5DBC5',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  zeroFrictionNoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#2B241C',
    lineHeight: 17,
  },
});
