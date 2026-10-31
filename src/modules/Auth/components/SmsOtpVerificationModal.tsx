import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { haptics } from '@/shared/utils/haptics';
import {
  extractOtpFromText,
  formatCRPhoneDisplay,
  otpService,
} from '../services/otpService';
import { OtpVerifyResult } from '../types';

export interface SmsOtpVerificationModalProps {
  visible: boolean;
  phone: string;
  userName?: string;
  onClose: () => void;
  onVerified: (result: OtpVerifyResult) => void;
}

export function SmsOtpVerificationModal({
  visible,
  phone,
  userName,
  onClose,
  onVerified,
}: SmsOtpVerificationModalProps) {
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [incomingCode, setIncomingCode] = useState<string | null>(null);
  const [isReceivingSms, setIsReceivingSms] = useState(false);
  const [autoFillCountdown, setAutoFillCountdown] = useState<number | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Animación para el banner de SMS entrante y pulso visual Deaf-UX
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastVerifiedCodeRef = useRef<string>('');
  const smsReceiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFillIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (smsReceiveTimerRef.current) {
      clearTimeout(smsReceiveTimerRef.current);
      smsReceiveTimerRef.current = null;
    }
    if (autoFillIntervalRef.current) {
      clearInterval(autoFillIntervalRef.current);
      autoFillIntervalRef.current = null;
    }
    if (verifiedDelayTimerRef.current) {
      clearTimeout(verifiedDelayTimerRef.current);
      verifiedDelayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      clearPendingTimers();
    }
    return () => {
      clearPendingTimers();
    };
  }, [visible, clearPendingTimers]);

  // Animación continua de pulso para estado de espera visual (Deaf-First)
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulseAnim]);

  // Rellenado progresivo animado de las 6 casillas para que el usuario vea cómo se completan solas
  const triggerSmoothAutoFill = useCallback((targetCode: string) => {
    if (!targetCode || targetCode.length !== 6) return;
    if (autoFillIntervalRef.current) {
      clearInterval(autoFillIntervalRef.current);
      autoFillIntervalRef.current = null;
    }
    haptics.medium();
    setIsAutoFilling(true);
    setAutoFillCountdown(null);
    setErrorMsg(null);

    let step = 1;
    autoFillIntervalRef.current = setInterval(() => {
      setCode(targetCode.slice(0, step));
      haptics.light();
      step += 1;
      if (step > 6) {
        if (autoFillIntervalRef.current) {
          clearInterval(autoFillIntervalRef.current);
          autoFillIntervalRef.current = null;
        }
        setIsAutoFilling(false);
      }
    }, 95);
  }, []);

  // Solicitar el código SMS y activar recepción asistida
  const requestOtpCode = useCallback(
    async (forceResend = false) => {
      clearPendingTimers();
      setCode('');
      setErrorMsg(null);
      setIncomingCode(null);
      setAutoFillCountdown(null);
      setIsAutoFilling(false);
      setIsVerifiedSuccess(false);
      lastVerifiedCodeRef.current = '';
      setIsReceivingSms(true);
      bannerAnim.setValue(0);

      const res = await otpService.sendSmsOtp(phone, forceResend);
      if (!res.success) {
        setIsReceivingSms(false);
        setErrorMsg(res.error || 'No se pudo enviar el código SMS.');
        haptics.warning();
        return;
      }

      setResendCooldown(res.cooldownSeconds || 30);

      // Simulación realista / detección asistida de recepción del SMS entrante (~1.8s)
      const receivedCode = res.incomingSmsCode;
      if (receivedCode) {
        smsReceiveTimerRef.current = setTimeout(() => {
          smsReceiveTimerRef.current = null;
          setIsReceivingSms(false);
          setIncomingCode(receivedCode);
          setAutoFillCountdown(2);
          haptics.success();

          Animated.spring(bannerAnim, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }, 1750);
      } else {
        setIsReceivingSms(false);
      }
    },
    [phone, bannerAnim, clearPendingTimers]
  );

  // Al abrir el modal, iniciar envío de SMS
  useEffect(() => {
    if (visible && phone) {
      requestOtpCode(false);
    }
  }, [visible, phone, requestOtpCode]);

  // Temporizador de cuenta regresiva (~1.5s) para autocompletar automáticamente sin tocar nada
  useEffect(() => {
    if (!visible || autoFillCountdown === null || !incomingCode) return;
    if (code.length > 0 || isAutoFilling || isVerifiedSuccess) {
      setAutoFillCountdown(null);
      return;
    }

    if (autoFillCountdown <= 0) {
      triggerSmoothAutoFill(incomingCode);
      return;
    }

    const timer = setTimeout(() => {
      setAutoFillCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 750);

    return () => clearTimeout(timer);
  }, [
    visible,
    autoFillCountdown,
    incomingCode,
    code.length,
    isAutoFilling,
    isVerifiedSuccess,
    triggerSmoothAutoFill,
  ]);

  // Temporizador para botón de "Reenviar código"
  useEffect(() => {
    if (!visible || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, resendCooldown]);

  // Validación instantánea sin fricción apenas se completan los 6 dígitos
  useEffect(() => {
    if (!visible || code.length !== 6 || isAutoFilling || isVerifying || isVerifiedSuccess) {
      return;
    }
    if (lastVerifiedCodeRef.current === code) {
      return;
    }

    lastVerifiedCodeRef.current = code;
    let isMounted = true;

    const runVerification = async () => {
      setIsVerifying(true);
      setErrorMsg(null);

      const verifyRes = await otpService.verifySmsOtp(phone, code);
      if (!isMounted) return;

      if (verifyRes.success) {
        setIsVerifying(false);
        setIsVerifiedSuccess(true);
        haptics.success();

        verifiedDelayTimerRef.current = setTimeout(() => {
          verifiedDelayTimerRef.current = null;
          if (isMounted) {
            onVerified(verifyRes);
          }
        }, 650);
      } else {
        setIsVerifying(false);
        setErrorMsg(verifyRes.error || 'Código incorrecto. Verifica los 6 números.');
        haptics.warning();
      }
    };

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [code, visible, isAutoFilling, isVerifying, isVerifiedSuccess, phone, onVerified]);

  const handleManualConfirm = async () => {
    if (code.length < 6 || isVerifying || isVerifiedSuccess) return;
    haptics.light();
    setIsVerifying(true);
    setErrorMsg(null);
    lastVerifiedCodeRef.current = code;

    const verifyRes = await otpService.verifySmsOtp(phone, code);
    if (verifyRes.success) {
      setIsVerifying(false);
      setIsVerifiedSuccess(true);
      haptics.success();
      setTimeout(() => {
        onVerified(verifyRes);
      }, 500);
    } else {
      setIsVerifying(false);
      setErrorMsg(verifyRes.error || 'Código incorrecto. Verifica los 6 números.');
      haptics.warning();
    }
  };

  const handleCodeChange = (rawText: string) => {
    setAutoFillCountdown(null);
    const extracted = extractOtpFromText(rawText);
    setCode(extracted);
    if (errorMsg) setErrorMsg(null);
    if (extracted.length < 6) {
      lastVerifiedCodeRef.current = '';
    }
  };

  const focusMasterInput = () => {
    haptics.light();
    inputRef.current?.focus();
  };

  const displayPhone = formatCRPhoneDisplay(phone);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={modalStyles.sheetCard}>
          {/* Manija superior */}
          <View style={modalStyles.dragHandle} />

          {/* Cabecera */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.headerBadgeRow}>
              <Text style={{ fontSize: 18 }}>📲</Text>
              <Text style={modalStyles.headerBadgeText}>VERIFICACIÓN AUTOMÁTICA SMS</Text>
            </View>

            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={() => {
                haptics.light();
                onClose();
              }}
              activeOpacity={0.75}
              accessibilityLabel="Cerrar verificación por SMS"
            >
              <Text style={modalStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.title}>
            {userName ? `¡Hola, ${userName}!` : 'Código de acceso rápido'}
          </Text>
          <Text style={modalStyles.subtitle}>
            Enviamos un código de 6 números al celular{' '}
            <Text style={modalStyles.phoneHighlight}>+506 {displayPhone}</Text>. No necesitas salir de la aplicación: se completará solo.
          </Text>

          {/* BANNER DE RECEPCIÓN AUTOMÁTICA DE SMS EN VIVO (Deaf-UX & Zero-Friction) */}
          {isReceivingSms ? (
            <Animated.View
              style={[
                modalStyles.StatusBannerWaiting,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={modalStyles.waitingIconCircle}>
                <Text style={{ fontSize: 20 }}>📡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.waitingTitle}>
                  Detectando mensaje SMS entrante...
                </Text>
                <Text style={modalStyles.waitingSub}>
                  Espera 2 segundos, la app escribirá el código por ti
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {incomingCode ? (
            <Animated.View
              style={[
                modalStyles.incomingSmsBanner,
                {
                  opacity: bannerAnim,
                  transform: [
                    {
                      translateY: bannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={modalStyles.incomingSmsTopRow}>
                <View style={modalStyles.incomingSmsLeft}>
                  <View style={modalStyles.smsAppBadge}>
                    <Text style={{ fontSize: 16 }}>💬</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.incomingSmsSender}>
                      SMS RECIBIDO • AHORA MISMO
                    </Text>
                    <Text style={modalStyles.incomingSmsBody}>
                      LESCOnect: Tu código es{' '}
                      <Text style={modalStyles.incomingSmsCodeBold}>{incomingCode}</Text>
                    </Text>
                  </View>
                </View>

                {autoFillCountdown !== null ? (
                  <View style={modalStyles.countdownPill}>
                    <Text style={modalStyles.countdownPillText}>
                      Auto en {autoFillCountdown}s
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Botón gigante de 1 toque para autocompletar de inmediato */}
              <TouchableOpacity
                style={modalStyles.autoFillGiantBtn}
                onPress={() => triggerSmoothAutoFill(incomingCode)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Autocompletar código ${incomingCode} ahora`}
              >
                <Text style={{ fontSize: 18 }}>✨</Text>
                <Text style={modalStyles.autoFillGiantBtnText}>
                  {isAutoFilling
                    ? 'Escribiendo código automáticamente...'
                    : `Autocompletar código (${incomingCode}) ahora`}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Input Maestro Oculto con Autocompletado Oficial del SO (Android sms-otp / iOS oneTimeCode) */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            importantForAutofill="yes"
            caretHidden
            style={modalStyles.hiddenMasterInput}
            accessibilityLabel="Código de verificación de 6 dígitos"
          />

          {/* 6 Casillas Visuales Grandes de Alto Contraste (52x60pt) */}
          <TouchableOpacity
            style={modalStyles.otpBoxesRow}
            onPress={focusMasterInput}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Tocar para abrir el teclado numérico"
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = code[index] || '';
              const isCurrentFocus = code.length === index && !isVerifiedSuccess;
              const isFilled = Boolean(digit);

              return (
                <View
                  key={index}
                  style={[
                    modalStyles.otpBox,
                    isCurrentFocus && modalStyles.otpBoxActive,
                    isFilled && modalStyles.otpBoxFilled,
                    isVerifiedSuccess && modalStyles.otpBoxSuccess,
                    Boolean(errorMsg) && modalStyles.otpBoxError,
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.otpDigitText,
                      isVerifiedSuccess && modalStyles.otpDigitTextSuccess,
                    ]}
                  >
                    {digit}
                  </Text>
                  {isCurrentFocus ? <View style={modalStyles.cursorBar} /> : null}
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Estado de verificación o éxito visual */}
          {isVerifiedSuccess ? (
            <View style={modalStyles.successBanner}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={modalStyles.successBannerText}>
                ¡Código verificado correctamente! Entrando a LESCOnect...
              </Text>
            </View>
          ) : isVerifying ? (
            <View style={modalStyles.verifyingBanner}>
              <Text style={{ fontSize: 18 }}>⏳</Text>
              <Text style={modalStyles.verifyingBannerText}>
                Comprobando código automáticamente...
              </Text>
            </View>
          ) : errorMsg ? (
            <View style={modalStyles.errorBanner}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={modalStyles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : (
            <Text style={modalStyles.helperHint}>
              💡 Se valida automáticamente al completar los 6 números
            </Text>
          )}

          {/* Botón Principal para Confirmar y Entrar */}
          <TouchableOpacity
            style={[
              modalStyles.confirmVerifyBtn,
              code.length < 6 && modalStyles.confirmVerifyBtnDisabled,
              isVerifiedSuccess && modalStyles.confirmVerifyBtnSuccess,
            ]}
            disabled={code.length < 6 || isVerifying || isVerifiedSuccess}
            onPress={handleManualConfirm}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirmar código y entrar a la aplicación"
          >
            <Text style={modalStyles.confirmVerifyBtnText}>
              {isVerifiedSuccess
                ? '✅ Código Verificado — Entrando...'
                : isVerifying
                ? '⏳ Validando con el Servidor...'
                : code.length === 6
                ? 'Confirmar y Entrar →'
                : `Ingresa los 6 números (${code.length}/6)`}
            </Text>
          </TouchableOpacity>

          {/* Controles Auxiliares: Teclado Manual / Limpiar / Reenviar */}
          <View style={modalStyles.footerActionsRow}>
            <TouchableOpacity
              style={modalStyles.secondaryActionBtn}
              onPress={() => {
                if (code.length > 0) {
                  haptics.light();
                  setCode('');
                  setErrorMsg(null);
                  lastVerifiedCodeRef.current = '';
                  inputRef.current?.focus();
                } else {
                  focusMasterInput();
                }
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 14 }}>{code.length > 0 ? '🧹' : '⌨️'}</Text>
              <Text style={modalStyles.secondaryActionText}>
                {code.length > 0 ? 'Borrar números' : 'Escribir con teclado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modalStyles.resendActionBtn,
                resendCooldown > 0 && modalStyles.resendActionBtnDisabled,
              ]}
              disabled={resendCooldown > 0 || isReceivingSms}
              onPress={() => {
                haptics.light();
                requestOtpCode(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 14 }}>🔄</Text>
              <Text
                style={[
                  modalStyles.resendActionText,
                  resendCooldown > 0 && modalStyles.resendActionTextDisabled,
                ]}
              >
                {resendCooldown > 0
                  ? `Reenviar (${resendCooldown}s)`
                  : 'Reenviar código'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28, 22, 16, 0.62)',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FBF6EE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
    borderTopWidth: 2,
    borderColor: '#E8DFCE',
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  dragHandle: {
    width: 46,
    height: 5,
    backgroundColor: '#D1C4B2',
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B5551A',
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDE3D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7A6E5C',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2B241C',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6E5C',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  phoneHighlight: {
    color: '#2B241C',
    fontWeight: '900',
  },
  StatusBannerWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    borderWidth: 1.5,
    borderColor: '#E6B08A',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  waitingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DFCE',
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B5551A',
    marginBottom: 2,
  },
  waitingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A6E5C',
  },
  incomingSmsBanner: {
    backgroundColor: '#EBF2EB',
    borderWidth: 2,
    borderColor: '#5C7A5C',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#5C7A5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  incomingSmsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  incomingSmsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  smsAppBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C5DBC5',
  },
  incomingSmsSender: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5C7A5C',
    letterSpacing: 0.6,
  },
  incomingSmsBody: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B241C',
    marginTop: 1,
  },
  incomingSmsCodeBold: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B5551A',
    letterSpacing: 1,
  },
  countdownPill: {
    backgroundColor: '#5C7A5C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  countdownPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  autoFillGiantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C7A5C',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  autoFillGiantBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  confirmVerifyBtn: {
    backgroundColor: '#B5551A',
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmVerifyBtnDisabled: {
    backgroundColor: '#D5C7B2',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmVerifyBtnSuccess: {
    backgroundColor: '#2E7D32',
  },
  confirmVerifyBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  hiddenMasterInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  otpBox: {
    flex: 1,
    minWidth: 48,
    maxWidth: 56,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8DFCE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#B5551A',
    backgroundColor: '#FFFDF9',
    borderWidth: 2.5,
  },
  otpBoxFilled: {
    borderColor: '#B5551A',
    backgroundColor: '#F3EADA',
  },
  otpBoxSuccess: {
    borderColor: '#5C7A5C',
    backgroundColor: '#EBF2EB',
  },
  otpBoxError: {
    borderColor: '#C0392B',
    backgroundColor: '#FDEDEC',
  },
  otpDigitText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2B241C',
  },
  otpDigitTextSuccess: {
    color: '#5C7A5C',
  },
  cursorBar: {
    position: 'absolute',
    bottom: 10,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#B5551A',
  },
  helperHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6E5C',
    textAlign: 'center',
    marginBottom: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2EB',
    borderWidth: 1.5,
    borderColor: '#5C7A5C',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B241C',
    flexShrink: 1,
  },
  verifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EADA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  verifyingBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B5551A',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderWidth: 1.5,
    borderColor: '#C0392B',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C0392B',
    flex: 1,
  },
  footerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: '#F3EADA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFCE',
    paddingHorizontal: 12,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B241C',
  },
  resendActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B5551A',
    paddingHorizontal: 12,
    gap: 6,
  },
  resendActionBtnDisabled: {
    borderColor: '#E8DFCE',
    backgroundColor: '#F6EFE4',
  },
  resendActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B5551A',
  },
  resendActionTextDisabled: {
    color: '#9C8F7E',
  },
});
