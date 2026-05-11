/**
 * responsive.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all responsive / adaptive layout logic.
 *
 * TWO layers:
 *   1. Static constants  — computed once from Dimensions.get() at module init.
 *      Safe to use inside StyleSheet.create() (no hook needed).
 *      Will NOT react to orientation changes — for truly orientation-safe
 *      values use the useResponsive() hook instead.
 *
 *   2. useResponsive()  — React hook using useWindowDimensions().
 *      Re-renders the calling component on every dimension change
 *      (orientation flip, split-screen resize, foldable fold/unfold).
 *      Use this inside any component that needs to adapt to rotation.
 *
 * Usage:
 *   // Static (StyleSheet / module level)
 *   import { isTablet, mScale, SCREEN_PADDING } from '../../utils/responsive';
 *
 *   // Reactive (inside components)
 *   import { useResponsive } from '../../utils/responsive';
 *   const { isLandscape, screenPadding, phonicsColumns } = useResponsive();
 */

import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

// ─── 1. Static Layer (module-init) ────────────────────────────────────────────

const { width: _W, height: _H } = Dimensions.get('window');

/** Raw screen dimensions at launch */
export const SCREEN_W = _W;
export const SCREEN_H = _H;

/** Standard breakpoints */
export const isTablet      = _W >= 768;
export const isLargeTablet = _W >= 1024;

// ── Scaling helpers ────────────────────────────────────────────────────────────

/** Reference design width (iPhone 14, 390 pts) */
const BASE = 390;

/**
 * Linear scale proportional to screen width.
 * e.g. scale(20) → 20 on 390px, ≈39 on 768px
 */
export function scale(size: number, w: number = _W): number {
  return PixelRatio.roundToNearestPixel((w / BASE) * size);
}

/**
 * Moderate scale — dampened by `factor` (0 = no scale, 1 = full linear).
 * Default factor 0.35 is recommended for font sizes.
 */
export function mScale(size: number, factor = 0.35, w: number = _W): number {
  return PixelRatio.roundToNearestPixel(size + (scale(size, w) - size) * factor);
}

/** Width as a percentage of screen width */
export const wp = (pct: number, w: number = _W): number => (w * pct) / 100;

/** Height as a percentage of screen height */
export const hp = (pct: number, h: number = _H): number => (h * pct) / 100;

/**
 * Responsive select — returns `tabletValue` on tablets, `phoneValue` otherwise.
 * Static version; use useResponsive().rs() for orientation-aware selection.
 */
export function rs<T>(phoneValue: T, tabletValue: T): T {
  return isTablet ? tabletValue : phoneValue;
}

// ── Static layout constants ────────────────────────────────────────────────────

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

// ─── 2. Reactive Hook Layer ───────────────────────────────────────────────────

/**
 * Compute responsive breakpoints from a given width/height pair.
 * Extracted so we can use it both inside and outside the hook.
 */
function computeLayout(width: number, height: number) {
  const tablet      = width >= 768;
  const largeTablet = width >= 1024;
  const landscape   = width > height;

  const screenPadding   = tablet ? 36 : landscape ? 24 : 20;
  const contentMaxWidth = largeTablet ? 860 : tablet ? 720 : undefined;
  const formMaxWidth    = tablet ? 560 : landscape ? 440 : undefined;
  const tabBarHeight    = tablet ? 88 : 72;

  // Adaptive column counts
  const phonicsColumns = largeTablet ? 4 : tablet ? 3 : landscape ? 3 : 2;
  const storyColumns   = tablet ? 2 : landscape ? 2 : 1;
  const statColumns    = tablet ? 4 : 2;
  const badgeColumns   = largeTablet ? 6 : tablet ? 4 : 3;

  /** Reading area max width — capped for optimal line length (65–75 chars) */
  const readingMaxWidth = tablet ? 680 : undefined;

  /** Moderately-scaled font for this screen width */
  const mScaleFont = (size: number, factor = 0.35) =>
    PixelRatio.roundToNearestPixel(size + ((width / BASE) * size - size) * factor);

  const rs = <T>(phone: T, tabletVal: T): T => (tablet ? tabletVal : phone);

  return {
    width,
    height,
    isTablet: tablet,
    isLargeTablet: largeTablet,
    isLandscape: landscape,
    isPortrait: !landscape,
    screenPadding,
    contentMaxWidth,
    formMaxWidth,
    tabBarHeight,
    phonicsColumns,
    storyColumns,
    statColumns,
    badgeColumns,
    readingMaxWidth,
    rs,
    mScaleFont,
    centeredContent: {
      width: '100%' as const,
      maxWidth: contentMaxWidth,
      alignSelf: 'center' as const,
    } as const,
  };
}

export type ResponsiveLayout = ReturnType<typeof computeLayout>;

/**
 * useResponsive()
 * React hook that returns the full responsive layout object.
 * Re-renders whenever the window dimensions change (rotation, resize, etc.)
 *
 * @example
 * const { isLandscape, screenPadding, phonicsColumns } = useResponsive();
 */
export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return computeLayout(width, height);
}
