import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline' | 'flat';
  backgroundColor?: string;
  padding?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  variant = 'default',
  backgroundColor,
  padding = Spacing.xl,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && Shadow.md,
        variant === 'default' && Shadow.sm,
        variant === 'outline' && styles.outline,
        variant === 'flat' && styles.flat,
        { padding, backgroundColor: backgroundColor ?? Colors.white },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  flat: {
    backgroundColor: Colors.softBlue,
  },
});
