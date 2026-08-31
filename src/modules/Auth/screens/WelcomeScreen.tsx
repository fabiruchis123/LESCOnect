import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a LESCOnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
});
