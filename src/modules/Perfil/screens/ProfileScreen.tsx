import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  const initial = (user?.name?.[0] || 'P').toUpperCase();

  return (
    <SafeAreaView style={profileStyles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF6EE" />
      <View style={profileStyles.container}>
        {/* Header */}
        <View style={profileStyles.headerRow}>
          <Text style={profileStyles.headerTitle}>Mi Perfil</Text>
          <View style={profileStyles.badge}>
            <Text style={profileStyles.badgeText}>🤟 Cuenta Activa</Text>
          </View>
        </View>

        {/* Tarjeta de Usuario */}
        <View style={profileStyles.userCard}>
          <View style={profileStyles.avatarCircle}>
            <Text style={profileStyles.avatarText}>{initial}</Text>
          </View>

          <Text style={profileStyles.userName}>{user?.name || 'Génesis Pamela'}</Text>
          <Text style={profileStyles.userRole}>Persona Sorda &bull; LESCO Nativo</Text>

          <View style={profileStyles.infoBox}>
            <View style={profileStyles.infoRow}>
              <Text style={profileStyles.infoLabel}>🪪 Cédula:</Text>
              <Text style={profileStyles.infoValue}>{user?.cedula || '5-0454-0188'}</Text>
            </View>
            <View style={profileStyles.infoRow}>
              <Text style={profileStyles.infoLabel}>📱 Teléfono:</Text>
              <Text style={profileStyles.infoValue}>{user?.phone || user?.telefono || 'Sin registrar'}</Text>
            </View>
            <View style={profileStyles.infoRow}>
              <Text style={profileStyles.infoLabel}>🔒 Sesión:</Text>
              <Text style={[profileStyles.infoValue, { color: Colors.secondary.main }]}>
                Guardada en este celular
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de Cerrar Sesión / Probar Registro */}
        <TouchableOpacity
          style={profileStyles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={profileStyles.logoutEmoji}>🚪</Text>
          <Text style={profileStyles.logoutButtonText}>Cerrar Sesión / Probar Registro</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.black,
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.secondary.surface,
    borderColor: Colors.secondary.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.secondary.main,
  },
  userCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.primaryGlow,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: Typography.weights.black,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.black,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  userRole: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.bold,
  },
  infoValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.error,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  logoutEmoji: {
    fontSize: 18,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
