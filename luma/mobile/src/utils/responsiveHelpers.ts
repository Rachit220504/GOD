/**
 * responsiveHelpers.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Advanced responsive layout helpers for LUMA app.
 * 
 * Provides:
 * - Orientation-aware responsive values
 * - Tablet-optimized layout calculations
 * - Safe area handling
 * - Dynamic grid calculations
 * - Aspect ratio utilities
 */

import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Design reference dimensions (iPhone 14) */
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

/** Breakpoints for different device categories */
export const BREAKPOINTS = {
  phone: 0,
  phoneLarge: 414,
  tablet: 768,
  tabletLarge: 1024,
  desktop: 1366,
} as const;

/** Aspect ratio thresholds */
const ASPECT_RATIOS = {
  veryTall: 2.2,      // Very tall phones (iPhone X+, modern Android)
  tall: 1.9,          // Tall phones
  standard: 1.6,      // Standard phones
  wide: 1.3,          // Wide phones/tablets in portrait
  veryWide: 1.0,      // Tablets, landscape
} as const;

// ─── Static Utilities ─────────────────────────────────────────────────────────

/**
 * Linear scale based on width ratio to design width
 */
export const scale = (size: number, width: number = Dimensions.get('window').width): number => {
  const ratio = width / DESIGN_WIDTH;
  return PixelRatio.roundToNearestPixel(size * ratio);
};

/**
 * Vertical scale based on height ratio
 */
export const vScale = (size: number, height: number = Dimensions.get('window').height): number => {
  const ratio = height / DESIGN_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * ratio);
};

/**
 * Moderate scale - dampened scaling for fonts
 * factor: 0 = no scaling, 1 = full linear scaling
 */
export const mScale = (
  size: number,
  factor = 0.35,
  width: number = Dimensions.get('window').width
): number => {
  const scaled = scale(size, width);
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
};

/**
 * Percentage of width
 */
export const wp = (percentage: number, width: number = Dimensions.get('window').width): number => {
  return (width * percentage) / 100;
};

/**
 * Percentage of height
 */
export const hp = (percentage: number, height: number = Dimensions.get('window').height): number => {
  return (height * percentage) / 100;
};

// ─── Device Detection ─────────────────────────────────────────────────────────

/**
 * Get device category from width
 */
export const getDeviceCategory = (width: number): keyof typeof BREAKPOINTS => {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tabletLarge) return 'tabletLarge';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.phoneLarge) return 'phoneLarge';
  return 'phone';
};

/**
 * Check if device is a tablet
 */
export const isTabletDevice = (width: number): boolean => width >= BREAKPOINTS.tablet;

/**
 * Check if device is a large tablet
 */
export const isLargeTabletDevice = (width: number): boolean => width >= BREAKPOINTS.tabletLarge;

/**
 * Get aspect ratio category
 */
export const getAspectRatioCategory = (width: number, height: number): string => {
  const ratio = Math.max(width, height) / Math.min(width, height);
  
  if (ratio >= ASPECT_RATIOS.veryTall) return 'veryTall';
  if (ratio >= ASPECT_RATIOS.tall) return 'tall';
  if (ratio >= ASPECT_RATIOS.standard) return 'standard';
  if (ratio >= ASPECT_RATIOS.wide) return 'wide';
  return 'veryWide';
};

/**
 * Check if orientation is landscape
 */
export const isLandscapeOrientation = (width: number, height: number): boolean => {
  return width > height;
};

// ─── Responsive Value Selectors ─────────────────────────────────────────────

/**
 * Select value based on device category
 */
export function rs<T>(options: {
  phone: T;
  phoneLarge?: T;
  tablet?: T;
  tabletLarge?: T;
  desktop?: T;
}, width: number = Dimensions.get('window').width): T {
  const category = getDeviceCategory(width);
  
  switch (category) {
    case 'desktop':
      return options.desktop ?? options.tabletLarge ?? options.tablet ?? options.phoneLarge ?? options.phone;
    case 'tabletLarge':
      return options.tabletLarge ?? options.tablet ?? options.phoneLarge ?? options.phone;
    case 'tablet':
      return options.tablet ?? options.phoneLarge ?? options.phone;
    case 'phoneLarge':
      return options.phoneLarge ?? options.phone;
    default:
      return options.phone;
  }
}

/**
 * Select value based on orientation
 */
export function ors<T>(portrait: T, landscape: T, width: number, height: number): T {
  return isLandscapeOrientation(width, height) ? landscape : portrait;
}

// ─── Layout Calculations ─────────────────────────────────────────────────────

/**
 * Calculate optimal number of columns for grid layouts
 */
export const calculateColumns = (
  minItemWidth: number,
  containerWidth: number,
  maxColumns?: number
): number => {
  const cols = Math.floor(containerWidth / minItemWidth);
  return maxColumns ? Math.min(cols, maxColumns) : Math.max(1, cols);
};

/**
 * Calculate content max width for optimal readability
 * Based on research: 60-75 characters per line is optimal
 */
export const getOptimalContentWidth = (
  fontSize: number,
  width: number = Dimensions.get('window').width
): number => {
  const avgCharWidth = fontSize * 0.5; // Approximate average character width
  const optimalChars = 70; // Target characters per line
  const optimalWidth = optimalChars * avgCharWidth;
  
  // Cap at screen width minus padding
  const maxAvailable = width * 0.9;
  return Math.min(optimalWidth, maxAvailable);
};

