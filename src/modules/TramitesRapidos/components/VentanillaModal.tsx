import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';
import { VentanillaModalProps } from '../types';

export const VentanillaModal: React.FC<VentanillaModalProps> = ({
  visible,
  text,
  categoryThemeColor = Colors.primary.main,
  onSpeak,
  onWatchLesco,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Integrado: Badge y Botón Cerrar perfectamente alineados */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.instructionBadge}>
              <Text style={[styles.instructionBadgeText, { color: categoryThemeColor }]}>
                📱 Muestra esta pantalla al funcionario
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de pantalla gigante"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Frase en Letras Gigantes de Alto Contraste */}
          <View style={styles.giantTextBox}>
            <Text style={styles.giantText}>
              "{text}"
            </Text>
          </View>

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            {/* 1. Reproducir en voz alta (TTS) */}
            <TouchableOpacity
              onPress={() => onSpeak?.(text)}
              style={[styles.primaryActionBtn, { backgroundColor: categoryThemeColor }]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Reproducir frase en voz alta"
            >
              <Text style={styles.actionEmoji}>🔊</Text>
              <Text style={styles.primaryActionText}>Reproducir en voz alta</Text>
            </TouchableOpacity>

            {/* 2. Ver en señas LESCO */}
            {onWatchLesco && (
              <TouchableOpacity
                onPress={() => onWatchLesco(text)}
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ver cómo se dice en señas LESCO"
              >
                <Text style={styles.actionEmoji}>📹</Text>
                <Text style={[styles.secondaryActionText, { color: categoryThemeColor }]}>
                  Ver cómo se dice en señas LESCO
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. Volver al asistente */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Volver al asistente"
            >
              <Text style={styles.dismissText}>Volver al asistente</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl * 1.3,
    maxWidth: 480,
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EAE0D0',
    position: 'relative',
    ...Shadows.card,
  },
  modalHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  instructionBadge: {
    backgroundColor: '#F3EADA',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  instructionBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE0D0',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7A6E5C',
  },
  giantTextBox: {
    width: '100%',
    backgroundColor: '#FBF6EE',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    marginVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giantText: {
    fontSize: 26,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    textAlign: 'center',
    lineHeight: 34,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  actionEmoji: {
    fontSize: 18,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  secondaryActionBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#F3EADA',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  secondaryActionText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  dismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: '#7A6E5C',
  },
  pressed: {
    opacity: 0.7,
  },
});
