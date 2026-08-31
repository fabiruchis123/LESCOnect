import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="traductor"
        options={{
          title: 'Traductor',
        }}
      />
      <Tabs.Screen
        name="tramites"
        options={{
          title: 'Trámites',
        }}
      />
      <Tabs.Screen
        name="emergencias"
        options={{
          title: 'Emergencias',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}