/**
 * Get responsive screen padding based on device
 */
export const getScreenPadding = (width: number): number => {
  return rs({
    phone: 16,
    phoneLarge: 20,
    tablet: 32,
    tabletLarge: 48,
  }, width);
};

/**
 * Get responsive card padding
 */
export const getCardPadding = (width: number): number => {
  return rs({
    phone: 16,
    phoneLarge: 20,
    tablet: 24,
    tabletLarge: 32,
  }, width);
};

// ─── Hook: useResponsiveLayout ────────────────────────────────────────────────

/**
 * Comprehensive responsive layout hook
 * Returns all responsive metrics for the current window dimensions
 */
export function useResponsiveLayout() {
  const { width, height, scale: pixelScale, fontScale } = useWindowDimensions();
  
  return useMemo(() => {
    const deviceCategory = getDeviceCategory(width);
    const isTablet = isTabletDevice(width);
    const isLargeTablet = isLargeTabletDevice(width);
    const isLandscape = isLandscapeOrientation(width, height);
    const aspectCategory = getAspectRatioCategory(width, height);
    
    // Screen padding
    const screenPadding = getScreenPadding(width);
    
    // Content constraints
    const contentMaxWidth = isLargeTablet ? 900 : isTablet ? 720 : undefined;
    const formMaxWidth = isTablet ? 500 : 400;
    
    // Grid columns
    const storyColumns = isTablet ? 2 : isLandscape ? 2 : 1;
    const phonicsColumns = isLargeTablet ? 4 : isTablet ? 3 : isLandscape ? 3 : 2;
    const phonicsRows = 2; // For 2x2x2 matrix: 2 rows
    const phonicsGridColumns = 2; // For 2x2x2 matrix: 2 columns
    const badgeColumns = isLargeTablet ? 6 : isTablet ? 4 : 3;
    
    // Reading mode
    const readingMaxWidth = isTablet ? 680 : isLandscape ? 600 : undefined;
    const readingPadding = isTablet ? 48 : 24;
    
    // Touch targets
    const minTouchSize = isTablet ? 48 : 44;
    
    // Typography scaling (respects OS accessibility settings)
    const scaledFontSize = (baseSize: number) => {
      const scaled = mScale(baseSize, 0.35, width);
      // Apply OS font scale (accessibility)
      return PixelRatio.roundToNearestPixel(scaled * fontScale);
    };
    
    // Spacing
    const spacing = {
      xs: isTablet ? 6 : 4,
      sm: isTablet ? 10 : 8,
      md: isTablet ? 16 : 12,
      lg: isTablet ? 24 : 16,
      xl: isTablet ? 40 : 24,
      xxl: isTablet ? 56 : 32,
    };
    
    // Tab bar
    const tabBarHeight = isTablet ? 88 : isLandscape ? 64 : 72;
    
    return {
      // Dimensions
      width,
      height,
      pixelScale,
      fontScale,
      
      // Device classification
      deviceCategory,
      isTablet,
      isLargeTablet,
      isPhone: !isTablet,
      isLandscape,
      isPortrait: !isLandscape,
      aspectCategory,
      
      // Layout values
      screenPadding,
      contentMaxWidth,
      formMaxWidth,
      readingMaxWidth,
      readingPadding,
      minTouchSize,
      tabBarHeight,
      
      // Grid
      storyColumns,
      phonicsColumns,
      phonicsRows,
      phonicsGridColumns,
      badgeColumns,
      
      // Spacing
      spacing,
      
      // Typography
      scaledFontSize,
      
      // Helpers
      rs: <T>(options: Parameters<typeof rs<T>>[0]) => rs(options, width),
      ors: <T>(portrait: T, landscape: T) => ors(portrait, landscape, width, height),
      scale: (size: number) => scale(size, width),
      vScale: (size: number) => vScale(size, height),
      mScale: (size: number, factor?: number) => mScale(size, factor, width),
      wp: (pct: number) => wp(pct, width),
      hp: (pct: number) => hp(pct, height),
      
      // Style helpers
      centeredContent: {
        width: '100%' as const,
        maxWidth: contentMaxWidth,
        alignSelf: 'center' as const,
      },
      
      // Grid helper
      calculateColumns,
    };
  }, [width, height, pixelScale, fontScale]);
}

// ─── Hook: useOrientation ───────────────────────────────────────────────────

/**
 * Simple orientation hook
 */
export function useOrientation(): {
  isLandscape: boolean;
  isPortrait: boolean;
} {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => {
    const isLandscape = width > height;
    return {
      isLandscape,
      isPortrait: !isLandscape,
    };
  }, [width, height]);
}

// ─── Export default ──────────────────────────────────────────────────────────

export default {
  scale,
  vScale,
  mScale,
  wp,
  hp,
  rs,
  ors,
  getDeviceCategory,
  isTabletDevice,
  isLargeTabletDevice,
  getAspectRatioCategory,
  isLandscapeOrientation,
  calculateColumns,
  getOptimalContentWidth,
  getScreenPadding,
  getCardPadding,
  useResponsiveLayout,
  useOrientation,
  BREAKPOINTS,
  ASPECT_RATIOS,
};
