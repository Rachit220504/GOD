import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  SectionHeader, StatCard, DashboardCard, ChartWrapper,
  EmptyState, SkillBar,
} from '../../components/dashboard/DashboardComponents';
import { BarChart, WeeklyMiniChart, SkillTrendChart, LineChart } from '../../components/dashboard/Charts';
import { analyticsApi, ProgressSummary, SkillsData, SessionHistoryItem, ReadingTips } from '../../services/analyticsApi';
import { profileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleGuard } from '../../hooks/useRoleGuard';

// ─── Tab Types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'skills' | 'activity' | 'tips';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'overview', label: 'Overview', emoji: '📊' },
  { id: 'skills', label: 'Skills', emoji: '🧠' },
  { id: 'activity', label: 'Activity', emoji: '📅' },
  { id: 'tips', label: 'Tips', emoji: '💡' },
];

// ─── Child selector ───────────────────────────────────────────────────────────

interface ChildProfile {
  id: string;
  email: string;
  displayName: string;
  readingLevel: string;
  totalPoints: number;
  currentStreak: number;
  booksCompleted: number;
}

type Props = NativeStackScreenProps<HomeStackParamList, 'ParentDashboard'>;

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ userId }: { userId: string }) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    analyticsApi.getSummary(userId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <LoadingSpinner message="Loading overview..." />;
  if (error || !data) return <EmptyState emoji="📭" title="No data yet" message="Start reading to see stats here!" />;

  const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const monthlyBarData = data.monthlyProgress.map((w) => ({
    label: w.week.slice(5), // MM-DD
    value: w.avgWpm,
    color: Colors.purple,
  }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.tabContent}>
      {/* Stat grid */}
      <SectionHeader title="At a Glance" />
      <View style={s.statsGrid}>
        <View style={s.statsRow}>
          <StatCard emoji="⏱" value={fmtTime(data.totalReadingSeconds)} label="Total Time" backgroundColor={Colors.softBlue} />
          <StatCard emoji="📖" value={data.totalSessions} label="Sessions" backgroundColor={Colors.lavender} />
        </View>
        <View style={s.statsRow}>
          <StatCard emoji="⚡" value={`${data.avgWordsPerMinute} wpm`} label="Avg Speed" backgroundColor={Colors.softPeach} trend={data.avgWordsPerMinute > 60 ? 'up' : 'neutral'} />
          <StatCard emoji="🎯" value={`${data.avgAccuracyPercent}%`} label="Accuracy" backgroundColor={Colors.successLight} trend={data.avgAccuracyPercent > 80 ? 'up' : 'down'} />
        </View>
        <View style={s.statsRow}>
          <StatCard emoji="🔥" value={`${data.currentStreak}d`} label="Streak" backgroundColor={Colors.softPeach} />
          <StatCard emoji="🏆" value={data.totalPoints} label="Points" backgroundColor={Colors.lavender} />
        </View>
      </View>

      {/* Weekly activity */}
      <ChartWrapper title="📅 This Week" subtitle="Daily reading minutes">
        <WeeklyMiniChart data={data.weeklyActivity} />
      </ChartWrapper>

      {/* Monthly WPM trend */}
      {monthlyBarData.length > 1 && (
        <ChartWrapper title="📈 Reading Speed Trend" subtitle="Average words per minute by week">
          <BarChart data={monthlyBarData} height={130} />
        </ChartWrapper>
      )}

      {/* Completion rate */}
      <DashboardCard title="✅ Story Completion Rate" accentColor={Colors.success}>
        <View style={s.bigStat}>
          <Text style={s.bigStatValue}>{data.avgCompletionPct}%</Text>
          <Text style={s.bigStatLabel}>average stories finished</Text>
        </View>
        <View style={s.completionTrack}>
          <View style={[s.completionFill, { width: `${data.avgCompletionPct}%` }]} />
        </View>
        <Text style={s.completionHint}>
          {data.avgCompletionPct >= 85
            ? '🌟 Excellent! Almost every story is finished.'
            : data.avgCompletionPct >= 60
              ? '👍 Good — try finishing more stories for better retention.'
              : '💪 Encourage completing full stories for better learning.'}
        </Text>
      </DashboardCard>
    </ScrollView>
  );
}

