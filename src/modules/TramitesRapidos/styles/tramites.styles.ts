import { StyleSheet } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/shared/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.md,
  },

  // Encabezados
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EAE0D0',
    gap: 6,
    ...Shadows.subtle,
  },
  backButtonArrow: {
    fontSize: 16,
    color: '#2B241C',
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: '#7A6E5C',
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: Typography.weights.black,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.md,
  },

  // Grid de Categorías (Vista 1)
  categoriesList: {
    gap: Spacing.sm * 1.5,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md * 1.1,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEmoji: {
    fontSize: 24,
  },
  categoryTextColumn: {
    flex: 1,
  },
  categoryCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.black,
    lineHeight: 20,
  },
  categoryCardSubtitle: {
    fontSize: Typography.sizes.xs,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  categoryCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categorySignBtn: {
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  categorySignIcon: {
    fontSize: 14,
  },
  categoryArrow: {
    fontSize: 18,
    fontWeight: Typography.weights.black,
  },

  // Tarjeta Rompehielo (Presentación en Ventanilla)
  rompehieloCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  rompehieloHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rompehieloTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rompehieloTagEmoji: {
    fontSize: 16,
  },
  rompehieloTagText: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lescoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
  },
  lescoPillText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  rompehieloQuote: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  actionDualGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionShowBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionShowBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  actionSpeakBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionSpeakBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },

  // Lista de Situaciones (Vista 2)
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    color: '#7A6E5C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  situationsList: {
    gap: Spacing.sm * 1.2,
    marginBottom: Spacing.md,
  },
  situationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  situationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  situationIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationIconEmoji: {
    fontSize: 22,
  },
  situationTextColumn: {
    flex: 1,
  },
  situationTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
  },
  situationDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },

  // Vista de Frases (Vista 3)
  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md * 1.1,
    borderWidth: 2,
    marginBottom: Spacing.sm * 1.2,
    ...Shadows.subtle,
  },
  watchLescoBannerBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  watchLescoBannerText: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
  },
  phraseText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
    lineHeight: 20,
    marginBottom: Spacing.sm * 1.2,
  },

  // Escape al Traductor
  escapeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: '#EAE0D0',
    marginTop: Spacing.sm,
    ...Shadows.subtle,
  },
  escapeLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    color: '#7A6E5C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  escapeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  escapeBtn: {
    flex: 1,
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escapeBtnEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  escapeBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },

  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
