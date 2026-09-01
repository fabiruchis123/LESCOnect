import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Radius } from '@/shared/theme';

interface AuthHeaderProps {
  stepText?: string;
  showBack?: boolean;
  onPressBack?: () => void;
  onPressLescoHelp?: () => void;
}

export function AuthHeader({
  stepText = 'PASO 1 DE 1',
  showBack = false,
  onPressBack,
  onPressLescoHelp,
}: AuthHeaderProps) {
  return (
    <View style={headerStyles.topBar}>
      {showBack ? (
        <TouchableOpacity style={headerStyles.backBtn} onPress={onPressBack} activeOpacity={0.7}>
          <Text style={headerStyles.backText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={headerStyles.stepBadge}>
          <Text style={headerStyles.stepBadgeText}>{stepText}</Text>
        </View>
      )}

      <TouchableOpacity
        style={headerStyles.lescoBtn}
        onPress={onPressLescoHelp}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 12 }}>📹</Text>
        <Text style={headerStyles.lescoBtnText}>Ver en señas</Text>
      </TouchableOpacity>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: '#EDE3D2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A6E5C',
    letterSpacing: 0.8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFCE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B241C',
  },
  lescoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    borderColor: '#EAE0D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
  },
  lescoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B5551A',
  },
});
