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
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { progressApi, libraryApi, profileApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';
import { PhonicsLesson } from '../../types';
import { phonicsApi } from '../../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

// ─── Weekly Day Circle Component ──────────────────────────────────────────────

function DayCircle({ day, hasRead, isToday }: { day: string; hasRead: boolean; isToday: boolean }) {
  const { spacing, mScale, minTouchSize } = useResponsiveLayout();
  
  // Responsive sizing
  const circleSize = mScale(40, 0.2);
  const dotSize = mScale(8, 0.2);
  const labelSize = mScale(12, 0.3);
  
  return (
    <View style={[styles.dayCircleContainer, { gap: spacing.xs }]}>
      <View
        style={[
          styles.dayCircle,
          hasRead && styles.dayCircleActive,
          isToday && styles.dayCircleToday,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
          },
        ]}
      >
        {hasRead && (
          <View style={[styles.dayDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
        )}
      </View>
      <Text style={[
        styles.dayLabel,
        hasRead && styles.dayLabelActive,
        { fontSize: labelSize }
      ]}>
        {day}
      </Text>
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
  const { spacing, mScale, isTablet } = useResponsiveLayout();
  
  // Responsive sizing
  const mascotSize = mScale(isTablet ? 70 : 60, 0.3);
  const emojiSize = mScale(isTablet ? 36 : 32, 0.3);
  const titleSize = mScale(isTablet ? 18 : 16, 0.3);
  const subtextSize = mScale(14, 0.3);
  
  if (!story) {
    return (
      <View style={[styles.continueCard, { padding: spacing.lg, gap: spacing.md }]}>
        <View style={styles.continueCardLeft}>
          <View style={[styles.mascotCircle, { width: mascotSize, height: mascotSize, borderRadius: mascotSize / 2 }]}>
            <Text style={[styles.mascotEmoji, { fontSize: emojiSize }]}>⭐</Text>
          </View>
        </View>
        <View style={[styles.continueCardRight, { gap: spacing.sm }]}>
          <Text style={[styles.continueText, { fontSize: titleSize }]}>Ready to start reading?</Text>
          <Text style={[styles.continueSubtext, { fontSize: subtextSize }]}>Pick a story from the library below!</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={[styles.continueCard, { padding: spacing.lg, gap: spacing.md }]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.continueCardLeft}>
        <View style={[styles.mascotCircle, { width: mascotSize, height: mascotSize, borderRadius: mascotSize / 2 }]}>
          <Text style={[styles.mascotEmoji, { fontSize: emojiSize }]}>📖</Text>
        </View>
      </View>
      <View style={[styles.continueCardRight, { gap: spacing.sm }]}>
        <Text style={[styles.continueText, { fontSize: titleSize, lineHeight: titleSize * 1.4 }]}>
          Let&apos;s read <Text style={styles.continueStoryTitle}>&quot;{story.title}&quot;</Text> today!
        </Text>
        <TouchableOpacity style={[styles.startReadingBtn, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]} onPress={onPress}>
          <Text style={[styles.startReadingText, { fontSize: subtextSize }]}>Start Reading →</Text>
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
  const { spacing, mScale, isTablet } = useResponsiveLayout();
  
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

  // Responsive sizing
  const thumbSize = mScale(isTablet ? 64 : 56, 0.3);
  const emojiSize = mScale(isTablet ? 32 : 28, 0.3);
  const titleSize = mScale(isTablet ? 18 : 16, 0.3);
  const levelSize = mScale(14, 0.3);
  const percentSize = mScale(14, 0.3);

  return (
    <TouchableOpacity 
      style={[styles.libraryItem, { padding: spacing.md, gap: spacing.md }]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <View style={[styles.storyThumb, { 
        backgroundColor: getBgColor(story.title),
        width: thumbSize,
        height: thumbSize,
        borderRadius: 12,
      }]}>
        <Text style={[styles.thumbEmoji, { fontSize: emojiSize }]}>{getIllustration(story.title)}</Text>
      </View>
      <View style={[styles.storyInfo, { gap: spacing.xs }]}>
        <Text style={[styles.storyTitle, { fontSize: titleSize }]} numberOfLines={1}>{story.title}</Text>
        <Text style={[styles.storyLevel, { fontSize: levelSize }]}>{levelLabel}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${story.completionPct}%` }]} />
        </View>
      </View>
      <Text style={[styles.progressPercent, { fontSize: percentSize, minWidth: mScale(35, 0.2) }]}>
        {story.completionPct}%
      </Text>
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
  const { spacing, mScale, wp } = useResponsiveLayout();
  const previewLessons = lessons.slice(0, 4);

  // Responsive font sizes
  const letterSize = mScale(40, 0.3);
  const smallSize = mScale(24, 0.3);

  return (
    <TouchableOpacity 
      style={[styles.phonicsPreviewCard, { padding: spacing.xs }]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={[styles.phonicsGrid, { gap: spacing.xs }]}>
        {previewLessons.map((lesson) => (
          <View 
            key={lesson.id} 
            style={[styles.phonicsPreviewItem, { 
              backgroundColor: lesson.colorTheme,
              width: wp(48), // ~48% width for 2 columns with gap
              aspectRatio: 1.5,
              borderRadius: 12,
              padding: spacing.xs,
              gap: spacing.xs,
            }]}
          >
            <Text style={[styles.phonicsPreviewLetter, { fontSize: letterSize }]}>{lesson.letter}</Text>
            <Text style={[styles.phonicsPreviewSmall, { fontSize: smallSize }]}>{lesson.letter.toLowerCase()}</Text>
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
  
  // Responsive layout
  const { spacing, mScale, screenPadding, centeredContent, isTablet } = useResponsiveLayout();

  // Data states
  const [weeklyActivity, setWeeklyActivity] = useState<DayActivity[]>([]);
  const [continueReading, setContinueReading] = useState<ContinueReadingStory | null>(null);
  const [stories, setStories] = useState<(StoryListItem & { completionPct: number })[]>([]);
  const [phonicsLessons, setPhonicsLessons] = useState<PhonicsLesson[]>([]);
  const [streak, setStreak] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? 'Reader');
  
  // Responsive font sizes for main content
  const greetingSize = mScale(16, 0.3);
  const titleSize = mScale(isTablet ? 28 : 24, 0.35);
  const sectionTitleSize = mScale(isTablet ? 22 : 20, 0.3);
  const streakNumberSize = mScale(16, 0.3);

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
        <ParentView
          displayName={displayName}
          isEducator={isEducator}
          onNavigate={() => navigation.navigate('ParentDashboard')}
        />
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
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingHorizontal: screenPadding,
            paddingTop: spacing.xl,
          },
          centeredContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <Text style={[styles.greetingSmall, { fontSize: greetingSize, marginBottom: spacing.xs }]}>
            {timeOfDayGreeting()}!
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { fontSize: titleSize, flex: 1 }]}>
              {displayName}&apos;s Reading Day
            </Text>
            <View style={[
              styles.streakBadge,
              { 
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                gap: spacing.xs,
              }
            ]}>
              <Text style={styles.streakIcon}>⚡</Text>
              <Text style={[styles.streakNumber, { fontSize: streakNumberSize }]}>{streak}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Day Circles */}
        <View style={[
          styles.weeklyContainer,
          { 
            marginBottom: spacing.lg,
            paddingHorizontal: spacing.xs,
          }
        ]}>
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
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.md }]}>
            Story Library
          </Text>
          <View style={[styles.libraryContainer, { gap: spacing.md }]}>
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
                style={[styles.emptyLibraryCard, { padding: spacing.xl, gap: spacing.sm }]}
                onPress={() => navigation.navigate('GenerateStory')}
              >
                <Text style={[styles.emptyLibraryEmoji, { fontSize: mScale(40, 0.3) }]}>✨</Text>
                <Text style={[styles.emptyLibraryText, { fontSize: mScale(16, 0.3) }]}>
                  Generate your first story!
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Phonics Practice Preview */}
        {phonicsLessons.length > 0 && (
          <View style={[styles.section, { marginBottom: spacing.xl }]}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.md }]}>
              Phonics Practice
            </Text>
            <PhonicsPreviewCard
              lessons={phonicsLessons}
              onPress={() => navigation.navigate('Phonics')}
            />
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={[styles.bottomPadding, { height: mScale(100, 0.2) }]} />
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    // Padding handled dynamically via screenPadding
    // Top padding handled dynamically
  },
  header: {
    // Margin handled dynamically
  },
  greetingSmall: {
    color: Colors.textSecondary,
    // Font size and margin handled dynamically
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -0.5,
    // Font size and flex handled dynamically
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.full,
    // Padding and gap handled dynamically
  },
  streakIcon: {
    fontSize: 16,
  },
  streakNumber: {
    fontWeight: '700',
    color: Colors.textPrimary,
    // Font size handled dynamically
  },
  weeklyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // Margin and padding handled dynamically
  },
  dayCircleContainer: {
    alignItems: 'center',
    // Gap handled dynamically
  },
  dayCircle: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    // Size handled dynamically in component
  },
  dayCircleActive: {
    backgroundColor: Colors.purple,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: Colors.purpleLight,
  },
  dayDot: {
    backgroundColor: Colors.white,
    // Size handled dynamically in component
  },
  dayLabel: {
    color: Colors.textMuted,
    fontWeight: '500',
    // Font size handled dynamically
  },
  dayLabelActive: {
    color: Colors.purple,
    fontWeight: '700',
  },
  continueCard: {
    flexDirection: 'row',
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    // Padding, gap, margin handled dynamically
  },
  continueCardLeft: {
    justifyContent: 'center',
  },
  mascotCircle: {
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    // Size handled dynamically in component
  },
  mascotEmoji: {
    // Font size handled dynamically
  },
  continueCardRight: {
    flex: 1,
    justifyContent: 'center',
    // Gap handled dynamically
  },
  continueText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    // Font size and lineHeight handled dynamically
  },
  continueStoryTitle: {
    color: Colors.purple,
    fontWeight: '700',
  },
  continueSubtext: {
    color: Colors.textSecondary,
    // Font size handled dynamically
  },
  startReadingBtn: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    // Padding handled dynamically
  },
  startReadingText: {
    color: Colors.white,
    fontWeight: '700',
    // Font size handled dynamically
  },
  section: {
    // Margin handled dynamically
  },
  sectionTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
    // Font size and margin handled dynamically
  },
  libraryContainer: {
    // Gap handled dynamically
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    // Padding and gap handled dynamically
  },
  storyThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    // Size and borderRadius handled dynamically in component
  },
  thumbEmoji: {
    // Font size handled dynamically
  },
  storyInfo: {
    flex: 1,
    // Gap handled dynamically
  },
  storyTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    // Font size handled dynamically
  },
  storyLevel: {
    color: Colors.textSecondary,
    // Font size handled dynamically
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
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'right',
    // Font size and minWidth handled dynamically
  },
  emptyLibraryCard: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    // Padding and gap handled dynamically
  },
  emptyLibraryEmoji: {
    // Font size handled dynamically
  },
  emptyLibraryText: {
    color: Colors.purple,
    fontWeight: '700',
    // Font size handled dynamically
  },
  phonicsPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    // Padding handled dynamically
  },
  phonicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Gap handled dynamically
  },
  phonicsPreviewItem: {
    alignItems: 'center',
    justifyContent: 'center',
    // Width, aspectRatio, borderRadius, padding, gap handled dynamically
  },
  phonicsPreviewLetter: {
    fontWeight: '800',
    color: Colors.purple,
    // Font size handled dynamically
  },
  phonicsPreviewSmall: {
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
    // Font size handled dynamically
  },
  bottomPadding: {
    // Height handled dynamically
  },
});

// ─── Parent View Styles ────────────────────────────────────────────────────────

function ParentView({ 
  displayName, 
  isEducator, 
  onNavigate 
}: { 
  displayName: string | null; 
  isEducator: boolean; 
  onNavigate: () => void;
}) {
  const { spacing, mScale, centeredContent } = useResponsiveLayout();
  
  // Responsive font sizes
  const emojiSize = mScale(64, 0.4);
  const titleSize = mScale(24, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const buttonTextSize = mScale(16, 0.3);
  
  return (
    <View style={[
      parentStyles.container,
      { padding: spacing.xxl },
      centeredContent,
    ]}>
      <Text style={[parentStyles.emoji, { fontSize: emojiSize, marginBottom: spacing.lg }]}>
        {isEducator ? '🎓' : '👨‍👩‍👧‍👦'}
      </Text>
      <Text style={[
        parentStyles.title,
        { fontSize: titleSize, marginBottom: spacing.md }
      ]}>
        Welcome, {displayName ?? (isEducator ? 'Teacher' : 'Parent')}!
      </Text>
      <Text style={[
        parentStyles.subtitle,
        { 
          fontSize: subtitleSize, 
          marginBottom: spacing.xl,
          lineHeight: subtitleSize * 1.5,
        }
      ]}>
        {isEducator
          ? "Track your students' reading progress and help them grow."
          : "Track your child's reading progress and help them grow."}
      </Text>
      <TouchableOpacity
        style={[
          parentStyles.dashboardBtn,
          { 
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
          }
        ]}
        onPress={onNavigate}
        accessibilityRole="button"
      >
        <Text style={[parentStyles.dashboardBtnText, { fontSize: buttonTextSize }]}>
          {isEducator ? '📊 Go to Student Dashboard' : '📊 Go to Parent Dashboard'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const parentStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Padding handled dynamically
  },
  emoji: {
    // Font size and margin handled dynamically
  },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    // Font size and margin handled dynamically
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    // Font size, margin, lineHeight handled dynamically
  },
  dashboardBtn: {
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.lg,
    // Padding handled dynamically
  },
  dashboardBtnText: {
    color: Colors.white,
    fontWeight: '700',
    // Font size handled dynamically
  },
});
