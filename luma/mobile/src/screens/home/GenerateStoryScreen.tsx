import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput,
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

// Dynamic word count options based on reading level
const getWordCountOptions = (level: ReadingLevel): number[] => {
  switch (level) {
    case 'BEGINNER':
      return [50, 75, 100, 125]; // Shorter stories for beginners
    case 'ELEMENTARY':
      return [80, 120, 160, 200]; // Medium length for elementary
    case 'INTERMEDIATE':
      return [120, 180, 240, 300]; // Longer stories for intermediate
    case 'ADVANCED':
      return [180, 250, 350, 450]; // Longest stories for advanced
    default:
      return [80, 120, 180, 250]; // Fallback
  }
};

export function GenerateStoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<ReadingLevel>(
    (user?.readingLevel as ReadingLevel) ?? 'ELEMENTARY',
  );
  const [maxWords, setMaxWords] = useState(() => {
  const userLevel = (user?.readingLevel as ReadingLevel) ?? 'ELEMENTARY';
  const options = getWordCountOptions(userLevel);
  return options[1]; // Default to second option (medium length)
});
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicError, setTopicError] = useState('');

  // Update maxWords when level changes
  useEffect(() => {
    const options = getWordCountOptions(level);
    const currentOptionIndex = options.indexOf(maxWords);
    if (currentOptionIndex === -1) {
      // If current maxWords is not in the new options, set to second option
      setMaxWords(options[1]);
    }
  }, [level, maxWords]);

  const handleGenerate = async () => {
    if (!topic.trim() || topic.trim().length < 2) {
      setTopicError('Please enter a topic (at least 2 characters)');
      return;
    }
    setTopicError('');
    setIsGenerating(true);

    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Generating story attempt ${attempt}/${maxRetries} with topic:`, topic.trim());
        const story = await contentApi.generateStory({
          topic: topic.trim(),
          readingLevel: level,
          ageGroup: user?.readingLevel === 'BEGINNER' ? '5-7' : '7-10',
          maxWords,
        });
        console.log('Story generated successfully, ID:', story.id);

        // Navigate to reading mode with the new story
        // @ts-ignore - navigation typing issue
        navigation.navigate('ReadingMode', { storyId: story.id });
        console.log('Navigation called to ReadingMode with storyId:', story.id);
        return; // Success, exit the function
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error('Story generation failed');
        console.error(`Attempt ${attempt} failed:`, lastError.message);
        
        // If this is not the last attempt, wait a bit before retrying
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    const msg = lastError?.message || 'Story generation failed. Please try again.';
    Alert.alert('Generation Failed', `Failed to generate story after ${maxRetries} attempts. ${msg}`);
    setIsGenerating(false);
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
      <Text style={{ marginBottom: 8, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary }}>What should the story be about? *</Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        style={[styles.plainInput, topicError && styles.plainInputError]}
        placeholder="e.g. a brave little turtle..."
        autoCapitalize="none"
        maxLength={100}
      />
      {topicError && <Text style={{ color: Colors.error, marginBottom: 16 }}>{topicError}</Text>}

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
        {getWordCountOptions(level).map((w) => (
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
  plainInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    minHeight: 52,
  },
  plainInputError: {
    borderColor: Colors.error,
  },
});
