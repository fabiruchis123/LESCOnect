import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B5551A',
        tabBarInactiveTintColor: '#7A6E5C',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EAE0D0',
          borderTopWidth: 1,
        },
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
