import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { phonicsApi } from '../../services/api';
import { PhonicsLesson, PhonicsProgress } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SCREEN_PADDING } from '../../utils/responsive';

// ─── Letter Card Component ──────────────────────────────────────────────────

interface LetterCardProps {
  lesson: PhonicsLesson;
  progress?: PhonicsProgress;
  onPress: () => void;
}

function LetterCard({ lesson, progress, onPress }: LetterCardProps) {
  const masteryLevel = progress?.masteryLevel ?? 0;
  const hasProgress = masteryLevel > 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: lesson.colorTheme }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${lesson.letter}, sound ${lesson.sound}`}
    >
      <View style={styles.letterContainer}>
        <Text style={styles.letter}>{lesson.letter}</Text>
        <Text style={styles.letterSmall}>{lesson.letter.toLowerCase()}</Text>
      </View>
      <Text style={styles.sound}>{lesson.sound}</Text>

      {/* Progress indicator */}
      {hasProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${masteryLevel}%` }]} />
          <Text style={styles.progressText}>{Math.round(masteryLevel)}%</Text>
        </View>
      )}

      {/* Example words */}
      <View style={styles.examplesRow}>
        {lesson.examples.slice(0, 3).map((word, i) => (
          <Text key={i} style={styles.exampleWord}>{word}</Text>
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
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
        ListHeaderComponent={
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
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <LetterCard
              lesson={item}
              progress={getProgressForLesson(item.id)}
              onPress={() => handleLetterPress(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔤</Text>
            <Text style={styles.emptyTitle}>No phonics lessons yet</Text>
          </View>
        }
      />
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
    flex: 1,
    padding: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  letterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  letter: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.purple,
  },
  letterSmall: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
  },
  sound: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    fontSize: FontSize.xs,
    color: Colors.purple,
    fontWeight: '600',
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  exampleWord: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
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
