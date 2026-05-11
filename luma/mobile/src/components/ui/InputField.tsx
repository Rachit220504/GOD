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
import { Colors, BorderRadius, RFontSize, RSpacing, MIN_TOUCH } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputFieldProps extends TextInputProps {
  label:             string;
  error?:            string;
  hint?:             string;
  leftIcon?:         React.ReactNode;
  rightIcon?:        React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?:   ViewStyle;
  required?:         boolean;
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
            hasError  && styles.error,
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={hint}
            style={[
              styles.input,
              leftIcon  ? styles.inputWithLeft  : undefined,
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
    width:        '100%',
    marginBottom: RSpacing.lg,
  },
  label: {
    fontSize:      RFontSize.sm,
    fontWeight:    '600',
    color:         Colors.textPrimary,
    marginBottom:  RSpacing.xs,
    letterSpacing: 0.3,
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     2,
    borderColor:     Colors.border,
    borderRadius:    BorderRadius.lg,
    backgroundColor: Colors.white,
    minHeight:       Math.max(MIN_TOUCH + 8, 52),
  },
  focused: {
    borderColor:  Colors.borderFocus,
    shadowColor:  Colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius:  6,
  },
  error: {
    borderColor: Colors.error,
  },
  input: {
    flex:             1,
    fontSize:         RFontSize.md,
    color:            Colors.textPrimary,
    paddingHorizontal: RSpacing.lg,
    paddingVertical:   RSpacing.md,
    letterSpacing:     0.3,
    // lineHeight set inline so it scales with dynamic font size
  },
  inputWithLeft: {
    paddingLeft: RSpacing.sm,
  },
  inputWithRight: {
    paddingRight: RSpacing.sm,
  },
  iconLeft: {
    paddingLeft: RSpacing.lg,
  },
  iconRight: {
    paddingRight: RSpacing.lg,
    minWidth:     MIN_TOUCH,
    minHeight:    MIN_TOUCH,
    justifyContent: 'center',
    alignItems:     'center',
  },
  errorText: {
    fontSize:      RFontSize.sm,
    color:         Colors.error,
    marginTop:     RSpacing.xs,
    letterSpacing: 0.2,
  },
  hintText: {
    fontSize:      RFontSize.sm,
    color:         Colors.textMuted,
    marginTop:     RSpacing.xs,
    letterSpacing: 0.2,
  },
});
