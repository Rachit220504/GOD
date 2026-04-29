import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Vibration, AccessibilityInfo,
} from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing, FontSize } from '../../constants/theme';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FABAction = {
  id: string;
  emoji: string;
  label: string;
  onPress: () => void;
  color?: string;
};

interface FABProps {
  actions: FABAction[];
  primaryEmoji?: string;
  primaryColor?: string;
}

// ─── FloatingActionButton ─────────────────────────────────────────────────────

export function FloatingActionButton({
  actions,
  primaryEmoji = '⚙️',
  primaryColor = Colors.purple,
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Animation values per action
  const slideAnims = useRef(actions.map(() => new Animated.Value(0))).current;
  const opacityAnims = useRef(actions.map(() => new Animated.Value(0))).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const openMenu = useCallback(() => {
    setIsOpen(true);
    Vibration.vibrate(30);

    // Rotate main button
    Animated.spring(rotateAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();

    // Fade overlay
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Stagger action items
    actions.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(slideAnims[i]!, {
          toValue: 1,
          delay: i * 60,
          useNativeDriver: true,
          damping: 12,
          stiffness: 200,
        }),
        Animated.timing(opacityAnims[i]!, {
          toValue: 1,
          duration: 200,
          delay: i * 60,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [actions]);

  const closeMenu = useCallback(() => {
    Animated.spring(rotateAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 12,
    }).start();

    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    actions.forEach((_, i) => {
      Animated.parallel([
        Animated.spring(slideAnims[i]!, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        }),
        Animated.timing(opacityAnims[i]!, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });

    setTimeout(() => setIsOpen(false), 200);
  }, [actions]);

  const toggleMenu = useCallback(() => {
    if (isOpen) closeMenu();
    else openMenu();
  }, [isOpen, openMenu, closeMenu]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Invisible overlay to close on tap outside */}
      {isOpen && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayAnim }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity style={{ flex: 1 }} onPress={closeMenu} accessibilityLabel="Close menu" />
        </Animated.View>
      )}

      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Action items — reversed so first action is nearest to FAB */}
        {[...actions].reverse().map((action, reversedIdx) => {
          const idx = actions.length - 1 - reversedIdx;
          const slideY = slideAnims[idx]!.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(52 + 8) * (reversedIdx + 1)], // Compact 52px + 8px spacing
          });
          return (
            <Animated.View
              key={action.id}
              style={[
                styles.actionItem,
                {
                  opacity: opacityAnims[idx],
                  transform: [{ translateY: slideY }],
                },
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              {/* Label */}
              <View style={styles.actionLabel}>
                <Text style={styles.actionLabelText}>{action.label}</Text>
              </View>

              {/* Action button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: action.color ?? Colors.purple }]}
                onPress={() => {
                  closeMenu();
                  setTimeout(action.onPress, 180);
                }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main FAB */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: primaryColor }]}
            onPress={toggleMenu}
            accessibilityRole="button"
            accessibilityLabel={isOpen ? 'Close reading options' : 'Open reading options'}
            accessibilityState={{ expanded: isOpen }}
          >
            <Animated.Text style={[styles.fabEmoji, { transform: [{ rotate: spin }] }]}>
              {primaryEmoji}
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 98,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Math.min(Spacing.xl, 60), // Cap bottom spacing to avoid overlap with safe area
    right: Spacing.screen,
    alignItems: 'flex-end', // Align to right edge
    zIndex: 99,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  fabEmoji: { fontSize: 24 },
  actionItem: {
    position: 'absolute',
    bottom: 4,
    right: 60, // Position to the left of FAB, not overlapping
    flexDirection: 'row-reverse', // Icon first, then label going left
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionLabel: {
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    maxWidth: 140, // Limit label width
  },
  actionLabelText: {
    fontSize: FontSize.sm,
    color: Colors.textOnDark,
    fontWeight: '600',
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  actionEmoji: { fontSize: 20 },
});
