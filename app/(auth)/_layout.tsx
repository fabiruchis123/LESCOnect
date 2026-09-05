import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FBF6EE' },
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          animation: 'none',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
