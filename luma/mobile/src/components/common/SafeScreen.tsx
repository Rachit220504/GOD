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
// FIX: Use the hook instead of the wrapper component to stop layout squishing
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';
import { SCREEN_PADDING } from '../../utils/responsive';

interface SafeScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  withKeyboard?: boolean;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  withPadding?: boolean;
}

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

  // Get safe area bounds manually
  const insets = useSafeAreaInsets();

  const inner = scrollable ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[
        withPadding && styles.padded,
        contentStyle,
        { flexGrow: 1 }
      ]}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.view, { backgroundColor: bg }, withPadding && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  const content = (withKeyboard && Platform.OS === 'ios') ? (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: bg }]} behavior="padding">
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    // FIX: Apply safe area insets manually as padding to a standard View
    <View
      style={[
        styles.safe,
        {
          backgroundColor: bg,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={bg} translucent={false} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  view: { flex: 1 },
  padded: { padding: SCREEN_PADDING },
});