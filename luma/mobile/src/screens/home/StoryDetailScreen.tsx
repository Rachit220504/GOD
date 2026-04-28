import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Story } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { contentApi } from '../../services/api';

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
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: LEVEL_BG[story.readingLevel] ?? Colors.softBlue }]}>
        <Text style={styles.heroEmoji}>📖</Text>
        <Text style={styles.heroTitle}>{story.title}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroBadge}>{story.readingLevel}</Text>
          <Text style={styles.heroBadge}>⏱ {story.estimatedMins} min</Text>
          <Text style={styles.heroBadge}>📝 {story.wordCount} words</Text>
        </View>
        {story.tags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tagsRow}>
              {story.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
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
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
  },
  backText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '600' },
  hero: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    color: Colors.textPrimary,
  },
  tagsRow: { flexDirection: 'row', gap: Spacing.xs, paddingTop: Spacing.xs },
  tag: {
    backgroundColor: 'rgba(108,92,231,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.purple, fontWeight: '600' },
  content: {
    padding: Spacing.screen,
    gap: Spacing.md,
  },
  previewCard: { gap: Spacing.sm },
  previewLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  infoCard: { gap: Spacing.sm },
  infoTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, letterSpacing: 0.2 },
  readBtn: { marginTop: Spacing.sm },
});
