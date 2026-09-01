import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { LescoVideoModal, type LescoVideoInfo } from '@/modules/Home';
import { SignupForm } from '../components/SignupForm';
import { styles } from '../styles/auth.styles';
import { SignupFormValues, SignupScreenProps } from '../types';

export function SignupScreen({ onSuccess }: SignupScreenProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [activeVideo, setActiveVideo] = useState<LescoVideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (values: SignupFormValues) => {
    setIsLoading(true);
    const fullName = `${values.name} ${values.apellidos}`.trim();

    setTimeout(() => {
      login(
        {
          id: Date.now().toString(),
          name: fullName,
          cedula: values.cedula,
          phone: values.phone,
        },
        'token-lesconect-persistent'
      );
      setIsLoading(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace('/(tabs)');
      }
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar: Paso 1 de 1 + Botón LESCO */}
          <View style={styles.topBar}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>PASO 1 DE 1</Text>
            </View>

            <TouchableOpacity
              style={styles.lescoBtn}
              onPress={() =>
                setActiveVideo({
                  title: 'Cómo crear tu cuenta',
                  category: 'Registro Rápido',
                  glossText: 'REGISTRO / NOMBRE APELLIDOS / CÉDULA IDENTIDAD / CONTACTO EMERGENCIA / LISTO',
                })
              }
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12 }}>📹</Text>
              <Text style={styles.lescoBtnText}>Ver en señas</Text>
            </TouchableOpacity>
          </View>

          {/* Título y Subtítulo idénticos al prototipo */}
          <View style={styles.titleBox}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>
              Ingresa tus datos para personalizar tu experiencia
            </Text>
          </View>

          {/* Formulario */}
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
        </ScrollView>
      </KeyboardAvoidingView>

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
