import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList, StoryListItem, ContinueReadingStory } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { contentApi, progressApi, libraryApi, StoryWithProgress } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SCREEN_PADDING } from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReadingMode'>;

// ─── Story Card Component ─────────────────────────────────────────────────────

function StoryCard({
  story,
  onPress,
  isContinueReading = false,
}: {
  story: Partial<StoryListItem> & { id: string; title: string; completionPct?: number; readingLevel?: string };
  onPress: () => void;
  isContinueReading?: boolean;
}) {
  const getIllustration = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('garden') || lower.includes('flower') || lower.includes('tree')) return '🌸';
    if (lower.includes('magic') || lower.includes('wizard') || lower.includes('spell')) return '✨';
    if (lower.includes('dragon') || lower.includes('monster')) return '🐉';
    if (lower.includes('cat') || lower.includes('kitty')) return '🐱';
    if (lower.includes('dog') || lower.includes('puppy')) return '🐕';
    if (lower.includes('bird') || lower.includes('wing')) return '🐦';
    if (lower.includes('space') || lower.includes('star') || lower.includes('moon')) return '🚀';
    if (lower.includes('ocean') || lower.includes('sea') || lower.includes('fish')) return '🐠';
    if (lower.includes('forest') || lower.includes('wood')) return '🌲';
    if (lower.includes('castle') || lower.includes('king') || lower.includes('queen')) return '🏰';
    if (lower.includes('lion') || lower.includes('brave')) return '🦁';
    if (lower.includes('cloud') || lower.includes('sky')) return '☁️';
    return '📚';
  };

  const getBgColor = (title: string): string => {
    const colors = [Colors.lavender, Colors.softBlue, Colors.softPeach, '#E8F5E9', '#FFF8E1'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length]!;
  };

  const levelLabel = story.readingLevel === 'BEGINNER' ? 'Level 1' :
    story.readingLevel === 'ELEMENTARY' ? 'Level 2' :
      story.readingLevel === 'INTERMEDIATE' ? 'Level 3' : 'Level 4';

  const showLevel = story.readingLevel !== undefined;

  const completionPct = story.completionPct ?? 0;

  return (
    <TouchableOpacity style={styles.storyCard} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.storyThumb, { backgroundColor: getBgColor(story.title) }]}>
        <Text style={styles.thumbEmoji}>{getIllustration(story.title)}</Text>
      </View>
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
        {showLevel && <Text style={styles.storyLevel}>{levelLabel}</Text>}
        {completionPct > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${completionPct}%` }]} />
            <Text style={styles.progressText}>{completionPct}% complete</Text>
          </View>
        )}
        {isContinueReading && (
          <View style={styles.continueBadge}>
            <Text style={styles.continueText}>Continue Reading →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ReadingHubScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stories, setStories] = useState<StoryWithProgress[]>([]);
  const [continueReading, setContinueReading] = useState<ContinueReadingStory | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [storiesData, continueData] = await Promise.all([
        libraryApi.getStoriesWithProgress(user.id),
        progressApi.getContinueReading(user.id),
      ]);

      setStories(storiesData);
      setContinueReading(continueData);
    } catch (error) {
      console.error('Failed to load reading hub data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleStoryPress = (storyId: string) => {
    navigation.navigate('ReadingMode', { storyId });
  };

  const handleContinueReading = () => {
    if (continueReading) {
      navigation.navigate('ReadingMode', { storyId: continueReading.contentId });
    }
  };

  const handleGenerateStory = () => {
    navigation.navigate('GenerateStory');
  };

  if (isLoading) {
    return (
      <SafeScreen scrollable={false}>
        <LoadingSpinner fullScreen message="Loading your stories..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen withPadding={false} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📖</Text>
          <Text style={styles.title}>Reading Time</Text>
          <Text style={styles.subtitle}>Choose a story to read or create a new one!</Text>
        </View>

        {/* Continue Reading Section */}
        {continueReading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            <StoryCard
              story={{
                id: continueReading.contentId,
                title: continueReading.title,
                readingLevel: continueReading.readingLevel,
                completionPct: continueReading.completionPct,
              }}
              onPress={handleContinueReading}
              isContinueReading
            />
          </View>
        )}

        {/* All Stories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stories</Text>
          {stories.length > 0 ? (
            stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onPress={() => handleStoryPress(story.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>No stories yet!</Text>
              <Text style={styles.emptySubtext}>Generate your first story below</Text>
            </View>
          )}
        </View>

        {/* Generate New Story CTA */}
        <TouchableOpacity style={styles.generateCard} onPress={handleGenerateStory}>
          <Text style={styles.generateEmoji}>✨</Text>
          <Text style={styles.generateTitle}>Create New Story</Text>
          <Text style={styles.generateSubtext}>Let AI write a story just for you!</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SCREEN_PADDING,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  storyThumb: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  thumbEmoji: {
    fontSize: 36,
  },
  storyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  storyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  storyLevel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.purple,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  continueBadge: {
    marginTop: 4,
  },
  continueText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.purple,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.softBlue,
    borderRadius: BorderRadius.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  generateCard: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.md,
  },
  generateEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  generateTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  generateSubtext: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
