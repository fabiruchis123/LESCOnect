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
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEmoji: {
    fontSize: 26,
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
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySignIcon: {
    fontSize: 16,
  },
  categoryArrow: {
    fontSize: 20,
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
    lineHeight: 13,
    fontWeight: Typography.weights.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lescoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
    minHeight: 36,
  },
  lescoPillText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
  },
  rompehieloQuote: {
    fontSize: 17,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  actionDualGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionShowBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionShowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
  actionSpeakBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionSpeakBtnText: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },

  // Lista de Situaciones (Vista 2)
  // Sin botón LESCO duplicado — solo ícono + texto + flecha
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: Typography.weights.black,
    color: '#7A6E5C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  situationsList: {
    gap: Spacing.sm * 1.4,
    marginBottom: Spacing.md,
  },
  situationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md * 1.3,
    paddingHorizontal: Spacing.md * 1.2,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
    minHeight: 76,
  },
  situationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  situationIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationIconEmoji: {
    fontSize: 24,
  },
  situationTextColumn: {
    flex: 1,
  },
  situationTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 20,
  },
  situationDesc: {
    fontSize: 11,
    color: '#7A6E5C',
    fontWeight: Typography.weights.medium,
    marginTop: 3,
    lineHeight: 15,
  },

  // Vista 3: Tarjeta de Frase — texto grande + pill "Ver seña" integrado arriba
  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md * 1.3,
    borderWidth: 2,
    marginBottom: Spacing.sm * 1.4,
    ...Shadows.subtle,
  },
  // Fila superior de la phraseCard: pill LESCO inline + nada más
  phraseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  phraseLescoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
    minHeight: 34,
  },
  phraseLescoInlineText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  phraseText: {
    fontSize: 18,
    fontWeight: Typography.weights.black,
    color: '#2B241C',
    lineHeight: 26,
    marginBottom: Spacing.md,
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
    gap: 10,
  },
  escapeBtn: {
    flex: 1,
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  escapeBtnEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  escapeBtnText: {
    fontSize: 12,
    fontWeight: Typography.weights.bold,
    color: '#2B241C',
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
});
