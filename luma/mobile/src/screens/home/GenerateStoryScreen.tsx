import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, ReadingLevel } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card } from '../../components/ui/Card';
import { contentApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'GenerateStory'>;

const LEVELS: { value: ReadingLevel; label: string; emoji: string }[] = [
  { value: 'BEGINNER', label: 'Beginner', emoji: '🌱' },
  { value: 'ELEMENTARY', label: 'Elementary', emoji: '📗' },
  { value: 'INTERMEDIATE', label: 'Intermediate', emoji: '📘' },
  { value: 'ADVANCED', label: 'Advanced', emoji: '🏆' },
];

const TOPIC_SUGGESTIONS = [
  '🦁 A brave lion', '🌈 A magical rainbow', '🚀 Space adventure',
  '🐉 Friendly dragon', '🌊 Ocean treasure', '🦋 A tiny butterfly',
  '🏔️ Mountain explorer', '🎵 Music and magic',
];

const WORD_COUNT_OPTIONS = [80, 120, 180, 250];

export function GenerateStoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<ReadingLevel>(
    (user?.readingLevel as ReadingLevel) ?? 'ELEMENTARY',
  );
  const [maxWords, setMaxWords] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicError, setTopicError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 2) {
      setTopicError('Please enter a topic (at least 2 characters)');
      return;
    }
    setTopicError('');
    setIsGenerating(true);

    try {
      const story = await contentApi.generateStory({
        topic: topic.trim(),
        readingLevel: level,
        ageGroup: user?.readingLevel === 'BEGINNER' ? '5-7' : '7-10',
        maxWords,
      });

      // Navigate directly to reading mode
      navigation.replace('ReadingMode', { storyId: story.id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Story generation failed. Please try again.';
      Alert.alert('Generation Failed', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeScreen scrollable withKeyboard backgroundColor={Colors.cream}>
      {/* Back */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>✨</Text>
        <Text style={styles.title}>Create Your Story</Text>
        <Text style={styles.subtitle}>
          Tell our AI what you want to read about and we'll write a story just for you!
        </Text>
      </View>

      {/* Topic input */}
      <InputField
        label="What should the story be about?"
        value={topic}
        onChangeText={setTopic}
        error={topicError}
        placeholder="e.g. a brave little turtle..."
        autoCapitalize="none"
        maxLength={100}
        required
      />

      {/* Topic suggestions */}
      <Text style={styles.sectionLabel}>Or pick an idea:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsRow}
        style={styles.suggestionsScroll}
      >
        {TOPIC_SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.suggestion, topic === s.slice(2) && styles.suggestionSelected]}
            onPress={() => setTopic(s.slice(2))}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reading level */}
      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Reading Level</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.levelChip, level === l.value && styles.levelChipSelected]}
            onPress={() => setLevel(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: level === l.value }}
          >
            <Text style={styles.levelEmoji}>{l.emoji}</Text>
            <Text style={[styles.levelLabel, level === l.value && styles.levelLabelSelected]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Word count */}
      <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Story Length</Text>
      <View style={styles.wordCountRow}>
        {WORD_COUNT_OPTIONS.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.wordChip, maxWords === w && styles.wordChipSelected]}
            onPress={() => setMaxWords(w)}
          >
            <Text style={[styles.wordChipText, maxWords === w && styles.wordChipTextSelected]}>
              {w}w
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI notice */}
      <Card variant="flat" style={styles.aiNotice}>
        <Text style={styles.aiNoticeText}>
          🤖 Our AI will write a story with{' '}
          <Text style={styles.aiNoticeHighlight}>syllable breakdowns</Text> for every tricky word,
          designed specifically for your reading level.
        </Text>
      </Card>

      {/* Generate */}
      <Button
        label={isGenerating ? 'Writing your story...' : 'Generate Story ✨'}
        onPress={handleGenerate}
        isLoading={isGenerating}
        fullWidth
        size="lg"
        style={styles.generateBtn}
      />

      {isGenerating && (
        <Text style={styles.generatingHint}>
          This takes about 10-15 seconds. Sit tight! 🌟
        </Text>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: { paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  backText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '600' },
  header: { alignItems: 'center', paddingBottom: Spacing.xl, gap: Spacing.sm },
  headerEmoji: { fontSize: 56 },
  title: {
    fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary,
    textAlign: 'center', letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 24, letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.md, letterSpacing: 0.3,
  },
  suggestionsScroll: { marginBottom: Spacing.xs, marginHorizontal: -Spacing.screen },
  suggestionsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.screen, paddingVertical: Spacing.xs,
  },
  suggestion: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    ...Shadow.sm,
  },
  suggestionSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  suggestionText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  levelRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  levelChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border, ...Shadow.sm,
  },
  levelChipSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  levelEmoji: { fontSize: 16 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  levelLabelSelected: { color: Colors.purple },
  wordCountRow: { flexDirection: 'row', gap: Spacing.sm },
  wordChip: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    alignItems: 'center', backgroundColor: Colors.white,
    borderWidth: 2, borderColor: Colors.border,
  },
  wordChipSelected: { borderColor: Colors.orange, backgroundColor: Colors.softPeach },
  wordChipText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  wordChipTextSelected: { color: Colors.orange },
  aiNotice: { marginTop: Spacing.xl },
  aiNoticeText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, letterSpacing: 0.2 },
  aiNoticeHighlight: { color: Colors.purple, fontWeight: '700' },
  generateBtn: { marginTop: Spacing.xl },
  generatingHint: {
    textAlign: 'center', fontSize: FontSize.sm, color: Colors.textMuted,
    marginTop: Spacing.md, letterSpacing: 0.3,
  },
});
