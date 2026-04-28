/**
 * responsive.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all responsive / adaptive layout logic.
 * All values are computed once at module initialisation from Dimensions.get().
 *
 * Usage:
 *   import { isTablet, rs, SCREEN_PADDING, CONTENT_MAX_WIDTH } from '../../utils/responsive';
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

/** Raw screen dimensions */
export const SCREEN_W = W;
export const SCREEN_H = H;

/** Standard breakpoint: phones < 768px, tablets >= 768px */
export const isTablet = W >= 768;

/** Large tablets / iPad Pro */
export const isLargeTablet = W >= 1024;

// ─── Scaling helpers ──────────────────────────────────────────────────────────

/** Reference design width (iPhone 14, 390 pts) */
const BASE = 390;

/**
 * Linear scale proportional to screen width.
 * e.g. scale(20) → 20 on 390px, ≈39 on 768px.
 */
export function scale(size: number): number {
  return PixelRatio.roundToNearestPixel((W / BASE) * size);
}

/**
 * Moderate scale — dampened by `factor` (0 = no scale, 1 = full linear).
 * Default factor 0.4 is good for font sizes.
 */
export function mScale(size: number, factor = 0.4): number {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
}

/** Width as a percentage of screen width */
export const wp = (pct: number): number => (W * pct) / 100;

/** Height as a percentage of screen height */
export const hp = (pct: number): number => (H * pct) / 100;

/**
 * Responsive select — returns `tabletValue` on tablets, `phoneValue` otherwise.
 * @example rs(1, 2)          // 1 column on phone, 2 on tablet
 * @example rs(20, 36)        // 20px padding on phone, 36px on tablet
 */
export function rs<T>(phoneValue: T, tabletValue: T): T {
  return isTablet ? tabletValue : phoneValue;
}

// ─── Layout constants (derived once, reused everywhere) ───────────────────────

/** Horizontal screen / content padding */
export const SCREEN_PADDING: number = rs(20, 36);

/**
 * Maximum content width for centered layouts on wide screens.
 * `undefined` on phones (no constraint needed).
 */
export const CONTENT_MAX_WIDTH: number | undefined =
  isLargeTablet ? 860 : isTablet ? 720 : undefined;

/**
 * Convenience style object for centered max-width containers.
 * Apply to the inner content wrapper, not the FlatList/ScrollView itself.
 */
export const centeredContent = {
  width: '100%' as const,
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: 'center' as const,
};

/** Tab bar height — taller on tablets for comfortable touch targets */
export const TAB_BAR_HEIGHT: number = rs(72, 88);

/** Number of story card columns in the library FlatList */
export const STORY_COLUMNS: number = rs(1, 2);

/**
 * Max width for auth / form screens.
 * On tablet the form becomes a centred card; `undefined` on phone (full width).
 */
export const FORM_MAX_WIDTH: number | undefined = isTablet ? 500 : undefined;
