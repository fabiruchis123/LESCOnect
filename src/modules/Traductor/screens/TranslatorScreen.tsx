import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function TranslatorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Traductor LESCO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
});
