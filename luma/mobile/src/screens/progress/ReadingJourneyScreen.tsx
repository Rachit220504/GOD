import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressData } from '../../hooks/useProgressData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';

type Props = NativeStackScreenProps<ProgressStackParamList, 'ReadingJourney'>;

const CHECKPOINTS = [
  { id: 1, label: '1st Read!', x: 85, y: 10, reached: true, icon: '📚' },
  { id: 2, label: 'Phonics B', x: 60, y: 25, reached: true, icon: '🔤' },
  { id: 3, label: 'Phonics C', x: 75, y: 40, reached: true, icon: '🔤' },
  { id: 4, label: '3 Day Str', x: 40, y: 35, reached: true, icon: '🔥' },
  { id: 5, label: 'Story 1', x: 20, y: 55, reached: true, icon: '📖' },
  { id: 6, label: '10 Words', x: 35, y: 70, reached: true, icon: '✨' },
  { id: 7, label: '5 Words', x: 60, y: 65, reached: true, icon: '✨' },
  { id: 8, label: 'Lv 5 Goal', x: 85, y: 75, reached: false, icon: '🎯' },
  { id: 9, label: '50 Words', x: 50, y: 90, reached: false, icon: '🏆' },
];

function RoadMap({ checkpointsReached }: { checkpointsReached: number }) {
  return (
    <View style={roadStyles.container}>
      {/* Curved road path - simplified as a winding line */}
      <View style={roadStyles.roadPath} />
      
      {/* Checkpoints */}
      {CHECKPOINTS.map((cp, index) => {
        const isReached = index < checkpointsReached;
        return (
          <View
            key={cp.id}
            style={[
              roadStyles.checkpoint,
              { left: `${cp.x}%`, top: `${cp.y}%` },
              isReached && roadStyles.checkpointReached,
            ]}
          >
            <Text style={roadStyles.checkpointIcon}>{isReached ? '✅' : cp.icon}</Text>
            <Text style={[roadStyles.checkpointLabel, isReached && roadStyles.checkpointLabelReached]}>
              {cp.label}
            </Text>
          </View>
        );
      })}

      {/* Milestone markers along the road */}
      <View style={[roadStyles.milestone, { left: '10%', top: '20%' }]}>
        <Text style={roadStyles.milestoneText}>📍</Text>
      </View>
      <View style={[roadStyles.milestone, { left: '30%', top: '45%' }]}>
        <Text style={roadStyles.milestoneText}>📍</Text>
      </View>
      <View style={[roadStyles.milestone, { left: '70%', top: '55%' }]}>
        <Text style={roadStyles.milestoneText}>📍</Text>
      </View>
    </View>
  );
}

const roadStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8F4F8',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  roadPath: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderLeftWidth: 8,
    borderLeftColor: '#B8D4E3',
    borderStyle: 'dashed',
    left: '50%',
  },
  checkpoint: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#D1E7DD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkpointReached: {
    backgroundColor: '#D4EDDA',
  },
  checkpointIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  checkpointLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C757D',
  },
  checkpointLabelReached: {
    color: '#28A745',
  },
  milestone: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  milestoneText: {
    fontSize: 12,
  },
});

export function ReadingJourneyScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, isLoading } = useProgressData(user?.id);

  if (isLoading) return <LoadingSpinner fullScreen message="Mapping your journey..." />;

  const checkpointsReached = Math.min((stats?.booksCompleted ?? 0) + 1, 9);
  const wordsRead = stats?.totalWordsRead ?? 0;
  const lettersLearned = stats?.lettersLearned ?? 0;
  const phonicsLevel = Math.floor(lettersLearned / 5) + 1;
  const phonicsPercent = stats?.skillProgress?.[0]?.percentage ?? 0;

  const totalCheckpoints = 9;
  const remainingCheckpoints = totalCheckpoints - checkpointsReached;

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>📖 Reading Journey</Text>
          <Text style={styles.subtitle}>Follow the reading path and reach your goals!</Text>
        </View>

        {/* Road Map Area */}
        <View style={styles.mapArea}>
          <RoadMap checkpointsReached={checkpointsReached} />
        </View>

        {/* Checkpoints Reached Card */}
        <View style={styles.checkpointsCard}>
          <View style={styles.checkpointsHeader}>
            <Text style={styles.checkpointIconLarge}>📍</Text>
            <Text style={styles.checkpointsText}>{checkpointsReached} Checkpoints Reached</Text>
          </View>
          <Text style={styles.checkpointsSubtext}>
            {remainingCheckpoints > 0 
              ? `${remainingCheckpoints} more to reach the Journey's End Trophy!`
              : 'Journey complete! 🏆'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkpointsReached}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wordsRead}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Lv {phonicsLevel}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{phonicsPercent}%</Text>
            <Text style={styles.statLabel}>Phonics</Text>
          </View>
        </View>

        {/* Next Stop Progress */}
        <View style={styles.nextStopCard}>
          <Text style={styles.nextStopText}>🎯 Next stop: Read for 10 more minutes</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('ProgressMain')}>
          <Text style={styles.ctaText}>Keep Going 📖</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapButton}>
          <Text style={styles.mapText}>View full journey map</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.screen, paddingTop: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  mapArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 400,
  },
  checkpointsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  checkpointsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  checkpointIconLarge: { fontSize: 24 },
  checkpointsText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.success },
  checkpointsSubtext: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    justifyContent: 'space-around',
    ...Shadow.sm,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.success },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  nextStopCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  nextStopText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  progressTrack: { height: 12, backgroundColor: '#E9ECEF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 6 },
  ctaButton: { backgroundColor: Colors.success, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  ctaText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  mapButton: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  mapText: { color: Colors.textSecondary, fontSize: FontSize.md },
  bottomPadding: { height: 100 },
});
