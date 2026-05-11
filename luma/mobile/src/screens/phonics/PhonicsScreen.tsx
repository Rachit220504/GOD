import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { phonicsApi } from '../../services/api';
import { PhonicsLesson, PhonicsProgress } from '../../types';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

// ─── Letter Card Component ──────────────────────────────────────────────────

interface LetterCardProps {
  lesson: PhonicsLesson;
  progress?: PhonicsProgress;
  onPress: () => void;
}

function LetterCard({ lesson, progress, onPress }: LetterCardProps) {
  // Responsive layout
  const { spacing, mScale, screenPadding, readingMaxWidth, centeredContent, isTablet, phonicsRows, phonicsGridColumns } = useResponsiveLayout();
  
  // Responsive font sizes
  const letterSize = mScale(isTablet ? 48 : 36, 0.3);
  const letterSmallSize = mScale(isTablet ? 28 : 20, 0.3);
  const soundSize = mScale(isTablet ? 24 : 18, 0.3);
  const exampleWordSize = mScale(isTablet ? 18 : 14, 0.3);
  const progressTextSize = mScale(isTablet ? 14 : 12, 0.3);
  
  // Responsive sizing
  const cardMinHeight = mScale(isTablet ? 200 : 160, 0.2);
  
  const masteryLevel = progress?.masteryLevel ?? 0;
  const hasProgress = masteryLevel > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          backgroundColor: lesson.colorTheme,
          minHeight: cardMinHeight,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${lesson.letter}, sound ${lesson.sound}`}
    >
      <View style={[styles.letterContainer, { gap: spacing.sm }]}>
        <Text style={[styles.letter, { fontSize: letterSize }]}>{lesson.letter}</Text>
        <Text style={[styles.letterSmall, { fontSize: letterSmallSize }]}>{lesson.letter.toLowerCase()}</Text>
      </View>
      <Text style={[styles.sound, { fontSize: soundSize }]}>{lesson.sound}</Text>

      {/* Progress indicator */}
      {hasProgress && (
        <View style={[styles.progressContainer, { gap: spacing.sm, marginTop: spacing.xs }]}>
          <View style={[styles.progressBar, { width: `${masteryLevel}%` }]} />
          <Text style={[styles.progressText, { fontSize: progressTextSize }]}>{Math.round(masteryLevel)}%</Text>
        </View>
      )}

      {/* Example words */}
      <View style={[styles.examplesRow, { gap: spacing.xs, marginTop: spacing.xs }]}>
        {lesson.examples.slice(0, 3).map((word, i) => (
          <Text key={i} style={[styles.exampleWord, { fontSize: exampleWordSize }]}>{word}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PhonicsScreen() {
  const [lessons, setLessons] = useState<PhonicsLesson[]>([]);
  const [progress, setProgress] = useState<PhonicsProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchData = useCallback(async () => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        phonicsApi.getLessons(),
        phonicsApi.getMyProgress(),
      ]);
      setLessons(lessonsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load phonics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleLetterPress = useCallback(async (lesson: PhonicsLesson) => {
    // Simulate practice interaction (in a real app, this would navigate to a practice screen)
    // For now, just record a practice attempt
    try {
      await phonicsApi.recordPractice(lesson.id, true);
      // Refresh progress to show updated mastery
      fetchData();
    } catch (error) {
      console.error('Failed to record practice:', error);
    }
  }, [fetchData]);

  const getProgressForLesson = (lessonId: string) => {
    return progress.find((p) => p.lessonId === lessonId);
  };

  if (isLoading) {
    return (
      <SafeScreen scrollable={false}>
        <LoadingSpinner fullScreen message="Loading phonics lessons..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen withPadding={false} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Phonics Practice</Text>
          <Text style={styles.subtitle}>Tap a letter to practice its sound</Text>

          {/* Progress summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {progress.filter((p) => p.masteryLevel > 50).length}
                </Text>
                <Text style={styles.summaryLabel}>Letters Learned</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {Math.round(
                    progress.length > 0
                      ? progress.reduce((sum, p) => sum + p.masteryLevel, 0) / progress.length
                      : 0
                  )}
                </Text>
                <Text style={styles.summaryLabel}>Avg Mastery</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2x2x2 Matrix for phonics cards */}
        <View style={styles.gridContainer}>
          {Array.from({ length: phonicsRows }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.gridRow}>
              {Array.from({ length: phonicsGridColumns }, (_, colIndex) => {
                const lessonIndex = rowIndex * phonicsGridColumns + colIndex;
                const lesson = lessons[lessonIndex];
                return lesson ? (
                  <View key={lesson.id} style={styles.cardWrapper}>
                    <LetterCard
                      lesson={lesson}
                      progress={getProgressForLesson(lesson.id)}
                      onPress={() => handleLetterPress(lesson)}
                    />
                  </View>
                ) : (
                  <View key={`empty-${rowIndex}-${colIndex}`} style={styles.cardWrapper} />
                );
              })}
            </View>
          ))}
        </View>

        {/* Empty state */}
        {lessons.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔤</Text>
            <Text style={styles.emptyTitle}>No phonics lessons yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.purple,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.purpleLight,
  },
  cardWrapper: {
    flex: 1, // Equal distribution in 2x2x2 matrix
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
    // minHeight handled dynamically
  },
  letterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  letter: {
    fontWeight: '800',
    color: Colors.purple,
    // fontSize handled dynamically
  },
  letterSmall: {
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
    // fontSize handled dynamically
  },
  sound: {
    color: Colors.textSecondary,
    fontWeight: '500',
    // fontSize handled dynamically
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.purple,
    borderRadius: 2,
  },
  progressText: {
    color: Colors.purple,
    fontWeight: '600',
    // fontSize handled dynamically
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  exampleWord: {
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    // fontSize handled dynamically
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
