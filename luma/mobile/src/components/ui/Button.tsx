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
import { Colors, BorderRadius, FontSize, Spacing, Shadow } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// ─── Styles per variant ───────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.purple },
    text: { color: Colors.textOnDark },
  },
  secondary: {
    container: { backgroundColor: Colors.orange },
    text: { color: Colors.textOnDark },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: Colors.purple,
    },
    text: { color: Colors.purple },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.purple },
  },
  danger: {
    container: { backgroundColor: Colors.error },
    text: { color: Colors.textOnDark },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, minHeight: 40 },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 48 },
    text: { fontSize: FontSize.md },
  },
  lg: {
    container: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, minHeight: 56 },
    text: { fontSize: FontSize.lg },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  label,
  variant = 'primary',
  size = 'md',
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
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
