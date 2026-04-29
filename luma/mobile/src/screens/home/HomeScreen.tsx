import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, StoryListItem } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { contentApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  isTablet, SCREEN_PADDING, CONTENT_MAX_WIDTH, STORY_COLUMNS,
} from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: Colors.successLight,
  ELEMENTARY: Colors.softBlue,
  INTERMEDIATE: Colors.lavender,
  ADVANCED: Colors.softPeach,
};

const LEVEL_EMOJI: Record<string, string> = {
  BEGINNER: '🌱',
  ELEMENTARY: '📗',
  INTERMEDIATE: '📘',
  ADVANCED: '🏆',
};

function StoryCard({
  item,
  onPress,
}: {
  item: StoryListItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open story: ${item.title}`}
      activeOpacity={0.85}
    >
      <Card style={styles.storyCard} variant="elevated">
        {/* Level badge */}
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: LEVEL_COLORS[item.readingLevel] ?? Colors.softBlue },
          ]}
        >
          <Text style={styles.levelEmoji}>{LEVEL_EMOJI[item.readingLevel] ?? '📖'}</Text>
          <Text style={styles.levelText}>{item.readingLevel}</Text>
        </View>

        <Text style={styles.storyTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.topic && (
          <Text style={styles.storyTopic} numberOfLines={1}>
            📌 {item.topic}
          </Text>
        )}

        <View style={styles.storyMeta}>
          <Text style={styles.metaChip}>📝 {item.wordCount} words</Text>
          <Text style={styles.metaChip}>⏱ {item.estimatedMins} min</Text>
        </View>

        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.readBtnRow}>
          <Text style={styles.readBtnText}>Read Story →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchStories = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    if (!reset && !hasMore) return;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const result = await contentApi.listStories({
        page: currentPage,
        limit: 10,
        search: search.trim() || undefined,
        readingLevel: user?.readingLevel as 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED' | undefined,
      });

      if (reset) {
        setStories(result.items);
        setPage(2);
      } else {
        setStories((prev) => [...prev, ...result.items]);
        setPage((p) => p + 1);
      }
      setHasMore(result.page < result.totalPages);
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [search, page, hasMore, user?.readingLevel]);

  useEffect(() => {
    void fetchStories(true);
  }, [search]);

  useEffect(() => {
    void fetchStories(true);
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchStories(true);
    setIsRefreshing(false);
  };

  const timeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Parent/Educator view - redirect to appropriate dashboard
  if (user?.role === 'PARENT' || user?.role === 'EDUCATOR') {
    const isEducator = user?.role === 'EDUCATOR';
    return (
      <SafeScreen withPadding backgroundColor={Colors.cream}>
        <View style={styles.parentContainer}>
          <Text style={styles.parentEmoji}>{isEducator ? '🎓' : '👨‍👩‍👧‍👦'}</Text>
          <Text style={styles.parentTitle}>
            Welcome, {user?.displayName ?? (isEducator ? 'Teacher' : 'Parent')}!
          </Text>
          <Text style={styles.parentSubtitle}>
            {isEducator
              ? "Track your students' reading progress and help them grow."
              : "Track your child's reading progress and help them grow."}
          </Text>
          <TouchableOpacity
            style={styles.parentDashboardBtn}
            onPress={() => navigation.navigate('ParentDashboard')}
            accessibilityRole="button"
          >
            <Text style={styles.parentDashboardBtnText}>
              {isEducator ? '📊 Go to Student Dashboard' : '📊 Go to Parent Dashboard'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.parentHint}>
            You can also access this from the menu below
          </Text>
        </View>
      </SafeScreen>
    );
  }

  if (isLoading) {
    return (
      <SafeScreen scrollable={false}>
        <LoadingSpinner fullScreen message="Loading your stories..." />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen withPadding={false} scrollable={false}>
      {/* On tablets, cap list width and centre it */}
      <View style={isTablet
        ? { flex: 1, maxWidth: CONTENT_MAX_WIDTH, width: '100%', alignSelf: 'center' }
        : { flex: 1 }}
      >
        <FlatList
          key={String(STORY_COLUMNS)}
          data={stories}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          numColumns={STORY_COLUMNS}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.purple}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Greeting */}
              <View style={styles.greetingRow}>
                <View>
                  <Text style={styles.greeting}>
                    {timeOfDayGreeting()}, {user?.displayName ?? 'Reader'}! 👋
                  </Text>
                  <Text style={styles.greetingSubtitle}>What would you like to read today?</Text>
                </View>
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={() => navigation.navigate('GenerateStory')}
                  accessibilityLabel="Generate a new story with AI"
                >
                  <Text style={styles.generateEmoji}>✨</Text>
                </TouchableOpacity>
              </View>

              {/* Search bar */}
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stories..."
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  accessibilityLabel="Search stories"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {stories.length > 0 && (
                <Text style={styles.resultsCount}>
                  {stories.length} stor{stories.length === 1 ? 'y' : 'ies'} found
                </Text>
              )}

              {/* Parent Dashboard shortcut — only for PARENT / EDUCATOR */}
              {(user?.role === 'PARENT' || user?.role === 'EDUCATOR') && (
                <TouchableOpacity
                  style={styles.dashboardBanner}
                  onPress={() => navigation.navigate('ParentDashboard')}
                  accessibilityRole="button"
                  accessibilityLabel="Open Parent Dashboard"
                >
                  <Text style={styles.dashboardBannerEmoji}>👩‍👦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dashboardBannerTitle}>Parent Dashboard</Text>
                    <Text style={styles.dashboardBannerSubtitle}>
                      View reading progress, skills & tips
                    </Text>
                  </View>
                  <Text style={styles.dashboardBannerArrow}>→</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            // flex:1 lets each card fill its column in the 2-col tablet grid
            <View style={isTablet ? styles.tabletCardWrapper : undefined}>
              <StoryCard
                item={item}
                onPress={() => navigation.navigate('StoryDetail', { storyId: item.id })}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap ✨ to generate your first story with AI!
              </Text>
            </View>
          }
          onEndReached={() => { if (!isFetchingMore) void fetchStories(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingMore ? (
              <LoadingSpinner message="Loading more..." />
            ) : null
          }
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    flexShrink: 1,
    marginRight: Spacing.md,
  },
  greetingSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },
  generateBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  generateEmoji: { fontSize: 28 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    paddingVertical: Spacing.sm,
  },
  clearIcon: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    padding: Spacing.xs,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  storyCard: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  levelEmoji: { fontSize: 14 },
  levelText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  storyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  storyTopic: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  storyMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaChip: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.softBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.lavender,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.purple,
    fontWeight: '600',
  },
  readBtnRow: {
    marginTop: Spacing.xs,
  },
  readBtnText: {
    fontSize: FontSize.md,
    color: Colors.purple,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  dashboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.purpleLight,
  },
  dashboardBannerEmoji: { fontSize: 28 },
  dashboardBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.purple,
  },
  dashboardBannerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dashboardBannerArrow: {
    fontSize: FontSize.xl,
    color: Colors.purple,
    fontWeight: '700',
  },
  // Tablet-only styles
  columnWrapper: {
    gap: Spacing.md,
  },
  tabletCardWrapper: {
    flex: 1,
  },

  // Parent view styles
  parentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  parentEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  parentTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  parentSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  parentDashboardBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  parentDashboardBtnText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: '700',
  },
  parentHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
