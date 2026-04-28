import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { progressApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ProgressStats, WeeklyActivity } from '../../types';
import { isTablet, SCREEN_PADDING, centeredContent } from '../../utils/responsive';

function WeeklyChart({ data }: { data: WeeklyActivity[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <View style={chart.row}>
      {data.map((d, i) => {
        const day = new Date(d.date).getDay();
        const h = Math.max(4, (d.minutes / max) * 80);
        const today = d.date === new Date().toISOString().split('T')[0];
        return (
          <View key={i} style={chart.col}>
            <Text style={chart.val}>{d.minutes > 0 ? `${d.minutes}m` : ''}</Text>
            <View style={[chart.bar, { height: h, backgroundColor: today ? Colors.purple : Colors.purpleLight }]} />
            <Text style={[chart.label, today && chart.labelToday]}>{days[day]}</Text>
          </View>
        );
      })}
    </View>
  );
}
const chart = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, paddingTop: Spacing.md },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  val: { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  bar: { width: 20, borderRadius: 6 },
  label: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  labelToday: { color: Colors.purple, fontWeight: '800' },
});

function StatCard({ emoji, value, label, color }: { emoji: string; value: string; label: string; color: string }) {
  return (
    <View style={[s.statCard, { backgroundColor: color }]}>
      <Text style={s.statEmoji}>{emoji}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const BADGES = [
  { emoji: '⭐', label: 'First Story', threshold: 1, field: 'booksCompleted' as const },
  { emoji: '🔥', label: '3-Day Streak', threshold: 3, field: 'currentStreak' as const },
  { emoji: '📚', label: '5 Books', threshold: 5, field: 'booksCompleted' as const },
  { emoji: '🏆', label: '100 Points', threshold: 100, field: 'totalPoints' as const },
];

export function ProgressScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    progressApi.getProgress(user.id)
      .then(setStats)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading progress..." />;

  const fmt = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, isTablet && centeredContent]}
      >
        <View style={s.header}>
          <Text style={s.title}>Your Progress 📊</Text>
          <Text style={s.subtitle}>Keep reading to earn more points!</Text>
        </View>

        {stats ? (
          <>
            {/* Stats: 2×2 on phone, single 4-col row on tablet */}
            {isTablet ? (
              <View style={s.rowTablet}>
                <StatCard emoji="🔥" value={String(stats.currentStreak)} label="Day Streak" color={Colors.softPeach} />
                <StatCard emoji="⭐" value={String(stats.totalPoints)} label="Points" color={Colors.lavender} />
                <StatCard emoji="📚" value={String(stats.booksCompleted)} label="Books Done" color={Colors.successLight} />
                <StatCard emoji="⏱" value={fmt(stats.totalReadingSeconds)} label="Reading Time" color={Colors.softBlue} />
              </View>
            ) : (
              <>
                <View style={s.row}><StatCard emoji="🔥" value={String(stats.currentStreak)} label="Day Streak" color={Colors.softPeach} /><StatCard emoji="⭐" value={String(stats.totalPoints)} label="Points" color={Colors.lavender} /></View>
                <View style={s.row}><StatCard emoji="📚" value={String(stats.booksCompleted)} label="Books Done" color={Colors.successLight} /><StatCard emoji="⏱" value={fmt(stats.totalReadingSeconds)} label="Reading Time" color={Colors.softBlue} /></View>
              </>
            )}

            <Card variant="elevated" style={s.card}>
              <Text style={s.cardTitle}>📈 Your Averages</Text>
              <View style={s.avgRow}>
                {[
                  { val: stats.avgWordsPerMinute, lbl: 'Words/min' },
                  { val: `${stats.avgAccuracyPercent}%`, lbl: 'Accuracy' },
                  { val: `${stats.avgCompletionPct}%`, lbl: 'Completion' },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.divider} />}
                    <View style={s.avgItem}>
                      <Text style={s.avgVal}>{item.val}</Text>
                      <Text style={s.avgLbl}>{item.lbl}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </Card>

            <Card variant="elevated" style={s.card}>
              <Text style={s.cardTitle}>📅 This Week</Text>
              <WeeklyChart data={stats.weeklyActivity} />
            </Card>

            <Text style={s.sectionTitle}>🏅 Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.badges}>
              {BADGES.map((b) => {
                const earned = stats[b.field] >= b.threshold;
                return (
                  <View key={b.label} style={[s.badge, !earned && s.badgeLocked]}>
                    <Text style={{ fontSize: 32, opacity: earned ? 1 : 0.3 }}>{earned ? b.emoji : '🔒'}</Text>
                    <Text style={[s.badgeLabel, !earned && { color: Colors.textMuted }]}>{b.label}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {stats.recentSessions.length > 0 && (
              <>
                <Text style={s.sectionTitle}>📖 Recent Sessions</Text>
                {stats.recentSessions.slice(0, 5).map((session) => (
                  <Card key={session.id} variant="outline" style={s.sessionCard}>
                    <Text style={s.sessionTitle} numberOfLines={1}>{session.contentTitle}</Text>
                    <Text style={s.sessionMeta}>{session.wordsPerMinute} wpm · {session.accuracyPercent}% · {Math.round(session.durationSeconds / 60)}m</Text>
                  </Card>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={s.empty}>
            <Text style={{ fontSize: 64 }}>📭</Text>
            <Text style={s.emptyTitle}>No sessions yet</Text>
            <Text style={s.emptyText}>Read a story to see your progress here!</Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PADDING, paddingBottom: Spacing.xxxl },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xs },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  rowTablet: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  card: { marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  avgRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  avgItem: { alignItems: 'center', gap: Spacing.xs },
  avgVal: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.purple },
  avgLbl: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  badges: { gap: Spacing.md, paddingRight: Spacing.screen, marginBottom: Spacing.xl },
  badge: { alignItems: 'center', gap: Spacing.xs, padding: Spacing.lg, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.border, minWidth: 90, ...Shadow.sm },
  badgeLocked: { backgroundColor: Colors.softBlue },
  badgeLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  sessionCard: { marginBottom: Spacing.sm },
  sessionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  sessionMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