// ─── Skills Tab ───────────────────────────────────────────────────────────────

function SkillsTab({ userId }: { userId: string }) {
  const [data, setData] = useState<SkillsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    analyticsApi.getSkills(userId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <LoadingSpinner message="Analysing skills..." />;
  if (error || !data) return <EmptyState emoji="🧠" title="No skills data" message="Complete a few reading sessions to see your skills breakdown!" />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.tabContent}>
      {/* Score bars */}
      <DashboardCard title="🎯 Skill Scores" accentColor={Colors.purple}>
        <SkillBar label="Phonics & Word Recognition" value={data.phonicsScore} color={Colors.purple} />
        <SkillBar label="Reading Fluency (Speed)" value={data.fluencyScore} color={Colors.orange} />
        <SkillBar label="Story Comprehension" value={data.comprehensionScore} color={Colors.success} />
      </DashboardCard>

      {/* Strong / weak areas */}
      <View style={s.areasRow}>
        {data.strongAreas.length > 0 && (
          <DashboardCard style={{ flex: 1, marginRight: Spacing.sm }} accentColor={Colors.success}>
            <Text style={s.areaTitle}>✅ Strong</Text>
            {data.strongAreas.map((a) => (
              <Text key={a} style={s.areaItem}>• {a}</Text>
            ))}
          </DashboardCard>
        )}
        {data.weakAreas.length > 0 && (
          <DashboardCard style={{ flex: 1 }} accentColor={Colors.orange}>
            <Text style={s.areaTitle}>💪 To Improve</Text>
            {data.weakAreas.map((a) => (
              <Text key={a} style={s.areaItem}>• {a}</Text>
            ))}
          </DashboardCard>
        )}
      </View>

      {/* Trend chart */}
      {data.skillTrend.length >= 2 && (
        <ChartWrapper title="📉 Skill Trend" subtitle="Last 10 reading sessions">
          <SkillTrendChart data={data.skillTrend} height={100} />
        </ChartWrapper>
      )}

      {/* WPM line chart */}
      {data.skillTrend.length >= 2 && (
        <ChartWrapper title="⚡ Fluency Over Time" subtitle="Words per minute each session">
          <LineChart
            data={data.skillTrend.map((d) => ({ label: d.date.slice(5), value: d.fluency }))}
            color={Colors.orange}
            unit="%"
            height={90}
          />
        </ChartWrapper>
      )}
    </ScrollView>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<SessionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(async (p: number, reset = false) => {
    if (reset) { setIsLoading(true); setError(false); }
    else setIsFetchingMore(true);
    try {
      const result = await analyticsApi.getHistory(userId, p, 8);
      setItems((prev) => reset ? result.items : [...prev, ...result.items]);
      setTotalPages(result.totalPages);
      setPage(p);
    } catch { if (reset) setError(true); }
    finally { setIsLoading(false); setIsFetchingMore(false); }
  }, [userId]);

  useEffect(() => { void fetchPage(1, true); }, [userId]);

  if (isLoading) return <LoadingSpinner message="Loading sessions..." />;
  if (error || items.length === 0) return <EmptyState emoji="📅" title="No sessions yet" message="Reading sessions will appear here after your child reads a story." />;

  const LEVEL_COLOR: Record<string, string> = {
    BEGINNER: Colors.successLight,
    ELEMENTARY: Colors.softBlue,
    INTERMEDIATE: Colors.lavender,
    ADVANCED: Colors.softPeach,
  };

  const fmtDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.tabContent}>
      <SectionHeader title="Reading Sessions" subtitle={`${items.length} sessions recorded`} />
      {items.map((item) => (
        <DashboardCard key={item.id} style={s.sessionCard}>
          {/* Title + level */}
          <View style={s.sessionHeader}>
            <View style={[s.levelDot, { backgroundColor: LEVEL_COLOR[item.readingLevel] ?? Colors.softBlue }]} />
            <Text style={s.sessionTitle} numberOfLines={2}>{item.contentTitle}</Text>
          </View>

          {/* Stats row */}
          <View style={s.sessionStats}>
            <View style={s.sessionStat}>
              <Text style={s.sessionStatValue}>{item.wordsPerMinute}</Text>
              <Text style={s.sessionStatLabel}>wpm</Text>
            </View>
            <View style={s.sessionDivider} />
            <View style={s.sessionStat}>
              <Text style={s.sessionStatValue}>{item.accuracyPercent}%</Text>
              <Text style={s.sessionStatLabel}>accuracy</Text>
            </View>
            <View style={s.sessionDivider} />
            <View style={s.sessionStat}>
              <Text style={s.sessionStatValue}>{Math.round(item.completionPct)}%</Text>
              <Text style={s.sessionStatLabel}>completed</Text>
            </View>
            <View style={s.sessionDivider} />
            <View style={s.sessionStat}>
              <Text style={s.sessionStatValue}>{fmtDuration(item.durationSeconds)}</Text>
              <Text style={s.sessionStatLabel}>duration</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={s.sessionFooter}>
            <Text style={s.sessionDate}>
              {new Date(item.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            {item.helpRequestCount > 0 && (
              <Text style={s.helpCount}>💬 {item.helpRequestCount} word{item.helpRequestCount > 1 ? 's' : ''} looked up</Text>
            )}
          </View>
        </DashboardCard>
      ))}

      {/* Load more */}
      {page < totalPages && (
        <TouchableOpacity
          style={s.loadMoreBtn}
          onPress={() => void fetchPage(page + 1)}
          disabled={isFetchingMore}
        >
          <Text style={s.loadMoreText}>
            {isFetchingMore ? 'Loading...' : 'Load more sessions'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─── Tips Tab ─────────────────────────────────────────────────────────────────

function TipsTab({ userId }: { userId: string }) {
  const [tips, setTips] = useState<ReadingTips | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    analyticsApi.getTips(userId)
      .then(setTips)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <LoadingSpinner message="Generating personalised tips..." />;
  if (error || !tips) return (
    <EmptyState
      emoji="💡"
      title="Tips unavailable"
      message="We'll generate personalised tips after a few reading sessions."
    />
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.tabContent}>
      {/* Personalised tips */}
      <DashboardCard title="🤖 AI-Personalised Tips" subtitle="Based on your child's recent reading" accentColor={Colors.purple}>
        {tips.personalized.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <View style={s.tipNumber}>
              <Text style={s.tipNumberText}>{i + 1}</Text>
            </View>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </DashboardCard>

      {/* General tips */}
      <DashboardCard title="📚 General Tips" subtitle="Great practices for every reader" accentColor={Colors.orange}>
        {tips.general.map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Text style={s.tipBullet}>•</Text>
            <Text style={s.tipText}>{tip}</Text>
          </View>
        ))}
      </DashboardCard>

      <Text style={s.tipsFooter}>
        Tips generated {new Date(tips.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </Text>
    </ScrollView>
  );
}

// ─── Main Dashboard Screen ────────────────────────────────────────────────────

export function ParentDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { isAllowed } = useRoleGuard(['PARENT', 'EDUCATOR']);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Guard: only PARENT and EDUCATOR can access
  if (!isAllowed) return null;

  const loadChildren = useCallback(async () => {
    try {
      const kids = await profileApi.getMyChildren();
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChild(kids[0]!);
      }
    } catch {
      // Silently fail - will show empty state
    } finally {
      setIsLoadingChildren(false);
    }
  }, []);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void loadChildren();
    });
    return unsubscribe;
  }, [navigation, loadChildren]);

  const handleTabChange = (tab: Tab) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    Animated.spring(indicatorAnim, {
      toValue: idx,
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
    }).start();
    setActiveTab(tab);
  };

  if (isLoadingChildren) return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  if (children.length === 0) {
    return (
      <SafeScreen scrollable backgroundColor={Colors.cream}>
        <View style={s.emptyContainer}>
          <Text style={s.emptyEmoji}>👨‍👧</Text>
          <Text style={s.emptyTitle}>No children linked</Text>
          <Text style={s.emptyMessage}>
            Link your child's account to track their reading progress and view their achievements.
          </Text>
          <TouchableOpacity
            style={s.linkChildBtn}
            onPress={() => navigation.navigate('LinkChild')}
            accessibilityRole="button"
          >
            <Text style={s.linkChildBtnText}>🔗 Link Child Account</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen withPadding={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Parent Dashboard 👩‍👦</Text>
          <TouchableOpacity
            style={s.linkChildHeaderBtn}
            onPress={() => navigation.navigate('LinkChild')}
            accessibilityRole="button"
          >
            <Text style={s.linkChildHeaderBtnText}>+ Link Child</Text>
          </TouchableOpacity>
        </View>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.childScroll}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[s.childChip, selectedChild?.id === child.id && s.childChipSelected]}
                onPress={() => setSelectedChild(child)}
              >
                <Text style={[s.childChipText, selectedChild?.id === child.id && s.childChipTextSelected]}>
                  👧 {child.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Selected child summary */}
        {selectedChild && (
          <View style={s.childSummary}>
            <View style={s.childAvatar}>
              <Text style={{ fontSize: 28 }}>👧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.childName}>{selectedChild.displayName}</Text>
              <Text style={s.childLevel}>{selectedChild.readingLevel} · 🔥 {selectedChild.currentStreak}d · ⭐ {selectedChild.totalPoints} pts</Text>
            </View>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabItem}
              onPress={() => handleTabChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Text style={s.tabEmoji}>{tab.emoji}</Text>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
              {isActive && <View style={s.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab content */}
      {selectedChild && (
        <>
          {activeTab === 'overview' && <OverviewTab userId={selectedChild.id} />}
          {activeTab === 'skills' && <SkillsTab userId={selectedChild.id} />}
          {activeTab === 'activity' && <ActivityTab userId={selectedChild.id} />}
          {activeTab === 'tips' && <TipsTab userId={selectedChild.id} />}
        </>
      )}
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: { backgroundColor: Colors.white, padding: Spacing.screen, paddingBottom: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  childScroll: { marginHorizontal: -Spacing.screen },
  childChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.softBlue, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border },
  childChipSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  childChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  childChipTextSelected: { color: Colors.purple },
  childSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.lavender, borderRadius: BorderRadius.xl, padding: Spacing.md },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  childName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  childLevel: { fontSize: FontSize.sm, color: Colors.purple, fontWeight: '600', marginTop: 2 },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 2, position: 'relative' },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.purple },
  activeIndicator: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, backgroundColor: Colors.purple, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  // Tab content
  tabContent: { padding: Spacing.screen, paddingBottom: Spacing.xxxl },
  statsGrid: { gap: Spacing.sm, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  // Overview
  bigStat: { alignItems: 'center', paddingVertical: Spacing.md },
  bigStatValue: { fontSize: 48, fontWeight: '900', color: Colors.success },
  bigStatLabel: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '500' },
  completionTrack: { height: 16, borderRadius: 8, backgroundColor: Colors.border, marginVertical: Spacing.md, overflow: 'hidden' },
  completionFill: { height: 16, borderRadius: 8, backgroundColor: Colors.success },
  completionHint: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, letterSpacing: 0.2 },

  // Skills
  areasRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  areaTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  areaItem: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },

  // Activity
  sessionCard: { padding: Spacing.lg, marginBottom: Spacing.sm },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  levelDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  sessionTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  sessionStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: Colors.softBlue, borderRadius: BorderRadius.lg, padding: Spacing.md },
  sessionStat: { alignItems: 'center', gap: 2 },
  sessionStatValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  sessionStatLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  sessionDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  sessionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  sessionDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  helpCount: { fontSize: FontSize.xs, color: Colors.purple, fontWeight: '600' },
  loadMoreBtn: { padding: Spacing.lg, alignItems: 'center', backgroundColor: Colors.softBlue, borderRadius: BorderRadius.xl, marginTop: Spacing.sm },
  loadMoreText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '700' },

  // Tips
  tipRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, alignItems: 'flex-start' },
  tipNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipNumberText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textOnDark },
  tipBullet: { fontSize: FontSize.xl, color: Colors.orange, lineHeight: 26 },
  tipText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 26, letterSpacing: 0.2 },
  tipsFooter: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  emptyMessage: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 24 },
  linkChildBtn: { backgroundColor: Colors.purple, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.lg },
  linkChildBtnText: { fontSize: FontSize.md, color: Colors.white, fontWeight: '700' },

  // Header Link Child button
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  linkChildHeaderBtn: { backgroundColor: Colors.lavender, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md },
  linkChildHeaderBtnText: { fontSize: FontSize.sm, color: Colors.purple, fontWeight: '700' },
});
