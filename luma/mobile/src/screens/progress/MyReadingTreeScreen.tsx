import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressData } from '../../hooks/useProgressData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';

type Props = NativeStackScreenProps<ProgressStackParamList, 'MyReadingTree'>;

const FRUITS = [
  { id: 1, emoji: '🍎', x: 30, y: 50, earned: true },
  { id: 2, emoji: '🍎', x: 70, y: 60, earned: true },
  { id: 3, emoji: '🍎', x: 50, y: 80, earned: true },
  { id: 4, emoji: '🍊', x: 25, y: 100, earned: true },
  { id: 5, emoji: '🍎', x: 75, y: 90, earned: true },
  { id: 6, emoji: '🍊', x: 50, y: 40, earned: true },
  { id: 7, emoji: '❓', x: 35, y: 30, earned: false },
  { id: 8, emoji: '❓', x: 65, y: 35, earned: false },
  { id: 9, emoji: '❓', x: 50, y: 20, earned: false },
];

function TreeVisual({ fruitsEarned }: { fruitsEarned: number }) {
  const totalFruits = FRUITS.length;
  const earnedCount = Math.min(fruitsEarned, totalFruits);

  return (
    <View style={treeStyles.container}>
      <View style={treeStyles.sun}>
        <View style={treeStyles.sunInner} />
      </View>
      <View style={treeStyles.treeContainer}>
        <View style={treeStyles.foliage}>
          {FRUITS.map((fruit, index) => {
            const isEarned = index < earnedCount;
            return (
              <View
                key={fruit.id}
                style={[
                  treeStyles.fruit,
                  { left: `${fruit.x}%`, top: `${fruit.y}%` },
                  !isEarned && treeStyles.fruitHidden,
                ]}
              >
                <Text style={treeStyles.fruitEmoji}>
                  {isEarned ? fruit.emoji : '🌿'}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={treeStyles.trunk} />
        <View style={treeStyles.ground} />
      </View>
    </View>
  );
}

const treeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xl,
  },
  sun: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEB3B',
  },
  treeContainer: {
    alignItems: 'center',
    width: 200,
    height: 250,
  },
  foliage: {
    width: 160,
    height: 180,
    backgroundColor: '#4CAF50',
    borderRadius: 80,
    position: 'relative',
    zIndex: 2,
  },
  fruit: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitHidden: {
    opacity: 0.3,
  },
  fruitEmoji: {
    fontSize: 24,
  },
  trunk: {
    width: 30,
    height: 60,
    backgroundColor: '#8D6E63',
    marginTop: -10,
    zIndex: 1,
  },
  ground: {
    width: 140,
    height: 15,
    backgroundColor: '#A5D6A7',
    borderRadius: 8,
    marginTop: -5,
  },
});

export function MyReadingTreeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, isLoading } = useProgressData(user?.id);

  if (isLoading) return <LoadingSpinner fullScreen message="Growing your tree..." />;

  const storiesDone = stats?.booksCompleted ?? 0;
  const wordsRead = stats?.totalWordsRead ?? 0;
  const phonicsSkill = stats?.skillProgress?.[0]?.percentage ?? 0;

  const totalFruits = 9;
  const fruitsEarned = Math.min(storiesDone, totalFruits);
  const nextFruitAt = fruitsEarned + 1;

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Reading Tree 🌳</Text>
          <Text style={styles.subtitle}>Each fruit = 1 story completed!</Text>
        </View>

        <View style={styles.fruitRow}>
          <View style={[styles.fruitBox, styles.earnedBox]}>
            <View style={styles.fruitIcon}>
              <Text>🍎</Text>
            </View>
            <View>
              <Text style={styles.earnedCount}>×{fruitsEarned}</Text>
              <Text style={styles.earnedLabel}>Fruits earned</Text>
            </View>
          </View>
          <View style={[styles.fruitBox, styles.growingBox]}>
            <View style={[styles.fruitIcon, styles.growingIcon]}>
              <Text>🍎</Text>
            </View>
            <View>
              <Text style={styles.growingCount}>×{totalFruits - fruitsEarned}</Text>
              <Text style={styles.growingLabel}>Still growing</Text>
            </View>
          </View>
        </View>

        <View style={styles.treeArea}>
          <TreeVisual fruitsEarned={fruitsEarned} />
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{storiesDone}</Text>
            <Text style={styles.statLabel}>Stories Done</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.lavender }]}>
            <Text style={styles.statValue}>{wordsRead}</Text>
            <Text style={styles.statLabel}>Words Read</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.statValue, { color: '#F57C00' }]}>{phonicsSkill}%</Text>
            <Text style={styles.statLabel}>Letter Skill</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {fruitsEarned < totalFruits
              ? `🍎 Next fruit at ${nextFruitAt} stories!`
              : '🎉 All fruits grown! Amazing reader!'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(fruitsEarned / totalFruits) * 100}%` }]} />
          </View>
          <Text style={styles.progressDetail}>{fruitsEarned} of {totalFruits} fruits grown</Text>
        </View>

        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('ProgressMain')}>
          <Text style={styles.ctaText}>Grow Another Fruit! 🍊</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>Share my tree 🌳</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.screen, paddingTop: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: '#2E7D32', marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  fruitRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  fruitBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, ...Shadow.sm },
  earnedBox: { backgroundColor: '#FFEBEE' },
  growingBox: { backgroundColor: '#F5F5F5' },
  fruitIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EF5350', alignItems: 'center', justifyContent: 'center' },
  growingIcon: { backgroundColor: '#E0E0E0' },
  earnedCount: { fontSize: FontSize.xl, fontWeight: '800', color: '#C62828' },
  earnedLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  growingCount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textMuted },
  growingLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  treeArea: { backgroundColor: '#E3F2FD', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statBox: { flex: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.purple, marginBottom: Spacing.xs },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  progressCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  progressText: { fontSize: FontSize.md, fontWeight: '700', color: '#2E7D32', marginBottom: Spacing.md },
  progressTrack: { height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: '#FF9800', borderRadius: 6 },
  progressDetail: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  ctaButton: { backgroundColor: '#FF9800', borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  ctaText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  shareButton: { backgroundColor: '#FFF8E1', borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#FFE082' },
  shareText: { color: '#F57C00', fontSize: FontSize.md, fontWeight: '600' },
  bottomPadding: { height: 100 },
});
