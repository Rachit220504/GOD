import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      required,
      style,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>

        {/* Input wrapper */}
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.focused,
            hasError && styles.error,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={hint}
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeft : undefined,
              rightIcon ? styles.inputWithRight : undefined,
              style,
            ]}
            placeholderTextColor={Colors.textMuted}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={onRightIconPress}
              accessibilityRole="button"
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>

        {/* Error or hint */}
        {hasError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

InputField.displayName = 'InputField';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    minHeight: 52,
  },
  focused: {
    borderColor: Colors.borderFocus,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  error: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  inputWithLeft: {
    paddingLeft: Spacing.sm,
  },
  inputWithRight: {
    paddingRight: Spacing.sm,
  },
  iconLeft: {
    paddingLeft: Spacing.lg,
  },
  iconRight: {
    paddingRight: Spacing.lg,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
    letterSpacing: 0.2,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    letterSpacing: 0.2,
  },
});
