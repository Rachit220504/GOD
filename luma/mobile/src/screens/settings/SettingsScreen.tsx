import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';

const BG_PRESETS = [
  { color: '#FDFBF7', label: 'Cream' },
  { color: '#F0F4F8', label: 'Blue' },
  { color: '#FFF5F0', label: 'Peach' },
  { color: '#F3F0FF', label: 'Lavender' },
  { color: '#F0FFF4', label: 'Mint' },
];
const FONT_PRESETS = ['Lexend', 'OpenDyslexic', 'Arial', 'Verdana'];

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Settings ⚙️</Text>
          <Text style={s.subtitle}>Make reading comfortable for you</Text>
        </View>

        {/* User info */}
        <Card variant="elevated" style={s.section}>
          <View style={s.userRow}>
            <View style={s.avatar}><Text style={s.avatarText}>👤</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{user?.displayName ?? 'Reader'}</Text>
              <Text style={s.userEmail}>{user?.email}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleText}>{user?.role ?? 'CHILD'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reading Comfort */}
        <Text style={s.sectionTitle}>📖 Reading Comfort</Text>
        <Card variant="elevated" style={s.section}>

          <Row label="Font Size">
            <Slider
              value={comfort.fontSize}
              min={14} max={32} step={1}
              onChange={comfort.updateFontSize}
              format={(v) => `${v}px`}
            />
          </Row>

          <Row label="Letter Spacing">
            <Slider
              value={comfort.letterSpacing}
              min={0} max={0.2} step={0.02}
              onChange={comfort.updateLetterSpacing}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Row>

          <Row label="Line Height">
            <Slider
              value={comfort.lineHeight}
              min={1.2} max={2.2} step={0.1}
              onChange={comfort.updateLineHeight}
              format={(v) => v.toFixed(1)}
            />
          </Row>

          {/* Live preview */}
          <View style={[s.preview, { backgroundColor: comfort.backgroundColor }]}>
            <Text style={[s.previewText, {
              fontSize: comfort.fontSize,
              letterSpacing: comfort.fontSize * comfort.letterSpacing,
              lineHeight: comfort.fontSize * comfort.lineHeight,
            }]}>
              The sun was bright and warm. Birds sang in the big oak tree.
            </Text>
          </View>
        </Card>

        {/* Background */}
        <Text style={s.sectionTitle}>🎨 Background Colour</Text>
        <Card variant="elevated" style={s.section}>
          <View style={s.bgRow}>
            {BG_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.color}
                style={[s.bgSwatch, { backgroundColor: p.color }, comfort.backgroundColor === p.color && s.bgSwatchSelected]}
                onPress={() => comfort.updateBackgroundColor(p.color)}
                accessibilityRole="radio"
                accessibilityLabel={`${p.label} background`}
                accessibilityState={{ checked: comfort.backgroundColor === p.color }}
              >
                {comfort.backgroundColor === p.color && <Text style={s.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.bgLabels}>
            {BG_PRESETS.map((p) => (
              <Text key={p.color} style={s.bgLabel}>{p.label}</Text>
            ))}
          </View>
        </Card>

        {/* Font family */}
        <Text style={s.sectionTitle}>🔤 Font Family</Text>
        <Card variant="elevated" style={s.section}>
          <View style={s.fontRow}>
            {FONT_PRESETS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.fontChip, comfort.fontFamily === f && s.fontChipSelected]}
                onPress={() => comfort.updateFontFamily(f)}
              >
                <Text style={[s.fontChipText, comfort.fontFamily === f && s.fontChipTextSelected]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Save / Reset */}
        <View style={s.actionRow}>
          <Button label="Save Settings" onPress={handleSync} isLoading={isSyncing} size="lg" fullWidth />
          <Button label="Reset to Defaults" onPress={comfort.resetToDefaults} variant="ghost" size="md" fullWidth />
        </View>

        {/* Sign out */}
        <Card variant="outline" style={s.section}>
          <Button label="Sign Out" onPress={handleLogout} variant="danger" fullWidth size="md" />
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxxl },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xs },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  section: { marginBottom: Spacing.md, gap: Spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28 },
  userName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  roleBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: Colors.lavender, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  roleText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.purple },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  settingControl: { alignItems: 'flex-end' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sliderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  sliderBtnText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.purple },
  sliderValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, minWidth: 48, textAlign: 'center' },
  preview: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.sm },
  previewText: { color: Colors.textPrimary },
  bgRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bgSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  bgSwatchSelected: { borderColor: Colors.purple, borderWidth: 3 },
  checkMark: { fontSize: 18, color: Colors.purple, fontWeight: '800' },
  bgLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  bgLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', width: 44 },
  fontRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fontChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.softBlue, borderWidth: 2, borderColor: Colors.border },
  fontChipSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  fontChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  fontChipTextSelected: { color: Colors.purple },
  actionRow: { gap: Spacing.sm, marginBottom: Spacing.md },
});
