import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { useAuthStore } from '../stores/useAuthStore';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showUserBadge?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onVideoTutorialPress?: () => void;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle = 'Comunícate sin barreras',
  showUserBadge = true,
  showBackButton = false,
  onBackPress,
  onVideoTutorialPress,
  onProfilePress,
  rightAction,
}) => {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.nombre ? `¡Hola, ${user.nombre}! 👋` : '¡Hola! 👋';
  const initial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'L';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.row}>
        {showBackButton && (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          {showUserBadge && (
            <Badge
              label="LESCO Activo"
              variant="salvia"
              showDot
              style={styles.statusBadge}
            />
          )}

          <Text style={styles.titleText}>{title || displayName}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        <View style={styles.actionsRow}>
          {onVideoTutorialPress && (
            <Pressable
              onPress={onVideoTutorialPress}
              style={({ pressed }) => [styles.videoButton, pressed && styles.pressed]}>
              <Text style={styles.videoIconText}>📹</Text>
            </Pressable>
          )}

          {rightAction ? (
            rightAction
          ) : (
            <Pressable
              onPress={onProfilePress}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#2B241C',
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  statusBadge: {
    marginBottom: 4,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B241C',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    color: '#7A6E5C',
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  videoButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  videoIconText: {
    fontSize: 18,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#B5551A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F3EADA',
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
