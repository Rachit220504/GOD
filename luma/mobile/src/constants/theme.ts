// ─── LUMA App Theme System ────────────────────────────────────────────────────
// Dyslexia-first color palette. No pure black or white anywhere.

export const Colors = {
  // Backgrounds
  cream: '#FDFBF7',
  softBlue: '#F0F4F8',
  softPeach: '#FFF5F0',
  lavender: '#F3F0FF',

  // Brand
  purple: '#6C5CE7',
  purpleLight: '#A78BFA',
  purpleDark: '#4C3DBF',
  orange: '#FF9F43',
  orangeLight: '#FFBE76',

  // Semantic
  success: '#00B894',
  successLight: '#A7F3D0',
  warning: '#FDCB6E',
  error: '#E17055',
  errorLight: '#FFD8CC',

  // Syllable highlight colours (for reading mode)
  syllable1: '#6C5CE7',  // purple
  syllable2: '#FF9F43',  // orange
  syllable3: '#00B894',  // green
  syllable4: '#E17055',  // red-orange

  // Text — never pure black
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  textOnDark: '#FDFBF7',

  // UI
  cardBackground: '#FFFFFF',
  border: '#DFE6E9',
  borderFocus: '#6C5CE7',
  overlay: 'rgba(45, 52, 54, 0.5)',
  white: '#FFFFFF',
  shadow: 'rgba(108, 92, 231, 0.15)',
} as const;

export const FontFamily = {
  lexend: 'Lexend',
  lexendBold: 'Lexend-Bold',
  lexendSemiBold: 'Lexend-SemiBold',
  openDyslexic: 'OpenDyslexic',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  screen: 20,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// Default reading comfort values
export const DefaultReadingComfort = {
  fontSize: 18,
  letterSpacing: 0.08,    // em
  lineHeight: 1.5,
  backgroundColor: Colors.cream,
  fontFamily: FontFamily.lexend,
} as const;

export type ThemeColors = typeof Colors;
export type ThemeSpacing = typeof Spacing;
