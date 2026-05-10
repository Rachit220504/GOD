// DEPRECATED: Replaced by unified GamificationScreen
import React from 'react';
import { View, Text } from 'react-native';

export function MyGrowingPlantScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>My Growing Plant has been replaced</Text>
    </View>
  );
}

// Keep empty exports for any old imports
export const PLANT_STAGES = [];
export function StageItem({
  stage,
  isReached,
  isNext,
}: {
  stage: typeof PLANT_STAGES[0];
  isReached: boolean;
  isNext: boolean;
}) {
  return (
    <View style={stageStyles.row}>
      <View style={[stageStyles.circle, isReached && stageStyles.circleReached]}>
        {isReached ? (
          <Text style={stageStyles.check}>✓</Text>
        ) : (
          <View style={[stageStyles.dot, isNext && stageStyles.dotNext]} />
        )}
      </View>
      <Text style={[stageStyles.name, isReached && stageStyles.nameReached]}>
        {stage.name}
      </Text>
    </View>
  );
}

const stageStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleReached: {
    backgroundColor: '#4CAF50',
  },
  check: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BDBDBD',
  },
  dotNext: {
    backgroundColor: '#FFB74D',
    width: 16,
    height: 16,
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  nameReached: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});

// Simple Plant Visualization
function PlantVisual({ wordsRead }: { wordsRead: number }) {
  const currentStage = PLANT_STAGES.findIndex((s, i) => {
    const next = PLANT_STAGES[i + 1];
    return wordsRead >= s.threshold && (!next || wordsRead < next.threshold);
  });

  const growth = Math.min(1, wordsRead / 25);

  return (
    <View style={plantStyles.container}>
      {/* Sun */}
      <View style={plantStyles.sun}>
        <View style={plantStyles.sunInner} />
      </View>

      {/* Plant container */}
      <View style={plantStyles.plantContainer}>
        {/* Stem with height based on growth */}
        <View style={[plantStyles.stem, { height: 60 + growth * 100 }]} />

        {/* Leaves based on stage */}
        {growth > 0.2 && (
          <>
            <View style={[plantStyles.leaf, plantStyles.leafLeft1]} />
            <View style={[plantStyles.leaf, plantStyles.leafRight1]} />
          </>
        )}
        {growth > 0.4 && (
          <>
            <View style={[plantStyles.leaf, plantStyles.leafLeft2]} />
            <View style={[plantStyles.leaf, plantStyles.leafRight2]} />
          </>
        )}
        {growth > 0.6 && (
          <>
            <View style={[plantStyles.leaf, plantStyles.leafLeft3]} />
            <View style={[plantStyles.leaf, plantStyles.leafRight3]} />
          </>
        )}

        {/* Flower at top */}
        {growth >= 1 && (
          <View style={plantStyles.flower}>
            <Text style={plantStyles.flowerEmoji}>🌻</Text>
          </View>
        )}
        {growth >= 0.8 && growth < 1 && (
          <View style={plantStyles.flower}>
            <Text style={plantStyles.flowerEmoji}>🌷</Text>
          </View>
        )}

        {/* Pot/soil */}
        <View style={plantStyles.soil} />
      </View>
    </View>
  );
}

const plantStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xl,
  },
  sun: {
    position: 'absolute',
    top: 20,
    right: 30,
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
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 200,
    position: 'relative',
  },
  stem: {
    width: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  leaf: {
    position: 'absolute',
    width: 40,
    height: 20,
    backgroundColor: '#66BB6A',
    borderRadius: 10,
  },
  leafLeft1: { left: -35, bottom: 80, transform: [{ rotate: '-20deg' }] },
  leafRight1: { right: -35, bottom: 100, transform: [{ rotate: '20deg' }] },
  leafLeft2: { left: -30, bottom: 120, transform: [{ rotate: '-15deg' }] },
  leafRight2: { right: -30, bottom: 140, transform: [{ rotate: '15deg' }] },
  leafLeft3: { left: -25, bottom: 160, transform: [{ rotate: '-10deg' }] },
  leafRight3: { right: -25, bottom: 180, transform: [{ rotate: '10deg' }] },
  flower: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
  },
  flowerEmoji: {
    fontSize: 40,
  },
  soil: {
    width: 120,
    height: 20,
    backgroundColor: '#8D6E63',
    borderRadius: 10,
    marginTop: -2,
  },
});

export function MyGrowingPlantScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, isLoading } = useProgressData(user?.id);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading your plant..." />;

  const wordsRead = stats?.totalWordsRead ?? 0;
  const lessonsDone = stats?.lettersLearned ?? 0;
  // Calculate XP today from weekly activity or use total points as fallback
  const today = new Date().toISOString().split('T')[0];
  const xpToday = stats?.weeklyActivity?.find((a) => a.date === today)?.wordsRead ?? 0;

  // Determine current and next stage
  let currentStageIndex = 0;
  for (let i = PLANT_STAGES.length - 1; i >= 0; i--) {
    if (wordsRead >= PLANT_STAGES[i].threshold) {
      currentStageIndex = i;
      break;
    }
  }

  const nextStage = PLANT_STAGES[currentStageIndex + 1];
  const wordsToNext = nextStage ? nextStage.threshold - wordsRead : 0;
  const progressPercent = nextStage
    ? Math.round((wordsRead / nextStage.threshold) * 100)
    : 100;

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Growing Plant 🌱</Text>
          <Text style={styles.subtitle}>Keep reading to grow your plant!</Text>
        </View>

        {/* Plant Visual Area */}
        <View style={styles.visualArea}>
          {/* Stages on left */}
          <View style={styles.stagesColumn}>
            {PLANT_STAGES.slice().reverse().map((stage, i) => {
              const actualIndex = PLANT_STAGES.length - 1 - i;
              const isReached = wordsRead >= stage.threshold;
              const isNext = actualIndex === currentStageIndex + 1;
              return (
                <StageItem
                  key={stage.name}
                  stage={stage}
                  isReached={isReached}
                  isNext={isNext}
                />
              );
            })}
          </View>

          {/* Plant visual on right */}
          <PlantVisual wordsRead={wordsRead} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: Colors.lavender }]}>
            <Text style={styles.statValue}>{wordsRead}</Text>
            <Text style={styles.statLabel}>Words Read</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{lessonsDone}</Text>
            <Text style={styles.statLabel}>Lessons Done</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.statValue, { color: '#F57C00' }]}>+{xpToday}</Text>
            <Text style={styles.statLabel}>XP Today</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {nextStage
              ? `Next: ${nextStage.name} blooms at ${nextStage.threshold} words!`
              : '🌻 Your plant is fully grown! Amazing!'}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.progressDetail}>
            {nextStage ? `${wordsRead} / ${nextStage.threshold} words` : 'Max growth reached!'}
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('ProgressMain')}
        >
          <Text style={styles.ctaText}>Keep Reading! 🌱</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screen,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  visualArea: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    minHeight: 280,
  },
  stagesColumn: {
    width: 100,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  progressText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressDetail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#4CAF50',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 100,
  },
});
