import * as React from 'react';
import { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Modal,
  PanResponder, Dimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_H = SCREEN_H * 0.62; // 62% of screen

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepControl({
  label,
  value,
  displayValue,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled,
}: {
  label: string;
  value: number;
  displayValue: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
}) {
  return (
    <View style={s.controlRow}>
      <Text style={s.controlLabel}>{label}</Text>
      <View style={s.stepper}>
        <TouchableOpacity
          style={[s.stepBtn, decrementDisabled && s.stepBtnDisabled]}
          onPress={onDecrement}
          disabled={decrementDisabled}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.stepBtnText, decrementDisabled && s.stepBtnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={s.stepValue}>
          <Text style={s.stepValueText}>{displayValue}</Text>
        </View>

        <TouchableOpacity
          style={[s.stepBtn, incrementDisabled && s.stepBtnDisabled]}
          onPress={onIncrement}
          disabled={incrementDisabled}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[s.stepBtnText, incrementDisabled && s.stepBtnTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BG_OPTIONS = [
  { color: '#FDFBF7', label: 'Cream' },
  { color: '#F0F4F8', label: 'Blue' },
  { color: '#FFF5F0', label: 'Peach' },
  { color: '#F3F0FF', label: 'Lavender' },
  { color: '#F0FFF4', label: 'Mint' },
  { color: '#FFFDF0', label: 'Warm' },
];

const FONT_OPTIONS = [
  { value: 'System', label: 'System' },
  { value: 'Lexend', label: 'Lexend' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
];

// ─── ReadingControls ──────────────────────────────────────────────────────────

interface ReadingControlsProps {
  visible: boolean;
  onClose: () => void;
}

export function ReadingControls({ visible, onClose }: ReadingControlsProps) {
  const comfort = useReadingComfort();
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe-down-to-dismiss
  const panY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.8) {
          handleClose();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_H, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      panY.setValue(0);
      onClose();
    });
  }, [onClose]);

  const step = useCallback(
    (field: 'fontSize' | 'letterSpacing' | 'lineHeight', delta: number) => {
      const clamp = (v: number, min: number, max: number) =>
        Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;

      if (field === 'fontSize') comfort.updateFontSize(clamp(comfort.fontSize + delta, 14, 32));
      if (field === 'letterSpacing') comfort.updateLetterSpacing(clamp(comfort.letterSpacing + delta, 0, 0.2));
      if (field === 'lineHeight') comfort.updateLineHeight(clamp(comfort.lineHeight + delta, 1.2, 2.5));
    },
    [comfort],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} accessibilityLabel="Close reading controls" />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          {
            transform: [
              { translateY: slideAnim },
              { translateY: panY },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View style={s.handle} />

        <Text style={s.sheetTitle}>Reading Comfort ✨</Text>
        <Text style={s.sheetSubtitle}>Changes apply instantly — no reload needed</Text>

        {/* Live preview */}
        <View style={[s.preview, { backgroundColor: comfort.backgroundColor }]}>
          <Text
            style={[
              s.previewText,
              {
                fontSize: comfort.fontSize,
                letterSpacing: comfort.fontSize * comfort.letterSpacing,
                lineHeight: comfort.fontSize * comfort.lineHeight,
                fontFamily: comfort.fontFamily !== 'System' ? comfort.fontFamily : undefined,
              },
            ]}
          >
            The quick brown fox jumped over the lazy dog.
          </Text>
        </View>

        {/* Font Size */}
        <StepControl
          label="Font Size"
          value={comfort.fontSize}
          displayValue={`${comfort.fontSize}px`}
          onDecrement={() => step('fontSize', -1)}
          onIncrement={() => step('fontSize', 1)}
          decrementDisabled={comfort.fontSize <= 14}
          incrementDisabled={comfort.fontSize >= 32}
        />

        {/* Letter Spacing */}
        <StepControl
          label="Letter Spacing"
          value={comfort.letterSpacing}
          displayValue={`${Math.round(comfort.letterSpacing * 100)}%`}
          onDecrement={() => step('letterSpacing', -0.02)}
          onIncrement={() => step('letterSpacing', 0.02)}
          decrementDisabled={comfort.letterSpacing <= 0}
          incrementDisabled={comfort.letterSpacing >= 0.2}
        />

        {/* Line Height */}
        <StepControl
          label="Line Height"
          value={comfort.lineHeight}
          displayValue={comfort.lineHeight.toFixed(1)}
          onDecrement={() => step('lineHeight', -0.1)}
          onIncrement={() => step('lineHeight', 0.1)}
          decrementDisabled={comfort.lineHeight <= 1.2}
          incrementDisabled={comfort.lineHeight >= 2.5}
        />

        {/* Background Color */}
        <Text style={s.sectionLabel}>Background</Text>
        <View style={s.bgRow}>
          {BG_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.color}
              style={[
                s.bgSwatch,
                { backgroundColor: opt.color },
                comfort.backgroundColor === opt.color && s.bgSwatchActive,
              ]}
              onPress={() => comfort.updateBackgroundColor(opt.color)}
              accessibilityRole="radio"
              accessibilityLabel={`${opt.label} background`}
              accessibilityState={{ checked: comfort.backgroundColor === opt.color }}
            >
              {comfort.backgroundColor === opt.color && (
                <Text style={s.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Font Family */}
        <Text style={s.sectionLabel}>Font</Text>
        <View style={s.fontRow}>
          {FONT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[s.fontChip, comfort.fontFamily === opt.value && s.fontChipActive]}
              onPress={() => comfort.updateFontFamily(opt.value)}
            >
              <Text
                style={[
                  s.fontChipText,
                  comfort.fontFamily === opt.value && s.fontChipTextActive,
                  { fontFamily: opt.value !== 'System' ? opt.value : undefined },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reset */}
        <TouchableOpacity style={s.resetBtn} onPress={comfort.resetToDefaults}>
          <Text style={s.resetText}>Reset to defaults</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    ...Shadow.lg,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    letterSpacing: 0.2,
  },
  preview: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 72,
    justifyContent: 'center',
  },
  previewText: { color: Colors.textPrimary },

  // Step controls
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  controlLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: Colors.border },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.purple,
    lineHeight: 28,
  },
  stepBtnTextDisabled: { color: Colors.textMuted },
  stepValue: {
    minWidth: 64,
    alignItems: 'center',
  },
  stepValueText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Background
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  bgRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  bgSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgSwatchActive: { borderColor: Colors.purple, borderWidth: 3 },
  checkmark: { fontSize: 18, color: Colors.purple, fontWeight: '800' },

  // Font
  fontRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  fontChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.softBlue,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  fontChipActive: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  fontChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  fontChipTextActive: { color: Colors.purple },

  // Reset
  resetBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  resetText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
