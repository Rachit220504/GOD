import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, FontSize } from '../../constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  color?: string;
}

export function LoadingSpinner({
  message,
  fullScreen = false,
  color = Colors.purple,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={color} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
});
