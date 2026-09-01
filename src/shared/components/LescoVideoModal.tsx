import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { AppButton } from './AppButton';

interface LescoVideoModalProps {
  visible: boolean;
  onClose: () => void;
  videoTitle?: string;
}

export const LescoVideoModal: React.FC<LescoVideoModalProps> = ({
  visible,
  onClose,
  videoTitle = 'Demostración en Señas LESCO',
}) => {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header del Modal */}
          <View style={styles.headerRow}>
            <Badge label="TUTORIAL LESCO" variant="salvia" showDot />
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.modalTitle}>{videoTitle}</Text>

          {/* Visor de Video de Demostración */}
          <View style={styles.videoBox}>
            <Text style={styles.avatarEmoji}>🤟</Text>
            <Text style={styles.videoStatusText}>
              Video de señas oficiales Costa Rica (LESCO)
            </Text>
          </View>

          <Text style={styles.modalDescription}>
            Este video de apoyo facilita la comprensión mediante un intérprete en seña nativa.
          </Text>

          <AppButton
            title="Entendido"
            variant="primary"
            size="md"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EADA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#7A6E5C',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 14,
  },
  videoBox: {
    height: 180,
    backgroundColor: '#F3EADA',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
  },
  avatarEmoji: {
    fontSize: 52,
    marginBottom: 6,
  },
  videoStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B5551A',
  },
  modalDescription: {
    fontSize: 13,
    color: '#7A6E5C',
    marginBottom: 18,
    lineHeight: 18,
  },
});
