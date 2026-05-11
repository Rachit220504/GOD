import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

const BG_PRESETS = [
  { color: '#FDFBF7', label: 'Cream' },
  { color: '#F0F4F8', label: 'Blue' },
  { color: '#FFF5F0', label: 'Peach' },
  { color: '#F3F0FF', label: 'Lavender' },
  { color: '#F0FFF4', label: 'Mint' },
];
const FONT_PRESETS = [
  { name: 'Lexend', family: 'Lexend' },
  { name: 'System', family: 'System' },
  { name: 'Sans-serif', family: 'Roboto_400Regular' },
  { name: 'Serif', family: 'Roboto_700Bold' },
  { name: 'OpenDyslexic', family: 'OpenDyslexic' },
  { name: 'Dyslexie', family: 'OpenDyslexicBold' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.settingRow}>
      <Text style={s.settingLabel}>{label}</Text>
      <View style={s.settingControl}>{children}</View>
    </View>
  );
}

function Slider({ value, min, max, step, onChange, format }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <View style={s.sliderRow}>
      <TouchableOpacity
        style={s.sliderBtn}
        onPress={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}
      >
        <Text style={s.sliderBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={s.sliderValue}>{format(value)}</Text>
      <TouchableOpacity
        style={s.sliderBtn}
        onPress={() => onChange(Math.min(max, Math.round((value + step) * 100) / 100))}
      >
        <Text style={s.sliderBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const comfort = useReadingComfort();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Responsive layout
  const { spacing, mScale, screenPadding, formMaxWidth, centeredContent, isTablet } = useResponsiveLayout();
  
  // Responsive font sizes
  const titleSize = mScale(isTablet ? 32 : 28, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const sectionTitleSize = mScale(20, 0.3);
  const userNameSize = mScale(18, 0.3);
  const userEmailSize = mScale(14, 0.3);
  const roleTextSize = mScale(12, 0.3);
  const settingLabelSize = mScale(16, 0.3);
  const sliderBtnTextSize = mScale(20, 0.3);
  const sliderValueSize = mScale(16, 0.3);
  const bgLabelSize = mScale(10, 0.3);
  const checkMarkSize = mScale(18, 0.3);
  const fontChipTextSize = mScale(14, 0.3);
  const currentFontLabelSize = mScale(16, 0.3);
  const currentFontValueSize = mScale(18, 0.3);
  const avatarSize = mScale(56, 0.3);
  const avatarTextSize = mScale(28, 0.3);
  const sliderBtnSize = mScale(36, 0.2);
  const bgSwatchSize = mScale(44, 0.2);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await comfort.syncToServer();
      Alert.alert('Saved!', 'Your reading settings have been saved.');
    } catch {
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [comfort]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <SafeScreen scrollable withPadding={false} backgroundColor={comfort.backgroundColor}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          s.content,
          { paddingHorizontal: screenPadding, paddingBottom: spacing.xxl * 2 },
          centeredContent,
          { maxWidth: formMaxWidth, width: '100%' }
        ]}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xs }]}>
          <Text style={[s.title, { fontSize: titleSize }]}>Settings ⚙️</Text>
          <Text style={[s.subtitle, { fontSize: subtitleSize }]}>Make reading comfortable for you</Text>
        </View>

        {/* User info */}
        <Card variant="elevated" style={{ marginBottom: spacing.md, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={[s.avatar, { 
              width: avatarSize, 
              height: avatarSize, 
              borderRadius: avatarSize / 2,
              backgroundColor: Colors.lavender, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }]}>
              <Text style={{ fontSize: avatarTextSize }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.userName, { fontSize: userNameSize }]}>{user?.displayName ?? 'Reader'}</Text>
              <Text style={[s.userEmail, { fontSize: userEmailSize }]}>{user?.email}</Text>
              <View style={[s.roleBadge, { 
                marginTop: 4, 
                alignSelf: 'flex-start', 
                backgroundColor: Colors.lavender, 
                paddingHorizontal: spacing.sm, 
                paddingVertical: 2, 
                borderRadius: BorderRadius.full 
              }]}>
                <Text style={[s.roleText, { fontSize: roleTextSize }]}>{user?.role ?? 'CHILD'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reading Comfort */}
        <Text style={[s.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.sm, marginTop: spacing.sm }]}>
          📖 Reading Comfort
        </Text>
        <Card variant="elevated" style={{ marginBottom: spacing.md, gap: spacing.md }}>

          <Row label="Font Size">
            <View style={[s.sliderRow, { flexDirection: 'row', alignItems: 'center', gap: spacing.md }]}>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateFontSize(Math.max(14, Math.round((comfort.fontSize - 1) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>−</Text>
              </TouchableOpacity>
              <Text style={[s.sliderValue, { fontSize: sliderValueSize, fontWeight: '700', color: Colors.textPrimary, minWidth: 48, textAlign: 'center' }]}>
                {comfort.fontSize}px
              </Text>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateFontSize(Math.min(32, Math.round((comfort.fontSize + 1) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>+</Text>
              </TouchableOpacity>
            </View>
          </Row>

          <Row label="Letter Spacing">
            <View style={[s.sliderRow, { flexDirection: 'row', alignItems: 'center', gap: spacing.md }]}>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateLetterSpacing(Math.max(0, Math.round((comfort.letterSpacing - 0.02) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>−</Text>
              </TouchableOpacity>
              <Text style={[s.sliderValue, { fontSize: sliderValueSize, fontWeight: '700', color: Colors.textPrimary, minWidth: 48, textAlign: 'center' }]}>
                {Math.round(comfort.letterSpacing * 100)}%
              </Text>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateLetterSpacing(Math.min(0.2, Math.round((comfort.letterSpacing + 0.02) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>+</Text>
              </TouchableOpacity>
            </View>
          </Row>

          <Row label="Line Height">
            <View style={[s.sliderRow, { flexDirection: 'row', alignItems: 'center', gap: spacing.md }]}>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateLineHeight(Math.max(1.2, Math.round((comfort.lineHeight - 0.1) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>−</Text>
              </TouchableOpacity>
              <Text style={[s.sliderValue, { fontSize: sliderValueSize, fontWeight: '700', color: Colors.textPrimary, minWidth: 48, textAlign: 'center' }]}>
                {comfort.lineHeight.toFixed(1)}
              </Text>
              <TouchableOpacity
                style={[s.sliderBtn, { 
                  width: sliderBtnSize, 
                  height: sliderBtnSize, 
                  borderRadius: sliderBtnSize / 2,
                  backgroundColor: Colors.lavender, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateLineHeight(Math.min(2.2, Math.round((comfort.lineHeight + 0.1) * 100) / 100))}
              >
                <Text style={[s.sliderBtnText, { fontSize: sliderBtnTextSize, fontWeight: '700', color: Colors.purple }]}>+</Text>
              </TouchableOpacity>
            </View>
          </Row>

          {/* Live preview */}
          <View style={[s.preview, { backgroundColor: comfort.backgroundColor, borderRadius: BorderRadius.lg, padding: spacing.lg, marginTop: spacing.sm }]}>
            <Text style={[s.previewText, {
              fontSize: comfort.fontSize,
              letterSpacing: comfort.fontSize * comfort.letterSpacing,
              lineHeight: comfort.fontSize * comfort.lineHeight,
              fontFamily: comfort.fontFamily,
              color: Colors.textPrimary,
            }]}>
              The sun was bright and warm. Birds sang in the big oak tree.
            </Text>
          </View>
        </Card>

        {/* Background */}
        <Text style={[s.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.sm, marginTop: spacing.sm }]}>
          🎨 Background Colour
        </Text>
        <Card variant="elevated" style={{ marginBottom: spacing.md, gap: spacing.md }}>
          <View style={[s.bgRow, { flexDirection: 'row', justifyContent: 'space-between' }]}>
            {BG_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.color}
                style={[s.bgSwatch, { 
                  width: bgSwatchSize,
                  height: bgSwatchSize,
                  borderRadius: bgSwatchSize / 2,
                  backgroundColor: p.color,
                  borderWidth: comfort.backgroundColor === p.color ? 3 : 2,
                  borderColor: comfort.backgroundColor === p.color ? Colors.purple : Colors.border,
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }]}
                onPress={() => comfort.updateBackgroundColor(p.color)}
                accessibilityRole="radio"
                accessibilityLabel={`${p.label} background`}
                accessibilityState={{ checked: comfort.backgroundColor === p.color }}
              >
                {comfort.backgroundColor === p.color && <Text style={{ fontSize: checkMarkSize, color: Colors.purple, fontWeight: '800' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={[s.bgLabels, { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }]}>
            {BG_PRESETS.map((p) => (
              <Text key={p.color} style={[s.bgLabel, { fontSize: bgLabelSize, color: Colors.textMuted, textAlign: 'center', width: bgSwatchSize }]}>{p.label}</Text>
            ))}
          </View>
        </Card>

        {/* Font family */}
        <Text style={[s.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.sm, marginTop: spacing.sm }]}>
          🔤 Font Family
        </Text>
        <Card variant="elevated" style={{ marginBottom: spacing.md, gap: spacing.md }}>
          <View style={[s.currentFontDisplay, { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, padding: spacing.md, backgroundColor: Colors.lavender, borderRadius: BorderRadius.lg }]}>
            <Text style={[s.currentFontLabel, { fontSize: currentFontLabelSize, fontWeight: '600', color: Colors.textSecondary }]}>Current: </Text>
            <Text style={[s.currentFontValue, { fontSize: currentFontValueSize, fontWeight: '700', color: Colors.purple, fontFamily: comfort.fontFamily }]}>
              {FONT_PRESETS.find(f => f.family === comfort.fontFamily)?.name || comfort.fontFamily}
            </Text>
          </View>
          <View style={[s.fontRow, { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }]}>
            {FONT_PRESETS.map((font) => (
              <TouchableOpacity
                key={font.name}
                style={[s.fontChip, {
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: comfort.fontFamily === font.family ? Colors.lavender : Colors.softBlue,
                  borderWidth: 2,
                  borderColor: comfort.fontFamily === font.family ? Colors.purple : Colors.border,
                }]}
                onPress={() => comfort.updateFontFamily(font.family)}
              >
                <Text style={[s.fontChipText, {
                  fontSize: fontChipTextSize,
                  fontWeight: '600',
                  color: comfort.fontFamily === font.family ? Colors.purple : Colors.textSecondary,
                  fontFamily: font.family
                }]}>{font.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Save / Reset */}
        <View style={[s.actionRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
          <Button label="Save Settings" onPress={handleSync} isLoading={isSyncing} size="lg" fullWidth />
          <Button label="Reset to Defaults" onPress={comfort.resetToDefaults} variant="ghost" size="md" fullWidth />
        </View>

        {/* Sign out */}
        <Card variant="outline" style={{ marginBottom: spacing.md }}>
          <Button label="Sign Out" onPress={handleLogout} variant="danger" fullWidth size="md" />
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  content: { 
    // paddingHorizontal, paddingBottom handled dynamically
  },
  header: { 
    // paddingTop, paddingBottom, gap handled dynamically
  },
  title: { 
    fontWeight: '800', 
    color: Colors.textPrimary, 
    letterSpacing: -0.5,
    // fontSize handled dynamically
  },
  subtitle: { 
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  sectionTitle: { 
    fontWeight: '700', 
    color: Colors.textPrimary,
    // fontSize, marginBottom, marginTop handled dynamically
  },
  section: { 
    // marginBottom, gap handled dynamically
  },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    // gap handled dynamically
  },
  avatar: { 
    backgroundColor: Colors.lavender, 
    alignItems: 'center', 
    justifyContent: 'center',
    // width, height, borderRadius handled dynamically
  },
  userName: { 
    fontWeight: '800', 
    color: Colors.textPrimary,
    // fontSize handled dynamically
  },
  userEmail: { 
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  roleBadge: { 
    backgroundColor: Colors.lavender,
    // marginTop, alignSelf, paddingHorizontal, paddingVertical, borderRadius handled dynamically
  },
  roleText: { 
    fontWeight: '700', 
    color: Colors.purple,
    // fontSize handled dynamically
  },
  settingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    // paddingVertical handled dynamically
  },
  settingLabel: { 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    flex: 1,
    // fontSize handled dynamically
  },
  settingControl: { 
    alignItems: 'flex-end' 
  },
  sliderRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    // gap handled dynamically
  },
  sliderBtn: { 
    backgroundColor: Colors.lavender, 
    alignItems: 'center', 
    justifyContent: 'center',
    // width, height, borderRadius handled dynamically
  },
  sliderBtnText: { 
    fontWeight: '700', 
    color: Colors.purple,
    // fontSize handled dynamically
  },
  sliderValue: { 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    minWidth: 48, 
    textAlign: 'center',
    // fontSize handled dynamically
  },
  preview: { 
    borderRadius: BorderRadius.lg,
    // padding, marginTop, backgroundColor handled dynamically
  },
  previewText: { 
    color: Colors.textPrimary 
  },
  bgRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  bgSwatch: { 
    alignItems: 'center', 
    justifyContent: 'center',
    // width, height, borderRadius, borderWidth, borderColor, backgroundColor handled dynamically
  },
  checkMark: { 
    color: Colors.purple, 
    fontWeight: '800',
    // fontSize handled dynamically
  },
  bgLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    // marginTop handled dynamically
  },
  bgLabel: { 
    color: Colors.textMuted, 
    textAlign: 'center',
    // fontSize, width handled dynamically
  },
  fontRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    // gap handled dynamically
  },
  fontChip: { 
    borderRadius: BorderRadius.lg,
    // paddingHorizontal, paddingVertical, backgroundColor, borderWidth, borderColor handled dynamically
  },
  fontChipText: { 
    fontWeight: '600',
    // fontSize, color handled dynamically
  },
  currentFontDisplay: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.lg,
    // marginBottom, padding handled dynamically
  },
  currentFontLabel: { 
    fontWeight: '600', 
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  currentFontValue: { 
    fontWeight: '700', 
    color: Colors.purple,
    // fontSize handled dynamically
  },
  actionRow: { 
    // gap, marginBottom handled dynamically
  },
});
