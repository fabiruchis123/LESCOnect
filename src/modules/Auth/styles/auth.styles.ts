import { StyleSheet } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EE',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  // Top Row
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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

  // Titles
  titleBox: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2B241C',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6E5C',
    fontWeight: '500',
  },

  // Form Fields
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B241C',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    height: 50,
    fontSize: 14,
    color: '#2B241C',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#B5551A',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DFCE',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  textInputInside: {
    flex: 1,
    fontSize: 14,
    color: '#2B241C',
    fontWeight: '500',
  },
  trailingIcon: {
    fontSize: 16,
    color: '#7A6E5C',
  },
  errorText: {
    fontSize: 11,
    color: '#C0392B',
    marginTop: 4,
    fontWeight: '600',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#B5551A',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: '#B5551A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
