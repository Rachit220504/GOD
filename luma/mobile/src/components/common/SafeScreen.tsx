import React, { ReactNode } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
// Use the new safe-area-context to fix the warning
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';
import { SCREEN_PADDING } from '../../utils/responsive';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SafeScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  withKeyboard?: boolean;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  withPadding?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SafeScreen({
  children,
  scrollable = false,
  withKeyboard = false,
  contentStyle,
  backgroundColor,
  withPadding = true,
}: SafeScreenProps) {
  const { backgroundColor: comfortBg } = useReadingComfort();
  const bg = backgroundColor ?? comfortBg;

  const inner = scrollable ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[
        withPadding && styles.padded,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.view,
        { backgroundColor: bg },
        withPadding && styles.padded,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const content = withKeyboard ? (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: bg }]}
      // FIX: Use undefined for Android so it doesn't fight the native keyboard
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={bg}
        translucent={false}
      />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  view: {
    flex: 1,
  },
  padded: {
    padding: SCREEN_PADDING,
  },
});
