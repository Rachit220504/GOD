import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

// ─── SectionHeader ─────────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={sh.container}>
      <Text style={sh.title}>{title}</Text>
      {subtitle && <Text style={sh.subtitle}>{subtitle}</Text>}
    </View>
  );
}
const sh = StyleSheet.create({
  container: { marginBottom: Spacing.md, marginTop: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, letterSpacing: 0.2 },
});

// ─── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  backgroundColor?: string;
  style?: ViewStyle;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ emoji, value, label, backgroundColor = Colors.softBlue, style, trend }: StatCardProps) {
  const trendEmoji = trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : '';
  const trendColor = trend === 'up' ? Colors.success : trend === 'down' ? Colors.error : Colors.textMuted;
  return (
    <View style={[sc.card, { backgroundColor }, style]}>
      <Text style={sc.emoji}>{emoji}</Text>
      <Text style={sc.value}>
        {value}
        {trendEmoji ? <Text style={[sc.trend, { color: trendColor }]}>{trendEmoji}</Text> : null}
      </Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm },
  emoji: { fontSize: 28 },
  value: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  trend: { fontSize: FontSize.md, fontWeight: '600' },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
});

// ─── DashboardCard ─────────────────────────────────────────────────────────────

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: ViewStyle;
  accentColor?: string;
}

export function DashboardCard({ title, subtitle, children, style, accentColor }: DashboardCardProps) {
  return (
    <View style={[dc.card, style]}>
      {accentColor && <View style={[dc.accent, { backgroundColor: accentColor }]} />}
      {title && (
        <View style={dc.header}>
          <Text style={dc.title}>{title}</Text>
          {subtitle && <Text style={dc.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}
const dc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.md,
    overflow: 'hidden', ...Shadow.sm,
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});

// ─── ChartWrapper ──────────────────────────────────────────────────────────────

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function ChartWrapper({ title, subtitle, children, style }: ChartWrapperProps) {
  return (
    <View style={[cw.container, style]}>
      <Text style={cw.title}>{title}</Text>
      {subtitle && <Text style={cw.subtitle}>{subtitle}</Text>}
      <View style={cw.chartArea}>{children}</View>
    </View>
  );
}
const cw = StyleSheet.create({
  container: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  chartArea: { marginTop: Spacing.md },
});

// ─── SettingControl ────────────────────────────────────────────────────────────

interface SettingControlProps {
  label: string;
  description?: string;
  children: ReactNode;
}

export function SettingControl({ label, description, children }: SettingControlProps) {
  return (
    <View style={sec.container}>
      <View style={sec.textBlock}>
        <Text style={sec.label}>{label}</Text>
        {description && <Text style={sec.description}>{description}</Text>}
      </View>
      <View style={sec.control}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  textBlock: { flex: 1, marginRight: Spacing.md },
  label: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  description: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  control: { alignItems: 'flex-end', minWidth: 120 },
});

// ─── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ emoji, title, message }: { emoji: string; title: string; message: string }) {
  return (
    <View style={es.container}>
      <Text style={es.emoji}>{emoji}</Text>
      <Text style={es.title}>{title}</Text>
      <Text style={es.message}>{message}</Text>
    </View>
  );
}
const es = StyleSheet.create({
  container: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  emoji: { fontSize: 52 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  message: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, letterSpacing: 0.2 },
});

// ─── SkillBar ─────────────────────────────────────────────────────────────────

export function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={sb.container}>
      <View style={sb.labelRow}>
        <Text style={sb.label}>{label}</Text>
        <Text style={[sb.value, { color }]}>{value}%</Text>
      </View>
      <View style={sb.track}>
        <View style={[sb.fill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  label: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  value: { fontSize: FontSize.md, fontWeight: '800' },
  track: { height: 12, borderRadius: 6, backgroundColor: Colors.border },
  fill: { height: 12, borderRadius: 6 },
});
