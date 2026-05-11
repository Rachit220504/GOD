/**
 * ResponsiveContainer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A container component that adapts its layout based on screen size.
 * Provides consistent responsive behavior across the app.
 */

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  StyleProp,
  ScrollView,
  ScrollViewProps,
} from 'react-native';
import { useResponsiveLayout, calculateColumns } from '../../utils/responsiveHelpers';
import { Colors } from '../../constants/theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  centered?: boolean;
  maxWidth?: boolean;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  padding?: 'none' | 'small' | 'medium' | 'large' | 'screen';
  backgroundColor?: string;
}

/**
 * ResponsiveContainer
 * 
 * A flexible container that:
 * - Adapts padding based on device size
 * - Centers content on large screens
 * - Respects max-width for readability
 * - Optionally provides scrollable behavior
 */
export function ResponsiveContainer({
  children,
  style,
  contentStyle,
  centered = true,
  maxWidth = true,
  scrollable = true,
  scrollViewProps,
  padding = 'screen',
  backgroundColor = Colors.cream,
}: ResponsiveContainerProps) {
  const { screenPadding, contentMaxWidth, spacing } = useResponsiveLayout();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'medium':
        return spacing.md;
      case 'large':
        return spacing.lg;
      case 'screen':
      default:
        return screenPadding;
    }
  };

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
  };

  const innerStyle: ViewStyle = {
    flex: 1,
    padding: getPadding(),
    ...(centered && { alignItems: 'center' }),
    ...(maxWidth && contentMaxWidth && {
      maxWidth: contentMaxWidth,
      width: '100%',
      alignSelf: 'center',
    }),
  };

  const content = (
    <View style={[innerStyle, contentStyle]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[containerStyle, style]}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {content}
    </View>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * ResponsiveGrid
 * 
 * A grid layout that automatically adjusts columns based on available width
 */
export function ResponsiveGrid({
  children,
  minItemWidth = 150,
  maxColumns,
  gap = 12,
  style,
}: ResponsiveGridProps) {
  const { width, screenPadding } = useResponsiveLayout();
  const availableWidth = width - (screenPadding * 2);
  const columns = calculateColumns(minItemWidth, availableWidth, maxColumns);
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          margin: -gap / 2,
        },
        style,
      ]}
    >
      {children.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columns}%`,
            padding: gap / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

/**
 * ResponsiveCard
 * 
 * A card component with responsive padding and width constraints
 */
export function ResponsiveCard({
  children,
  style,
  padding = 'medium',
  fullWidth = false,
}: ResponsiveCardProps) {
  const { spacing, isTablet } = useResponsiveLayout();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'medium':
        return isTablet ? spacing.lg : spacing.md;
      case 'large':
        return isTablet ? spacing.xl : spacing.lg;
      default:
        return spacing.md;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: Colors.cardBackground,
          borderRadius: 16,
          padding: getPadding(),
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'display' | 'heading' | 'subheading' | 'body' | 'caption';
  style?: StyleProp<ViewStyle>;
  color?: string;
  numberOfLines?: number;
}

/**
 * ResponsiveText
 * 
 * Text component with responsive font sizing
 */
export function ResponsiveText({
  children,
  variant = 'body',
  style,
  color = Colors.textPrimary,
  numberOfLines,
}: ResponsiveTextProps) {
  const { scaledFontSize } = useResponsiveLayout();

  const getFontSize = () => {
    switch (variant) {
      case 'display':
        return scaledFontSize(32);
      case 'heading':
        return scaledFontSize(24);
      case 'subheading':
        return scaledFontSize(20);
      case 'body':
        return scaledFontSize(16);
      case 'caption':
        return scaledFontSize(14);
      default:
        return scaledFontSize(16);
    }
  };

  const getFontWeight = (): '400' | '600' | '700' => {
    switch (variant) {
      case 'display':
      case 'heading':
        return '700';
      case 'subheading':
        return '600';
      default:
        return '400';
    }
  };

  return (
    <Text
      style={[
        {
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          color,
          lineHeight: getFontSize() * 1.5,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
