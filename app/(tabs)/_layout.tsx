import { Tabs } from 'expo-router';
import { Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/shared/utils/haptics';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 14 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B5551A',
        tabBarInactiveTintColor: '#7A6E5C',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: '#EAE0D0',
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#2B241C',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{ tabPress: () => haptics.light() }}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.tabIcon, { color }]}>{focused ? '🏠' : '🏚️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="traductor"
        listeners={{ tabPress: () => haptics.light() }}
        options={{
          title: 'Traductor',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🤟</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="tramites"
        listeners={{ tabPress: () => haptics.light() }}
        options={{
          title: 'Trámites',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="emergencias"
        listeners={{ tabPress: () => haptics.light() }}
        options={{
          title: 'Emergencias',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🚨</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        listeners={{ tabPress: () => haptics.light() }}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 20,
  },
});
