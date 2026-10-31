import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores';
import { AppLoadingSplash } from '@/shared/components';
import { videoCacheService } from '@/shared/services/videoCacheService';
import { appPermissionsService } from '@/shared/services/appPermissionsService';

const queryClient = new QueryClient();
const MIN_SPLASH_DURATION_MS = 10000;

function NavigationLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinDelayPassed(true);
    }, MIN_SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  const showSplash = isLoading || !minDelayPassed;

  useEffect(() => {
    if (showSplash) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, showSplash, segments, router]);

  if (showSplash) {
    return <AppLoadingSplash />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: styles.stackContent,
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'LESCOnect — Puente de comunicación e inclusión';
    }
    // Solicitar ordenadamente permisos del sistema (Ubicación, Contactos, SMS, Cámara, Archivos)
    appPermissionsService.requestAllStartupPermissions().catch(() => {});
    // Sincronizar catálogo de Supabase y precargar en segundo plano los videos esenciales para modo offline
    videoCacheService.preloadEssentialVideos('vertical').catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationLayout />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  stackContent: {
    backgroundColor: '#FBF6EE',
  },
});
