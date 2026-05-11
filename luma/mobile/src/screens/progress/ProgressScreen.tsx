import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProgressScreen() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Moved</Text>
      <Text style={styles.emptyText}>This screen is now part of Gamification.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 16,
  },
});
