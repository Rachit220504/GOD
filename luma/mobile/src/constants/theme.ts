// ─── LUMA App Theme System ────────────────────────────────────────────────────
// Dyslexia-first color palette. No pure black or white anywhere.

import { mScale, isTablet } from '../utils/responsive';
export * from '../utils/responsiveHelpers';
// Re-export SCREEN_PADDING for backward compatibility
export { SCREEN_PADDING } from '../utils/responsive';

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
  white: '#ffffff',
  black: '#00000000',
  shadow: 'rgba(108, 92, 231, 0.15)',
} as const;

export const FontFamily = {
  lexend: 'Lexend',
  lexendBold: 'Lexend-Bold',
  lexendSemiBold: 'Lexend-SemiBold',
  system: 'System',
  sansSerif: 'sans-serif',
  serif: 'serif',
} as const;

// ─── Static font sizes (base design at 390px) ─────────────────────────────────
// Use these inside StyleSheet.create() where hooks can't be called.
export const FontSize = {
  xs:      12,
  sm:      14,
  md:      16,
  lg:      18,
  xl:      20,
  xxl:     24,
  xxxl:    30,
  display: 38,
} as const;

// ─── Responsive font sizes (moderate-scaled for device width) ─────────────────
// These are computed once at module init using mScale (factor 0.35).
// They adapt better across iPhone SE → iPad Pro than the raw FontSize values.
// Use in StyleSheet.create() for typography that should scale with screen size.
export const RFontSize = {
  xs:      mScale(12),
  sm:      mScale(14),
  md:      mScale(16),
  lg:      mScale(18),
  xl:      mScale(20),
  xxl:     mScale(24),
  xxxl:    mScale(30),
  display: mScale(38),
} as const;

export const Spacing = {
  xs:     4,
  sm:     8,
  md:     12,
  lg:     16,
  xl:     24,
  xxl:    32,
  xxxl:   48,
  screen: 20,
} as const;

// ─── Responsive spacing (adapts to tablet) ───────────────────────────────────
// Tablet gets +25% spacing for balanced breathing room.
const _tabletMult = isTablet ? 1.25 : 1;

export const RSpacing = {
  xs:     Math.round(4  * _tabletMult),
  sm:     Math.round(8  * _tabletMult),
  md:     Math.round(12 * _tabletMult),
  lg:     Math.round(16 * _tabletMult),
  xl:     Math.round(24 * _tabletMult),
  xxl:    Math.round(32 * _tabletMult),
  xxxl:   Math.round(48 * _tabletMult),
  screen: isTablet ? 36 : 20,
} as const;

// ─── Minimum touch target size (WCAG 2.5.8 / Apple HIG) ─────────────────────
// 44×44 on phone, 48×48 on tablet.
export const MIN_TOUCH = isTablet ? 48 : 44;

export const BorderRadius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
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
  fontSize:        18,
  letterSpacing:   0.08,   // em
  lineHeight:      1.5,
  backgroundColor: Colors.cream,
  fontFamily:      FontFamily.lexend,
} as const;

export type ThemeColors  = typeof Colors;
export type ThemeSpacing = typeof Spacing;
