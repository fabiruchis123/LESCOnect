import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B5551A',
        tabBarInactiveTintColor: '#7A6E5C',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.tabIcon, { color }]}>{focused ? '🏠' : '🏚️'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="traductor"
        options={{
          title: 'Traductor',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🤟</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="tramites"
        options={{
          title: 'Trámites',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="emergencias"
        options={{
          title: 'Emergencias',
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>🚨</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
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
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#EAE0D0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#2B241C',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 20,
  },
});
