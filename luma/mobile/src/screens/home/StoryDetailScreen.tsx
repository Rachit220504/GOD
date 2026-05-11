import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Story } from '../../types';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { contentApi } from '../../services/api';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoryDetail'>;

const LEVEL_BG: Record<string, string> = {
  BEGINNER: Colors.successLight,
  ELEMENTARY: Colors.softBlue,
  INTERMEDIATE: Colors.lavender,
  ADVANCED: Colors.softPeach,
};

export function StoryDetailScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Responsive layout
  const { spacing, mScale, screenPadding, centeredContent, isTablet } = useResponsiveLayout();
  
  // Responsive font sizes
  const backTextSize = mScale(16, 0.3);
  const heroEmojiSize = mScale(48, 0.4);
  const heroTitleSize = mScale(isTablet ? 28 : 24, 0.35);
  const heroBadgeSize = mScale(14, 0.3);
  const tagTextSize = mScale(14, 0.3);
  const sectionTitleSize = mScale(20, 0.3);
  const previewTextSize = mScale(16, 0.3);
  const cardTitleSize = mScale(18, 0.3);
  const cardTextSize = mScale(14, 0.3);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await contentApi.getStory(storyId);
        setStory(data);
      } catch {
        Alert.alert('Error', 'Could not load this story. Please try again.', [
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [storyId]);

  if (isLoading) return <LoadingSpinner fullScreen message="Opening story..." />;
  if (!story) return null;

  return (
    <SafeScreen scrollable withPadding={false}>
      {/* Back */}
      <TouchableOpacity
        style={[styles.backBtn, { paddingVertical: spacing.sm, marginBottom: spacing.xs }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={[styles.backText, { fontSize: backTextSize }]}>← Back</Text>
      </TouchableOpacity>

      {/* On tablet: cap and centre all content */}
      <View style={isTablet ? [styles.tabletWrapper, centeredContent] : undefined}>
        {/* Hero */}
        <View style={[
          styles.hero, 
          { 
            backgroundColor: LEVEL_BG[story.readingLevel] ?? Colors.softBlue,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
          }
        ]}>
          <Text style={[styles.heroEmoji, { fontSize: heroEmojiSize }]}>📖</Text>
          <Text style={[styles.heroTitle, { fontSize: heroTitleSize }]}>{story.title}</Text>
          <View style={[styles.heroMeta, { gap: spacing.sm }]}>
            <Text style={[styles.heroBadge, { fontSize: heroBadgeSize }]}>{story.readingLevel}</Text>
            <Text style={[styles.heroBadge, { fontSize: heroBadgeSize }]}>⏱ {story.estimatedMins} min</Text>
            <Text style={[styles.heroBadge, { fontSize: heroBadgeSize }]}>📝 {story.wordCount} words</Text>
          </View>
          {story.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.tagsRow, { gap: spacing.sm, marginTop: spacing.sm }]}>
                {story.tags.map((t) => (
                  <View key={t} style={[
                    styles.tag,
                    { paddingHorizontal: spacing.md, paddingVertical: spacing.xs }
                  ]}>
                    <Text style={[styles.tagText, { fontSize: tagTextSize }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.content}>
          {/* Story preview */}
          <Card variant="elevated" style={styles.previewCard}>
            <Text style={styles.previewLabel}>Story Preview</Text>
            <Text style={styles.previewText} numberOfLines={5}>
              {story.body}
            </Text>
          </Card>

          {/* Word count info */}
          <Card variant="flat" style={styles.infoCard}>
            <Text style={styles.infoTitle}>📚 What you'll practise</Text>
            <Text style={styles.infoText}>
              This story has {story.syllableMap.length} highlighted words with syllable
              breakdowns to help you read them step by step.
            </Text>
          </Card>

          {/* CTA */}
          <Button
            label="Start Reading! 🚀"
            onPress={() => navigation.navigate('ReadingMode', { storyId: story.id })}
            fullWidth
            size="lg"
            style={styles.readBtn}
          />

          <Button
            label="Back to Library"
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
            size="md"
          />
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    // paddingHorizontal handled dynamically via screenPadding in inline styles
    // paddingVertical handled dynamically
  },
  backText: { color: Colors.purple, fontWeight: '600' },
  tabletWrapper: {
    overflow: 'hidden',
    borderRadius: 0,
  },
  hero: {
    alignItems: 'center',
    // paddingVertical, paddingHorizontal, gap handled dynamically
  },
  heroEmoji: {
    // fontSize handled dynamically
  },
  heroTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    // fontSize, lineHeight handled dynamically
  },
  heroMeta: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    // gap handled dynamically
  },
  heroBadge: {
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius.full,
    color: Colors.textPrimary,
    // fontSize, paddingHorizontal, paddingVertical handled dynamically
  },
  tagsRow: { 
    flexDirection: 'row',
    // gap, paddingTop handled dynamically
  },
  tag: {
    backgroundColor: 'rgba(108,92,231,0.1)',
    borderRadius: BorderRadius.sm,
    // paddingHorizontal, paddingVertical handled dynamically
  },
  tagText: { color: Colors.purple, fontWeight: '600' },
  content: {
    // padding, gap handled dynamically
  },
  previewCard: { 
    // gap handled dynamically
  },
  previewLabel: {
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    // fontSize handled dynamically
  },
  previewText: {
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    // fontSize, lineHeight handled dynamically
  },
  infoCard: { 
    // gap handled dynamically
  },
  infoTitle: { fontWeight: '700', color: Colors.textPrimary },
  infoText: { color: Colors.textSecondary, letterSpacing: 0.2 },
  readBtn: { 
    // marginTop handled dynamically
  },
});
