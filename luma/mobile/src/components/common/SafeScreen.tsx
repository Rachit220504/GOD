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
// Use the native SafeAreaView, NOT the manual hook
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const inner = scrollable ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={[
        withPadding && styles.padded,
        contentStyle,
        { flexGrow: 1 }
      ]}
      // CRITICAL: Must be "handled" to ignore phantom finger lifts
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      bounces={false} // Stops iOS/Android from bouncing and shifting
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.view, { backgroundColor: bg }, withPadding && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  // We only run KeyboardAvoidingView on iOS. Android handles itself.
  const content = (withKeyboard && Platform.OS === 'ios') ? (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: bg }]} behavior="padding">
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    // CRITICAL: edges={['top']} ensures the bottom of the screen never 
    // recalculates and jumps when the Android keyboard opens.
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} translucent={false} />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  view: { flex: 1 },
  padded: { padding: SCREEN_PADDING },
});