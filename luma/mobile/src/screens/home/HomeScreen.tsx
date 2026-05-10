import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, StoryListItem, DayActivity, ContinueReadingStory } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { progressApi, libraryApi, profileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SCREEN_PADDING } from '../../utils/responsive';
import { PhonicsLesson } from '../../types';
import { phonicsApi } from '../../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

// ─── Weekly Day Circle Component ──────────────────────────────────────────────

function DayCircle({ day, hasRead, isToday }: { day: string; hasRead: boolean; isToday: boolean }) {
  return (
    <View style={styles.dayCircleContainer}>
      <View
        style={[
          styles.dayCircle,
          hasRead && styles.dayCircleActive,
          isToday && styles.dayCircleToday,
        ]}
      >
        {hasRead && <View style={styles.dayDot} />}
      </View>
      <Text style={[styles.dayLabel, hasRead && styles.dayLabelActive]}>{day}</Text>
    </View>
  );
}

// ─── Continue Reading Card Component ──────────────────────────────────────────

function ContinueReadingCard({
  story,
  onPress,
}: {
  story: ContinueReadingStory | null;
  onPress: () => void;
}) {
  if (!story) {
    return (
      <View style={styles.continueCard}>
        <View style={styles.continueCardLeft}>
          <View style={styles.mascotCircle}>
            <Text style={styles.mascotEmoji}>⭐</Text>
          </View>
        </View>
        <View style={styles.continueCardRight}>
          <Text style={styles.continueText}>Ready to start reading?</Text>
          <Text style={styles.continueSubtext}>Pick a story from the library below!</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.continueCardLeft}>
        <View style={styles.mascotCircle}>
          <Text style={styles.mascotEmoji}>📖</Text>
        </View>
      </View>
      <View style={styles.continueCardRight}>
        <Text style={styles.continueText}>
          Let&apos;s read <Text style={styles.continueStoryTitle}>&quot;{story.title}&quot;</Text> today!
        </Text>
        <TouchableOpacity style={styles.startReadingBtn} onPress={onPress}>
          <Text style={styles.startReadingText}>Start Reading →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Story Library Item Component ─────────────────────────────────────────────

function LibraryStoryItem({
  story,
  onPress,
}: {
  story: StoryListItem & { completionPct: number };
  onPress: () => void;
}) {
  // Get illustration emoji based on story title keywords
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
    return '📚';
  };

  // Get pastel background color
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

  return (
    <TouchableOpacity style={styles.libraryItem} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.storyThumb, { backgroundColor: getBgColor(story.title) }]}>
        <Text style={styles.thumbEmoji}>{getIllustration(story.title)}</Text>
      </View>
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
        <Text style={styles.storyLevel}>{levelLabel}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${story.completionPct}%` }]} />
        </View>
      </View>
      <Text style={styles.progressPercent}>{story.completionPct}%</Text>
    </TouchableOpacity>
  );
}

// ─── Phonics Preview Card Component ───────────────────────────────────────────

function PhonicsPreviewCard({
  lessons,
  onPress,
}: {
  lessons: PhonicsLesson[];
  onPress: () => void;
}) {
  const previewLessons = lessons.slice(0, 4);

  return (
    <TouchableOpacity style={styles.phonicsPreviewCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.phonicsGrid}>
        {previewLessons.map((lesson) => (
          <View key={lesson.id} style={[styles.phonicsPreviewItem, { backgroundColor: lesson.colorTheme }]}>
            <Text style={styles.phonicsPreviewLetter}>{lesson.letter}</Text>
            <Text style={styles.phonicsPreviewSmall}>{lesson.letter.toLowerCase()}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [continueReading, setContinueReading] = useState<ContinueReadingStory | null>(null);
  const [stories, setStories] = useState<(StoryListItem & { completionPct: number })[]>([]);
  const [phonicsLessons, setPhonicsLessons] = useState<PhonicsLesson[]>([]);
  const [streak, setStreak] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? 'Reader');

  const fetchAllData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch each data source individually with error handling
      let weeklyData: DayActivity[] = [];
      let continueData: ContinueReadingStory | null = null;
      let storiesData: (StoryListItem & { completionPct: number })[] = [];
      let phonicsData: PhonicsLesson[] = [];
      let profileData = null;

      try {
        weeklyData = await progressApi.getWeeklyActivity(user.id);
      } catch (e) {
        console.error('Failed to load weekly activity:', e);
      }

      try {
        continueData = await progressApi.getContinueReading(user.id);
      } catch (e) {
        console.error('Failed to load continue reading:', e);
      }

      try {
        storiesData = await libraryApi.getStoriesWithProgress(user.id) as (StoryListItem & { completionPct: number })[];
      } catch (e) {
        console.error('Failed to load stories:', e);
      }

      try {
        phonicsData = await phonicsApi.getLessons();
      } catch (e) {
        console.error('Failed to load phonics:', e);
      }

      try {
        profileData = await profileApi.getProfile(user.id);
      } catch (e) {
        console.error('Failed to load profile:', e);
      }

      setWeeklyActivity(weeklyData);
      setContinueReading(continueData);
      setStories(storiesData.slice(0, 3)); // Only show first 3 stories
      setPhonicsLessons(phonicsData);
      if (profileData) {
        setStreak(profileData.currentStreak);
        setDisplayName(profileData.displayName);
      }
    } catch (error) {
      console.error('Failed to load home screen data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  const timeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleContinueReading = () => {
    if (continueReading) {
      navigation.navigate('ReadingMode', { storyId: continueReading.contentId });
    }
  };

  const handleStoryPress = (storyId: string) => {
    navigation.navigate('StoryDetail', { storyId });
  };

  // Parent/Educator view - redirect to appropriate dashboard
  if (user?.role === 'PARENT' || user?.role === 'EDUCATOR') {
    const isEducator = user?.role === 'EDUCATOR';
    return (
      <SafeScreen withPadding backgroundColor={Colors.cream}>
        <View style={parentStyles.container}>
          <Text style={parentStyles.emoji}>{isEducator ? '🎓' : '👨‍👩‍👧‍👦'}</Text>
          <Text style={parentStyles.title}>
            Welcome, {displayName ?? (isEducator ? 'Teacher' : 'Parent')}!
          </Text>
          <Text style={parentStyles.subtitle}>
            {isEducator
              ? "Track your students' reading progress and help them grow."
              : "Track your child's reading progress and help them grow."}
          </Text>
          <TouchableOpacity
            style={parentStyles.dashboardBtn}
            onPress={() => navigation.navigate('ParentDashboard')}
            accessibilityRole="button"
          >
            <Text style={parentStyles.dashboardBtnText}>
              {isEducator ? '📊 Go to Student Dashboard' : '📊 Go to Parent Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  if (isLoading) {
    return (
      <SafeScreen scrollable={false}>
        <LoadingSpinner fullScreen message="Loading your reading day..." />
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
          <Text style={styles.greetingSmall}>{timeOfDayGreeting()}!</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{displayName}&apos;s Reading Day</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>⚡</Text>
              <Text style={styles.streakNumber}>{streak}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Day Circles */}
        <View style={styles.weeklyContainer}>
          {weeklyActivity.map((day, index) => (
            <DayCircle
              key={index}
              day={day.day}
              hasRead={day.hasRead}
              isToday={day.isToday}
            />
          ))}
        </View>

        {/* Continue Reading Card */}
        <ContinueReadingCard story={continueReading} onPress={handleContinueReading} />

        {/* Story Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Library</Text>
          <View style={styles.libraryContainer}>
            {stories.length > 0 ? (
              stories.map((story) => (
                <LibraryStoryItem
                  key={story.id}
                  story={story}
                  onPress={() => handleStoryPress(story.id)}
                />
              ))
            ) : (
              <TouchableOpacity
                style={styles.emptyLibraryCard}
                onPress={() => navigation.navigate('GenerateStory')}
              >
                <Text style={styles.emptyLibraryEmoji}>✨</Text>
                <Text style={styles.emptyLibraryText}>Generate your first story!</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phonics Practice Preview */}
        {phonicsLessons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phonics Practice</Text>
            <PhonicsPreviewCard
              lessons={phonicsLessons}
              onPress={() => navigation.navigate('Phonics')}
            />
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greetingSmall: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -0.5,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  dayCircleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: Colors.purple,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: Colors.purpleLight,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dayLabelActive: {
    color: Colors.purple,
    fontWeight: '700',
  },
  continueCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  continueCardLeft: {
    justifyContent: 'center',
  },
  mascotCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 32,
  },
  continueCardRight: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  continueText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  continueStoryTitle: {
    color: Colors.purple,
    fontWeight: '700',
  },
  continueSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  startReadingBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
  },
  startReadingText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  libraryContainer: {
    gap: Spacing.md,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  storyThumb: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 28,
  },
  storyInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  storyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storyLevel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.purple,
  },
  progressPercent: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  emptyLibraryCard: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyLibraryEmoji: {
    fontSize: 40,
  },
  emptyLibraryText: {
    fontSize: FontSize.md,
    color: Colors.purple,
    fontWeight: '700',
  },
  phonicsPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 4,
    ...Shadow.sm,
  },
  phonicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  phonicsPreviewItem: {
    width: '49.8%',
    aspectRatio: 1.5,
    borderRadius: BorderRadius.lg,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  phonicsPreviewLetter: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.purple,
  },
  phonicsPreviewSmall: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
  },
  bottomPadding: {
    height: 100,
  },
});

// ─── Parent View Styles ────────────────────────────────────────────────────────

const parentStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  dashboardBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  dashboardBtnText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: '700',
  },
});
