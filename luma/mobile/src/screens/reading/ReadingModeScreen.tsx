import React, {
  useEffect, useState, useRef, useCallback, useMemo, memo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Animated, Alert, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Story, SyllableEntry } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReadingControls } from '../../components/reading/ReadingControls';
import { FloatingActionButton } from '../../components/reading/FloatingActionButton';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';
import { useAuth } from '../../contexts/AuthContext';
import { contentApi, progressApi } from '../../services/api';
import { isTablet, centeredContent, SCREEN_PADDING } from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReadingMode'>;

const SCREEN_W = Dimensions.get('window').width;

// ─── Word Breakdown Sheet ─────────────────────────────────────────────────────

const SYLLABLE_COLORS = [Colors.purple, Colors.orange, Colors.success, Colors.softPeach];

const WordBreakdownSheet = memo(function WordBreakdownSheet({
  entry,
  visible,
  onClose,
}: {
  entry: SyllableEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 320,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [visible]);

  if (!entry) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={wb.overlay} onPress={onClose} activeOpacity={1}>
        <Animated.View
          style={[wb.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={wb.handle} />
            <Text style={wb.title}>Word Breakdown</Text>

            {/* Syllable pills */}
            <View style={wb.syllableRow}>
              {entry.syllables.map((syl, i) => (
                <View
                  key={i}
                  style={[wb.pill, { backgroundColor: SYLLABLE_COLORS[i % SYLLABLE_COLORS.length] }]}
                >
                  <Text style={wb.pillText}>{syl}</Text>
                </View>
              ))}
            </View>

            {/* Pronunciation */}
            <View style={wb.pronounceBox}>
              <Text style={wb.pronounceLabel}>🗣 Say it:</Text>
              <Text style={wb.pronounceText}>{entry.pronunciation}</Text>
            </View>

            {/* Chunk */}
            <View style={wb.chunkBox}>
              <Text style={wb.chunkLabel}>Put it together:</Text>
              <Text style={wb.chunkText}>{entry.chunks.join(' · ')}</Text>
            </View>

            <Button label="Got it! ✓" onPress={onClose} fullWidth size="md" style={{ marginTop: Spacing.lg }} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Word component — memoised to prevent re-renders ─────────────────────────

interface WordProps {
  word: string;
  hasSyllable: boolean;
  isRead: boolean;
  fontSize: number;
  letterSpacingMult: number;
  lineHeightMult: number;
  fontFamily: string | undefined;
  onPress: (word: string) => void;
  onLayout?: () => void;
}

const Word = memo(function Word({
  word,
  hasSyllable,
  isRead,
  fontSize,
  letterSpacingMult,
  lineHeightMult,
  fontFamily,
  onPress,
}: WordProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(word)}
      activeOpacity={hasSyllable ? 0.6 : 1}
      accessibilityRole={hasSyllable ? 'button' : 'text'}
      accessibilityLabel={hasSyllable ? `${word} — tap for breakdown` : word}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
    >
      <Text
        style={[
          styles.word,
          {
            fontSize,
            letterSpacing: fontSize * letterSpacingMult,
            lineHeight: fontSize * lineHeightMult,
            fontFamily: fontFamily || undefined,
            color: isRead ? Colors.textMuted : Colors.textPrimary,
          },
          hasSyllable && styles.wordHighlighted,
          isRead && hasSyllable && styles.wordReadHighlighted,
        ]}
      >
        {word}{' '}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Paragraph — memoised ─────────────────────────────────────────────────────

interface ParagraphProps {
  words: string[];
  syllableMap: Map<string, SyllableEntry>;
  readWordIndices: Set<number>;
  globalOffset: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  fontFamily: string | undefined;
  onWordPress: (word: string, globalIdx: number) => void;
}

const Paragraph = memo(function Paragraph({
  words,
  syllableMap,
  readWordIndices,
  globalOffset,
  fontSize,
  letterSpacing,
  lineHeight,
  fontFamily,
  onWordPress,
}: ParagraphProps) {
  return (
    <View style={styles.paragraph}>
      {words.map((word, localIdx) => {
        const globalIdx = globalOffset + localIdx;
        const clean = word.toLowerCase().replace(/[^a-z']/g, '');
        return (
          <Word
            key={`${globalOffset}-${localIdx}`}
            word={word}
            hasSyllable={syllableMap.has(clean)}
            isRead={readWordIndices.has(globalIdx)}
            fontSize={fontSize}
            letterSpacingMult={letterSpacing}
            lineHeightMult={lineHeight}
            fontFamily={fontFamily}
            onPress={(w) => onWordPress(w, globalIdx)}
          />
        );
      })}
    </View>
  );
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = memo(function ProgressBar({ pct }: { pct: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
});

// ─── Main ReadingModeScreen ───────────────────────────────────────────────────

export function ReadingModeScreen({ route, navigation }: Props) {
  const { storyId } = route.params ?? {};
  const { user } = useAuth();
  const { fontSize, letterSpacing, lineHeight, backgroundColor, fontFamily } = useReadingComfort();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SyllableEntry | null>(null);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [readWordIndices, setReadWordIndices] = useState<Set<number>>(new Set());
  const [helpCount, setHelpCount] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [startTime] = useState(Date.now());

  // Build lookup map from syllableMap array
  const syllableMap = useRef(new Map<string, SyllableEntry>());

  // Parse story body into paragraphs of words — memoised
  const paragraphWordArrays = useMemo<string[][]>(() => {
    if (!story) return [];
    return story.body
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0)
      .map((p) => p.trim().split(/\s+/).filter(Boolean));
  }, [story?.id]);

  // Compute global word offsets per paragraph
  const paragraphOffsets = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const words of paragraphWordArrays) {
      offsets.push(acc);
      acc += words.length;
    }
    return offsets;
  }, [paragraphWordArrays]);

  const totalWords = useMemo(
    () => paragraphWordArrays.reduce((s, p) => s + p.length, 0),
    [paragraphWordArrays],
  );

  const progressPct = useMemo(
    () => (totalWords > 0 ? Math.min(100, Math.round((readWordIndices.size / totalWords) * 100)) : 0),
    [readWordIndices.size, totalWords],
  );

  // Load story
  useEffect(() => {
    if (!storyId) { setIsLoading(false); return; }
    contentApi.getStory(storyId)
      .then((data) => {
        setStory(data);
        const map = new Map<string, SyllableEntry>();
        data.syllableMap.forEach((e) => map.set(e.word.toLowerCase(), e));
        syllableMap.current = map;
      })
      .catch(() => {
        Alert.alert('Could not load story', 'Please go back and try again.', [
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [storyId]);

  // Word press handler — memoised
  const handleWordPress = useCallback((word: string, globalIdx: number) => {
    const clean = word.toLowerCase().replace(/[^a-z']/g, '');
    const entry = syllableMap.current.get(clean);

    // Mark word as read
    setReadWordIndices((prev) => {
      const next = new Set(prev);
      next.add(globalIdx);
      return next;
    });

    if (entry) {
      setSelectedEntry(entry);
      setBreakdownVisible(true);
      setHelpCount((c) => c + 1);
    }
  }, []);

  // Save session
  const saveSession = useCallback(async (finalWordsRead?: number) => {
    if (!story || !user || sessionSaved) return;
    setSessionSaved(true);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const wRead = finalWordsRead ?? readWordIndices.size;
    const wpm = durationSeconds > 0 ? Math.round((wRead / durationSeconds) * 60) : 0;
    const completionPct = totalWords > 0 ? Math.min(100, Math.round((wRead / totalWords) * 100)) : 0;

    try {
      await progressApi.recordSession({
        contentId: story.id,
        wordsRead: wRead,
        wordsPerMinute: wpm,
        accuracyPercent: 85,
        completionPct,
        durationSeconds,
        helpRequestCount: helpCount,
        fontSizeUsed: fontSize,
        letterSpacingUsed: letterSpacing,
        lineHeightUsed: lineHeight,
        backgroundColorUsed: backgroundColor,
      });
    } catch { /* non-blocking */ }
  }, [story, user, sessionSaved, startTime, readWordIndices.size, helpCount, totalWords, fontSize, letterSpacing, lineHeight, backgroundColor]);

  // FAB actions
  const fabActions = useMemo(() => [
    {
      id: 'controls',
      emoji: '✨',
      label: 'Reading Controls',
      color: Colors.purple,
      onPress: () => setControlsVisible(true),
    },
    {
      id: 'done',
      emoji: '🏁',
      label: 'Finish & Save',
      color: Colors.success,
      onPress: async () => {
        await saveSession(totalWords);
        navigation.goBack();
      },
    },
    {
      id: 'back',
      emoji: '←',
      label: 'Go Back',
      color: Colors.textSecondary,
      onPress: () => {
        void saveSession();
        navigation.goBack();
      },
    },
  ], [saveSession, totalWords, navigation]);

  // ─── Render states ───────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner fullScreen message="Opening story..." />;

  if (!storyId || !story) {
    return (
      <SafeScreen backgroundColor={backgroundColor}>
        <View style={styles.noStory}>
          <Text style={{ fontSize: 60 }}>📖</Text>
          <Text style={styles.noStoryTitle}>No story selected</Text>
          <Text style={styles.noStoryText}>Go to Home and pick a story to read.</Text>
          <Button label="Go to Home" onPress={() => navigation.navigate('HomeScreen')} />
        </View>
      </SafeScreen>
    );
  }

  const fontFamilyVal = fontFamily !== 'System' ? fontFamily : undefined;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      {/* ── Fixed header ── */}
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity
          onPress={() => { void saveSession(); navigation.goBack(); }}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backText}>← Done</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{story.title}</Text>
          <Text style={styles.headerHint}>Tap any highlighted word for help</Text>
        </View>

        <View style={styles.progressPill}>
          <Text style={styles.progressPct}>{progressPct}%</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <ProgressBar pct={progressPct} />

      {/* ── Reading area ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.readingArea,
          { paddingBottom: 140 },
          isTablet && centeredContent,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        {paragraphWordArrays.map((words, pi) => (
          <Paragraph
            key={pi}
            words={words}
            syllableMap={syllableMap.current}
            readWordIndices={readWordIndices}
            globalOffset={paragraphOffsets[pi] ?? 0}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            lineHeight={lineHeight}
            fontFamily={fontFamilyVal}
            onWordPress={handleWordPress}
          />
        ))}

        {/* Finish button at bottom */}
        <Button
          label="I Finished Reading! 🎉"
          onPress={async () => { await saveSession(totalWords); navigation.goBack(); }}
          fullWidth
          size="lg"
          style={styles.finishBtn}
        />
      </ScrollView>

      {/* ── Word breakdown sheet ── */}
      <WordBreakdownSheet
        entry={selectedEntry}
        visible={breakdownVisible}
        onClose={() => setBreakdownVisible(false)}
      />

      {/* ── Reading controls sheet ── */}
      <ReadingControls
        visible={controlsVisible}
        onClose={() => setControlsVisible(false)}
      />

      {/* ── FAB ── */}
      <FloatingActionButton
        actions={fabActions}
        primaryEmoji="⚙️"
        primaryColor={Colors.purple}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingTop: 52, // safe area
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingVertical: Spacing.xs },
  backText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '700' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerHint: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  progressPill: {
    backgroundColor: Colors.lavender,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  progressPct: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.purple },
  progressTrack: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: 4, backgroundColor: Colors.purple, borderRadius: 2 },
  readingArea: { paddingHorizontal: SCREEN_PADDING, paddingTop: Spacing.xl },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.xl },
  word: { color: Colors.textPrimary },
  wordHighlighted: {
    color: Colors.purple,
    borderBottomWidth: 2,
    borderBottomColor: Colors.purpleLight,
    fontWeight: '600',
  },
  wordReadHighlighted: { color: Colors.textMuted, borderBottomColor: Colors.border },
  finishBtn: { marginTop: Spacing.xl },
  noStory: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.screen },
  noStoryTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  noStoryText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },

  // WordBreakdown sheet (wb prefix used inline)
});

// ─── WordBreakdown local styles ───────────────────────────────────────────────

const wb = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: 44,
    ...Shadow.lg,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
  syllableRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg },
  pill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, ...Shadow.sm },
  pillText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textOnDark, letterSpacing: 1 },
  pronounceBox: { backgroundColor: Colors.softBlue, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pronounceLabel: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  pronounceText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.5, flex: 1 },
  chunkBox: { backgroundColor: Colors.lavender, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs },
  chunkLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5 },
  chunkText: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 2 },
});
