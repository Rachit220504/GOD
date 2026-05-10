import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressData } from '../../hooks/useProgressData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';

type Props = NativeStackScreenProps<ProgressStackParamList, 'MyStarGalaxy'>;

const STARS = [
  { id: 1, label: '1st Read!', x: 50, y: 10, earned: true },
  { id: 2, label: 'Phonics B', x: 75, y: 25, earned: true },
  { id: 3, label: 'Phonics C', x: 85, y: 50, earned: true },
  { id: 4, label: '3 Day Str', x: 65, y: 70, earned: true },
  { id: 5, label: 'Story 1', x: 40, y: 60, earned: true },
  { id: 6, label: '10 Words', x: 15, y: 55, earned: true },
  { id: 7, label: '5 Words', x: 25, y: 35, earned: true },
  { id: 8, label: '?', x: 20, y: 80, earned: false },
  { id: 9, label: '?', x: 50, y: 90, earned: false },
  { id: 10, label: '?', x: 80, y: 85, earned: false },
  { id: 11, label: '?', x: 35, y: 95, earned: false },
];

function StarMap({ starsCollected }: { starsCollected: number }) {
  return (
    <View style={starStyles.container}>
      {/* Moon */}
      <View style={starStyles.moon} />

      {/* Stars */}
      {STARS.map((star, index) => {
        const isEarned = index < starsCollected;
        return (
          <View
            key={star.id}
            style={[
              starStyles.star,
              { left: `${star.x}%`, top: `${star.y}%` },
              isEarned ? starStyles.starEarned : starStyles.starLocked,
            ]}
          >
            <Text style={starStyles.starEmoji}>{isEarned ? '⭐' : '❓'}</Text>
            {isEarned && <Text style={starStyles.starLabel}>{star.label}</Text>}
          </View>
        );
      })}

      {/* Constellation lines (simplified) */}
      <View style={[starStyles.line, { left: '25%', top: '35%', width: '25%', transform: [{ rotate: '30deg' }] }]} />
      <View style={[starStyles.line, { left: '40%', top: '50%', width: '25%', transform: [{ rotate: '-20deg' }] }]} />
      <View style={[starStyles.line, { left: '50%', top: '25%', width: '25%', transform: [{ rotate: '60deg' }] }]} />
      <View style={[starStyles.line, { left: '65%', top: '45%', width: '20%', transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const starStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  moon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF9C4',
  },
  star: {
    position: 'absolute',
    alignItems: 'center',
  },
  starEarned: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    justifyContent: 'center',
  },
  starLocked: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 20,
  },
  starLabel: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 2,
  },
  line: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export function MyStarGalaxyScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, isLoading } = useProgressData(user?.id);

  if (isLoading) return <LoadingSpinner fullScreen message="Collecting stars..." />;

  const starsCollected = Math.min((stats?.booksCompleted ?? 0) + 1, 11);
  const wordsRead = stats?.totalWordsRead ?? 0;
  const lettersLearned = stats?.lettersLearned ?? 0;
  const phonicsLevel = Math.floor(lettersLearned / 5) + 1;
  const phonicsPercent = stats?.skillProgress?.[0]?.percentage ?? 0;

  const totalStars = 11;
  const starsRemaining = totalStars - starsCollected;

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.galaxyArea}>
          <View style={styles.header}>
            <Text style={styles.title}>My Star Galaxy ✨</Text>
            <Text style={styles.subtitle}>Earn a star each time you read!</Text>
          </View>

          <StarMap starsCollected={starsCollected} />
        </View>

        {/* Stars Collected Card */}
        <View style={styles.collectedCard}>
          <View style={styles.collectedHeader}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.collectedText}>{starsCollected} Stars Collected</Text>
          </View>
          <Text style={styles.collectedSubtext}>
            {starsRemaining > 0 ? `${starsRemaining} more to unlock the Galaxy Crown!` : 'Galaxy Crown unlocked! 🎉'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{starsCollected}</Text>
            <Text style={styles.statLabel}>Stars</Text>
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

        {/* Next Star Progress */}
        <View style={styles.nextStarCard}>
          <Text style={styles.nextStarText}>⭐ Next star: Read for 5 more minutes</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('ProgressMain')}>
          <Text style={styles.ctaText}>Earn My Next Star ✨</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapButton}>
          <Text style={styles.mapText}>See constellation map</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: Spacing.screen, paddingTop: Spacing.xl },
  galaxyArea: {
    backgroundColor: '#1A1A2E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 350,
  },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255, 255, 255, 0.7)' },
  collectedCard: {
    backgroundColor: '#16213E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  collectedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  starIcon: { fontSize: 24 },
  collectedText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFD700' },
  collectedSubtext: { fontSize: FontSize.sm, color: 'rgba(255, 255, 255, 0.6)' },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#16213E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: '#FFD700' },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  nextStarCard: {
    backgroundColor: '#16213E',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  nextStarText: { fontSize: FontSize.md, fontWeight: '600', color: '#FFD700', marginBottom: Spacing.md },
  progressTrack: { height: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 6 },
  ctaButton: { backgroundColor: '#6C5CE7', borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  ctaText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
  mapButton: { backgroundColor: '#16213E', borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center' },
  mapText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: FontSize.md },
  bottomPadding: { height: 100 },
});
