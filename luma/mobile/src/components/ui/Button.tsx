import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, BorderRadius, RFontSize, RSpacing, Shadow, MIN_TOUCH } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label:       string;
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  isLoading?:  boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  fullWidth?:  boolean;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
}

// ─── Styles per variant ───────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.purple },
    text:      { color: Colors.textOnDark },
  },
  secondary: {
    container: { backgroundColor: Colors.orange },
    text:      { color: Colors.textOnDark },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.purple },
    text:      { color: Colors.purple },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text:      { color: Colors.purple },
  },
  danger: {
    container: { backgroundColor: Colors.error },
    text:      { color: Colors.textOnDark },
  },
};

// ─── Responsive size styles ───────────────────────────────────────────────────
// minHeight respects the WCAG 2.5.8 / Apple HIG 44px minimum touch target,
// scaled up on tablets (MIN_TOUCH = 48).

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical:   RSpacing.sm,
      paddingHorizontal: RSpacing.lg,
      minHeight:         Math.max(MIN_TOUCH - 4, 40),
    },
    text: { fontSize: RFontSize.sm },
  },
  md: {
    container: {
      paddingVertical:   RSpacing.md,
      paddingHorizontal: RSpacing.xl,
      minHeight:         MIN_TOUCH,
    },
    text: { fontSize: RFontSize.md },
  },
  lg: {
    container: {
      paddingVertical:   RSpacing.lg,
      paddingHorizontal: RSpacing.xl,
      minHeight:         MIN_TOUCH + 8,
    },
    text: { fontSize: RFontSize.lg },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  label,
  variant   = 'primary',
  size      = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const vStyle     = variantStyles[variant];
  const sStyle     = sizeStyles[size];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        variant === 'primary' && Shadow.sm,
        style,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.purple : Colors.textOnDark}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, vStyle.text, sStyle.text, textStyle]}>{label}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   BorderRadius.xl,
    gap:            RSpacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight:    '600',
    letterSpacing: 0.3,
  },
});
