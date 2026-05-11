import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, ReadingLevel } from '../../types';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { contentApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

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
  
  // Responsive layout
  const { spacing, mScale, screenPadding, formMaxWidth, centeredContent, isTablet } = useResponsiveLayout();
  
  // Responsive font sizes
  const backTextSize = mScale(16, 0.3);
  const headerEmojiSize = mScale(56, 0.4);
  const titleSize = mScale(isTablet ? 32 : 28, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const sectionLabelSize = mScale(14, 0.3);
  const inputLabelSize = mScale(14, 0.3);
  const suggestionTextSize = mScale(14, 0.3);
  const levelEmojiSize = mScale(16, 0.3);
  const levelLabelSize = mScale(14, 0.3);
  const wordChipTextSize = mScale(16, 0.3);
  const aiNoticeTextSize = mScale(14, 0.3);
  const hintTextSize = mScale(14, 0.3);
  
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
    if (isGenerating) return;
    
    if (!topic.trim() || topic.trim().length < 2) {
      setTopicError('Please enter a topic (at least 2 characters)');
      return;
    }
    setTopicError('');
    setIsGenerating(true);

    try {
      console.log('Generating story with topic:', topic.trim());
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
      // Note: Not setting isGenerating(false) here to avoid UI flash during navigation transition
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Story generation failed. Please try again.';
      console.error('Story generation failed:', msg);
      Alert.alert('Generation Failed', msg);
      setIsGenerating(false);
    }
  };

  return (
    <SafeScreen scrollable withKeyboard backgroundColor={Colors.cream}>
      <View style={[centeredContent, { width: '100%' }]}>
      {/* Back */}
      <TouchableOpacity
        style={[styles.backBtn, { paddingVertical: spacing.sm, marginBottom: spacing.xs }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
      >
        <Text style={[styles.backText, { fontSize: backTextSize }]}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={[styles.header, { paddingBottom: spacing.xl, gap: spacing.sm }]}>
        <Text style={[styles.headerEmoji, { fontSize: headerEmojiSize }]}>✨</Text>
        <Text style={[styles.title, { fontSize: titleSize }]}>Create Your Story</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleSize * 1.5 }]}>
          Tell our AI what you want to read about and we'll write a story just for you!
        </Text>
      </View>

      {/* Topic input */}
      <Text style={{ 
        marginBottom: spacing.sm, 
        fontSize: inputLabelSize, 
        fontWeight: '600', 
        color: Colors.textPrimary 
      }}>
        What should the story be about? *
      </Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        style={[styles.plainInput, 
          { 
            borderRadius: BorderRadius.lg,
            backgroundColor: Colors.white,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            fontSize: subtitleSize,
            marginBottom: spacing.md,
            minHeight: mScale(52, 0.2),
          },
          topicError && styles.plainInputError
        ]}
        placeholder="e.g. a brave little turtle..."
        autoCapitalize="none"
        maxLength={100}
      />
      {topicError && <Text style={{ color: Colors.error, marginBottom: spacing.lg }}>{topicError}</Text>}

      {/* Topic suggestions */}
      <Text style={[styles.sectionLabel, { fontSize: sectionLabelSize, marginBottom: spacing.md }]}>
        Or pick an idea:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.suggestionsRow,
          { gap: spacing.sm, paddingHorizontal: screenPadding, paddingVertical: spacing.xs }
        ]}
        style={[styles.suggestionsScroll, { marginBottom: spacing.xs, marginHorizontal: -screenPadding }]}
      >
        {TOPIC_SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.suggestion, 
              { 
                paddingHorizontal: spacing.md, 
                paddingVertical: spacing.sm,
              },
              topic === s.slice(2) && styles.suggestionSelected
            ]}
            onPress={() => setTopic(s.slice(2))}
          >
            <Text style={[styles.suggestionText, { fontSize: suggestionTextSize }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reading level */}
      <Text style={[styles.sectionLabel, { fontSize: sectionLabelSize, marginBottom: spacing.md, marginTop: spacing.xl }]}>
        Reading Level
      </Text>
      <View style={[styles.levelRow, { gap: spacing.sm }]}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[
              styles.levelChip, 
              { 
                paddingHorizontal: spacing.md, 
                paddingVertical: spacing.sm,
                gap: spacing.xs,
              },
              level === l.value && styles.levelChipSelected
            ]}
            onPress={() => setLevel(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: level === l.value }}
          >
            <Text style={[styles.levelEmoji, { fontSize: levelEmojiSize }]}>{l.emoji}</Text>
            <Text style={[
              styles.levelLabel, 
              { fontSize: levelLabelSize },
              level === l.value && styles.levelLabelSelected
            ]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Word count */}
      <Text style={[styles.sectionLabel, { fontSize: sectionLabelSize, marginBottom: spacing.md, marginTop: spacing.xl }]}>
        Story Length
      </Text>
      <View style={[styles.wordCountRow, { gap: spacing.sm }]}>
        {getWordCountOptions(level).map((w) => (
          <TouchableOpacity
            key={w}
            style={[
              styles.wordChip, 
              { paddingVertical: spacing.md },
              maxWords === w && styles.wordChipSelected
            ]}
            onPress={() => setMaxWords(w)}
          >
            <Text style={[
              styles.wordChipText, 
              { fontSize: wordChipTextSize },
              maxWords === w && styles.wordChipTextSelected
            ]}>
              {w}w
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI notice */}
      <Card variant="flat" style={[styles.aiNotice, { marginTop: spacing.xl }]}>
        <Text style={[styles.aiNoticeText, { fontSize: aiNoticeTextSize, lineHeight: aiNoticeTextSize * 1.6 }]}>
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
        style={[styles.generateBtn, { marginTop: spacing.xl }]}
      />

      {isGenerating && (
        <Text style={[styles.generatingHint, { fontSize: hintTextSize, marginTop: spacing.md }]}>
          This takes about 10-15 seconds. Sit tight! 🌟
        </Text>
      )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: { 
    // paddingVertical, marginBottom handled dynamically
  },
  backText: { color: Colors.purple, fontWeight: '600' },
  header: { 
    alignItems: 'center',
    // paddingBottom, gap handled dynamically
  },
  headerEmoji: { 
    // fontSize handled dynamically
  },
  title: {
    fontWeight: '800', 
    color: Colors.textPrimary,
    textAlign: 'center', 
    letterSpacing: -0.5,
    // fontSize handled dynamically
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center', 
    letterSpacing: 0.3,
    // fontSize, lineHeight handled dynamically
  },
  sectionLabel: {
    fontWeight: '700', 
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    // fontSize, marginBottom handled dynamically
  },
  suggestionsScroll: { 
    // marginBottom, marginHorizontal handled dynamically
  },
  suggestionsRow: {
    flexDirection: 'row',
    // gap, paddingHorizontal, paddingVertical handled dynamically
  },
  suggestion: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full, 
    borderWidth: 1.5, 
    borderColor: Colors.border,
    ...Shadow.sm,
    // paddingHorizontal, paddingVertical handled dynamically
  },
  suggestionSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  suggestionText: { color: Colors.textPrimary, fontWeight: '500' },
  levelRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    // gap handled dynamically
  },
  levelChip: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.white,
    borderWidth: 2, 
    borderColor: Colors.border, 
    ...Shadow.sm,
    // paddingHorizontal, paddingVertical, gap handled dynamically
  },
  levelChipSelected: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  levelEmoji: { 
    // fontSize handled dynamically
  },
  levelLabel: { fontWeight: '600', color: Colors.textPrimary },
  levelLabelSelected: { color: Colors.purple },
  wordCountRow: { 
    flexDirection: 'row',
    // gap handled dynamically
  },
  wordChip: {
    flex: 1, 
    borderRadius: BorderRadius.lg,
    alignItems: 'center', 
    backgroundColor: Colors.white,
    borderWidth: 2, 
    borderColor: Colors.border,
    // paddingVertical handled dynamically
  },
  wordChipSelected: { borderColor: Colors.orange, backgroundColor: Colors.softPeach },
  wordChipText: { fontWeight: '700', color: Colors.textSecondary },
  wordChipTextSelected: { color: Colors.orange },
  aiNotice: { 
    // marginTop handled dynamically
  },
  aiNoticeText: { 
    color: Colors.textSecondary, 
    letterSpacing: 0.2,
    // fontSize, lineHeight handled dynamically
  },
  aiNoticeHighlight: { color: Colors.purple, fontWeight: '700' },
  generateBtn: { 
    // marginTop handled dynamically
  },
  generatingHint: {
    textAlign: 'center', 
    color: Colors.textMuted,
    letterSpacing: 0.3,
    // fontSize, marginTop handled dynamically
  },
  plainInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    // borderRadius, backgroundColor, paddingHorizontal, paddingVertical, fontSize, marginBottom, minHeight handled dynamically
  },
  plainInputError: {
    borderColor: Colors.error,
  },
});
