import React, {
  useEffect, useState, useRef, useCallback, useMemo, memo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Animated, Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Story, SyllableEntry } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useReadingComfort } from '../../contexts/ReadingComfortContext';
import { useAuth } from '../../contexts/AuthContext';
import { contentApi, progressApi } from '../../services/api';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReadingMode'>;

// ─── Word Breakdown Sheet ─────────────────────────────────────────────────────

const SYLLABLE_COLORS = [Colors.lavender, '#D4EDDA']; // purple and green from Figma

const WordBreakdownSheet = memo(function WordBreakdownSheet({
  entry,
  visible,
  onClose,
}: {
  entry: SyllableEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { spacing, mScale, wp, isTablet } = useResponsiveLayout();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 400,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [visible]);

  const speakWord = useCallback(() => {
    if (entry) {
      Speech.stop();
      Speech.speak(entry.word, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.6, // slower for dyslexic support
      });
    }
  }, [entry]);

  if (!entry) return null;

  // Responsive sizing
  const titleSize = mScale(18, 0.3);
  const wordDisplaySize = mScale(42, 0.4);
  const syllableTextSize = mScale(24, 0.35);
  const buttonTextSize = mScale(16, 0.3);
  const closeButtonSize = mScale(32, 0.2);
  const closeIconSize = mScale(16, 0.2);
  const sheetPadding = spacing.xl;
  const syllableBoxMaxWidth = isTablet ? 200 : wp(40);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={wb.overlay} onPress={onClose} activeOpacity={1}>
        <Animated.View
          style={[
            wb.sheet,
            { 
              transform: [{ translateY: slideAnim }],
              padding: sheetPadding,
              paddingBottom: spacing.xxl,
            }
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Close button */}
            <TouchableOpacity 
              style={[
                wb.closeButton,
                {
                  width: closeButtonSize,
                  height: closeButtonSize,
                  borderRadius: closeButtonSize / 2,
                  top: spacing.lg,
                  right: spacing.lg,
                }
              ]} 
              onPress={onClose}
            >
              <Text style={[wb.closeIcon, { fontSize: closeIconSize }]}>✕</Text>
            </TouchableOpacity>

            <Text style={[wb.title, { fontSize: titleSize, marginBottom: spacing.xl }]}>
              Word Breakdown
            </Text>

            {/* Large word display */}
            <Text style={[wb.wordDisplay, { fontSize: wordDisplaySize, marginBottom: spacing.xl }]}>
              {entry.word}
            </Text>

            {/* Syllable boxes side by side */}
            <View style={[wb.syllableRow, { gap: spacing.md, marginBottom: spacing.xl }]}>
              {entry.syllables.slice(0, 2).map((syl, i) => (
                <View
                  key={i}
                  style={[
                    wb.syllableBox,
                    { 
                      backgroundColor: SYLLABLE_COLORS[i % SYLLABLE_COLORS.length],
                      maxWidth: syllableBoxMaxWidth,
                      paddingVertical: spacing.lg,
                      paddingHorizontal: spacing.xl,
                      borderRadius: 16,
                    }
                  ]}
                >
                  <Text style={[
                    i === 0 ? wb.syllableTextPurple : wb.syllableTextGreen,
                    { fontSize: syllableTextSize }
                  ]}>
                    {syl}
                  </Text>
                </View>
              ))}
            </View>

            {/* Hear it slowly button */}
            <TouchableOpacity 
              style={[wb.hearSlowlyBtn, { paddingVertical: spacing.md }]} 
              onPress={speakWord}
            >
              <Text style={[wb.hearSlowlyText, { fontSize: buttonTextSize }]}>
                Hear it slowly
              </Text>
            </TouchableOpacity>
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
  const { minTouchSize } = useResponsiveLayout();
  
  return (
    <TouchableOpacity
      onPress={() => onPress(word)}
      activeOpacity={hasSyllable ? 0.6 : 1}
      accessibilityRole={hasSyllable ? 'button' : 'text'}
      accessibilityLabel={hasSyllable ? `${word} — tap for breakdown` : word}
      hitSlop={{ 
        top: Math.max(4, minTouchSize * 0.1), 
        bottom: Math.max(4, minTouchSize * 0.1), 
        left: Math.max(2, minTouchSize * 0.05), 
        right: Math.max(2, minTouchSize * 0.05) 
      }}
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

// ─── Background Color Options ─────────────────────────────────────────────────

const BG_OPTIONS = [
  { label: 'Warm', value: '#FDFBF7' },
  { label: 'Mint', value: '#F0FFF4' },
  { label: 'Lavender', value: '#F3F0FF' },
  { label: 'Peach', value: '#FFF5F0' },
  { label: 'White', value: '#FFFFFF' },
];

// ─── Display Settings Panel Component ─────────────────────────────────────────

const DisplaySettingsPanel = memo(function DisplaySettingsPanel() {
  const {
    fontSize, updateFontSize,
    lineHeight, updateLineHeight,
    backgroundColor, updateBackgroundColor,
  } = useReadingComfort();

  return (
    <View style={ds.container}>
      <Text style={ds.title}>Display Settings</Text>

      {/* Text Size */}
      <View style={ds.row}>
        <Text style={ds.label}>Text Size</Text>
        <View style={ds.controlGroup}>
          <TouchableOpacity
            style={ds.button}
            onPress={() => updateFontSize(fontSize - 2)}
          >
            <Text style={ds.buttonText}>−</Text>
          </TouchableOpacity>
          <Text style={ds.value}>{Math.round(fontSize)}</Text>
          <TouchableOpacity
            style={ds.button}
            onPress={() => updateFontSize(fontSize + 2)}
          >
            <Text style={ds.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Line Spacing */}
      <View style={ds.row}>
        <Text style={ds.label}>Line Spacing</Text>
        <View style={ds.controlGroup}>
          <TouchableOpacity
            style={ds.button}
            onPress={() => updateLineHeight(lineHeight - 0.2)}
          >
            <Text style={ds.buttonText}>−</Text>
          </TouchableOpacity>
          <Text style={ds.value}>{lineHeight.toFixed(1)}</Text>
          <TouchableOpacity
            style={ds.button}
            onPress={() => updateLineHeight(lineHeight + 0.2)}
          >
            <Text style={ds.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background */}
      <View style={ds.row}>
        <Text style={ds.label}>Background</Text>
      </View>
      <View style={ds.bgRow}>
        {BG_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              ds.bgOption,
              { backgroundColor: opt.value },
              backgroundColor === opt.value && ds.bgOptionSelected,
            ]}
            onPress={() => updateBackgroundColor(opt.value)}
          >
            <Text style={[
              ds.bgLabel,
              backgroundColor === opt.value && ds.bgLabelSelected,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// ─── Bottom Player Bar Component ──────────────────────────────────────────────

const BottomPlayerBar = memo(function BottomPlayerBar({
  isPlaying,
  onPlayPause,
  progress,
}: {
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number;
}) {
  return (
    <View style={bp.container}>
      <View style={bp.mascotCircle}>
        <Text style={bp.mascotEmoji}>⭐</Text>
      </View>
      <View style={bp.textContainer}>
        <Text style={bp.title}>Luma reads with you</Text>
        <View style={bp.progressBar}>
          <View style={[bp.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <TouchableOpacity style={bp.playButton} onPress={onPlayPause}>
        <Text style={bp.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  );
});

// ─── Main ReadingModeScreen ───────────────────────────────────────────────────

export function ReadingModeScreen({ route, navigation }: Props) {
  const { storyId } = route.params ?? {};
  const { user } = useAuth();
  const {
    fontSize, letterSpacing, lineHeight, backgroundColor, fontFamily,
    updateFontSize, updateLineHeight, updateBackgroundColor,
  } = useReadingComfort();

  // Responsive layout - MUST be called before any early returns
  const { spacing, mScale, screenPadding, readingMaxWidth, centeredContent, isTablet } = useResponsiveLayout();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SyllableEntry | null>(null);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  const [syllablesMode, setSyllablesMode] = useState(true);
  const [readWordIndices, setReadWordIndices] = useState<Set<number>>(new Set());
  const [helpCount, setHelpCount] = useState(0);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);

  // Handle syllables mode toggle with feedback
  const handleSyllablesToggle = useCallback(() => {
    const newMode = !syllablesMode;
    setSyllablesMode(newMode);
    
    // Show feedback to user
    const message = newMode 
      ? 'Syllables mode ON! Tap underlined words to see syllable breakdown.'
      : 'Syllables mode OFF! Words will be read normally.';
    
    // Simple alert for feedback
    Alert.alert('Syllables Mode', message, [{ text: 'OK', style: 'default' }]);
  }, [syllablesMode]);

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

    // Speak the word
    Speech.speak(word, { rate: 0.8, pitch: 1.0 });

    if (entry && syllablesMode) {
      setSelectedEntry(entry);
      setBreakdownVisible(true);
      setHelpCount((c) => c + 1);
    }
  }, [syllablesMode]);

  // Save session
  const saveSession = useCallback(async (finalWordsRead?: number) => {
    if (!story || !user || sessionSaved) return;
    setSessionSaved(true);
    Speech.stop();
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

  // Read story by paragraphs with progress synced to speech
  const readStoryByParagraphs = useCallback(() => {
    if (!story || !story.body) {
      setIsPlaying(false);
      return;
    }

    // Split story into paragraphs
    const paragraphs = story.body.split(/\n\n+/).filter(p => p.trim().length > 0);
    let currentParagraphIndex = 0;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    
    // Find which paragraph to start from based on currentWordIndex
    let wordCount = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraphWords = paragraphs[i].trim().split(/\s+/).length;
      if (wordCount + paragraphWords > currentWordIndex) {
        currentParagraphIndex = i;
        break;
      }
      wordCount += paragraphWords;
    }

    const readNextParagraph = () => {
      if (currentParagraphIndex >= paragraphs.length) {
        if (progressInterval) clearInterval(progressInterval);
        setIsPlaying(false);
        setReadingProgress(100);
        setCurrentWordIndex(totalWords);
        return;
      }

      const paragraph = paragraphs[currentParagraphIndex];
      const paragraphWords = paragraph.trim().split(/\s+/);
      
      // Update progress based on paragraph position
      const paragraphStartProgress = (wordCount / totalWords) * 100;
      const paragraphEndProgress = ((wordCount + paragraphWords.length) / totalWords) * 100;
      
      // Start progress at beginning of paragraph
      setReadingProgress(paragraphStartProgress);
      
      // Track speech progress with more accurate timing
      let speechStartTime = Date.now();
      let actualDuration = 0;
      let lastProgressUpdate = Date.now();
      
      // Calculate more accurate speech duration based on word count and speech rate
      const baseWordRate = 0.7; // Speech rate
      const avgWordsPerMinute = 150 * baseWordRate; // Average reading speed adjusted for speech rate
      const msPerWord = (60 / avgWordsPerMinute) * 1000; // Milliseconds per word
      const estimatedSpeechDuration = paragraphWords.length * msPerWord;
      
      // Update progress smoothly to match speech timing
      progressInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - speechStartTime;
        
        // Use a more natural progress curve (ease-in-out)
        let speechProgress = elapsed / estimatedSpeechDuration;
        if (speechProgress > 1) {
          speechProgress = 1;
        }
        
        // Apply ease-in-out function for more natural movement
        const easedProgress = speechProgress < 0.5 
          ? 2 * speechProgress * speechProgress 
          : 1 - Math.pow(-2 * speechProgress + 2, 2) / 2;
        
        const currentProgress = paragraphStartProgress + ((paragraphEndProgress - paragraphStartProgress) * easedProgress);
        setReadingProgress(Math.min(100, currentProgress));
        
        // Stop updating when we reach the end
        if (speechProgress >= 1) {
          clearInterval(progressInterval!);
          progressInterval = null;
        }
      }, 100); // Update every 100ms for smooth, synchronized animation

      // Speak the paragraph naturally
      Speech.speak(paragraph, {
        rate: 0.7,
        pitch: 1.0,
        onStart: () => {
          setIsPlaying(true);
          speechStartTime = Date.now();
        },
        onDone: () => {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          setReadingProgress(paragraphEndProgress);
          
          // Mark words in this paragraph as read
          setReadWordIndices(prev => {
            const next = new Set(prev);
            for (let i = wordCount; i < wordCount + paragraphWords.length; i++) {
              next.add(i);
            }
            return next;
          });
          
          wordCount += paragraphWords.length;
          currentParagraphIndex++;
          setCurrentWordIndex(wordCount);
          
          // Continue to next paragraph
          if (currentParagraphIndex < paragraphs.length) {
            setTimeout(readNextParagraph, 300); // Small pause between paragraphs
          } else {
            setIsPlaying(false);
            setReadingProgress(100);
            setCurrentWordIndex(totalWords);
          }
        },
        onStopped: () => {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          setIsPlaying(false);
        }
      });
    };

    readNextParagraph();
  }, [story, currentWordIndex, totalWords]);

  // Handle play/pause with paragraph-based reading
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
    } else {
      // Start reading from current position
      readStoryByParagraphs();
    }
  }, [isPlaying, readStoryByParagraphs]);

  // Reset reading progress when story changes
  useEffect(() => {
    setCurrentWordIndex(0);
    setReadingProgress(0);
    setIsPlaying(false);
  }, [story?.id]);

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
  
  // Responsive font sizes
  const headerLabelSize = mScale(14, 0.3);
  const headerTitleSize = mScale(isTablet ? 26 : 22, 0.35);
  const syllablesBtnTextSize = mScale(14, 0.3);
  const instructionSize = mScale(14, 0.3);

  return (
    <View style={[styles.root, { backgroundColor }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor, paddingHorizontal: screenPadding }]}>
        <Text style={[styles.headerLabel, { fontSize: headerLabelSize }]}>Reading Mode</Text>

        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { fontSize: headerTitleSize, flex: 1 }]} numberOfLines={1}>
            {story.title}
          </Text>
          <TouchableOpacity
            style={[
              styles.syllablesBtn,
              { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
              syllablesMode && styles.syllablesBtnActive
            ]}
            onPress={handleSyllablesToggle}
          >
            <Text style={[
              styles.syllablesBtnText,
              { fontSize: syllablesBtnTextSize },
              syllablesMode && styles.syllablesBtnTextActive
            ]}>
              {syllablesMode ? 'Syl·la·bles ✓' : 'Syl·la·bles'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Display Settings Panel ── */}
      <DisplaySettingsPanel />

      {/* ── Divider ── */}
      <View style={[styles.divider, { marginHorizontal: screenPadding }]} />

      {/* ── Instruction ── */}
      <Text style={[
        styles.instruction,
        { 
          fontSize: instructionSize,
          paddingVertical: spacing.sm,
          paddingHorizontal: screenPadding,
        }
      ]}>
        {syllablesMode 
          ? 'Tap any word to hear it. Underlined words have syllables - tap them to see breakdown!' 
          : 'Tap any word to hear it. Syllables mode is OFF - toggle it to see word breakdowns.'}
      </Text>

      {/* ── Reading area ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.readingArea,
          { 
            paddingHorizontal: screenPadding,
            paddingTop: spacing.xl,
            maxWidth: readingMaxWidth,
          },
          centeredContent,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
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

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>

      {/* ── Bottom Player Bar ── */}
      <BottomPlayerBar
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        progress={isPlaying ? readingProgress : progressPct}
      />

      {/* ── Word breakdown sheet ── */}
      <WordBreakdownSheet
        entry={selectedEntry}
        visible={breakdownVisible}
        onClose={() => setBreakdownVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: 52, // safe area - will be combined with dynamic paddingHorizontal
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    // paddingHorizontal handled dynamically
  },
  headerLabel: {
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    // fontSize handled dynamically
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -0.3,
    // fontSize and flex handled dynamically
  },
  syllablesBtn: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.lg,
    // padding handled dynamically
  },
  syllablesBtnActive: {
    backgroundColor: Colors.purple,
  },
  syllablesBtnText: {
    fontWeight: '600',
    color: Colors.purple,
    // fontSize handled dynamically
  },
  syllablesBtnTextActive: {
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    // marginHorizontal handled dynamically
  },
  instruction: {
    color: Colors.textMuted,
    textAlign: 'center',
    // fontSize, paddingVertical, paddingHorizontal handled dynamically
  },
  progressTrack: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: 4, backgroundColor: Colors.purple, borderRadius: 2 },
  readingArea: { 
    // paddingHorizontal, paddingTop, maxWidth handled dynamically
  },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.xl },
  word: { color: Colors.textPrimary },
  wordHighlighted: {
    color: Colors.purple,
    textDecorationLine: 'underline',
    textDecorationColor: Colors.purple,
    textDecorationStyle: 'solid',
    fontWeight: '700',
  },
  wordReadHighlighted: {
    color: Colors.success,
    textDecorationLine: 'underline',
    textDecorationColor: Colors.success,
    fontWeight: '700',
  },
  finishBtn: { marginTop: Spacing.xl },
  noStory: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.screen },
  noStoryTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  noStoryText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },

  // WordBreakdown sheet (wb prefix used inline)
});

// ─── DisplaySettings local styles ─────────────────────────────────────────────

const ds = StyleSheet.create({
  container: {
    // paddingHorizontal handled dynamically via screenPadding prop
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  bgRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  bgOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bgOptionSelected: {
    borderColor: Colors.purple,
    borderWidth: 2,
  },
  bgLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  bgLabelSelected: {
    color: Colors.purple,
    fontWeight: '700',
  },
});

// ─── BottomPlayer local styles ────────────────────────────────────────────────

const bp = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    // paddingHorizontal handled dynamically
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  mascotCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.purple,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.purple,
    borderRadius: 2,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: Colors.white,
  },
});

// ─── WordBreakdown local styles ───────────────────────────────────────────────

const wb = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    ...Shadow.lg,
    position: 'relative',
    // padding, paddingBottom handled dynamically in component
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // top, right, width, height, borderRadius handled dynamically in component
  },
  closeIcon: {
    color: Colors.textSecondary,
    fontWeight: '600',
    // fontSize handled dynamically
  },
  title: {
    fontWeight: '700',
    color: Colors.purple,
    // fontSize, marginBottom handled dynamically
  },
  wordDisplay: {
    fontWeight: '800',
    color: Colors.purple,
    textAlign: 'center',
    // fontSize, marginBottom handled dynamically
  },
  syllableRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    // gap, marginBottom handled dynamically
  },
  syllableBox: {
    flex: 1,
    alignItems: 'center',
    // maxWidth, paddingVertical, paddingHorizontal, borderRadius handled dynamically
  },
  syllableTextPurple: {
    fontWeight: '700',
    color: Colors.purple,
    // fontSize handled dynamically
  },
  syllableTextGreen: {
    fontWeight: '700',
    color: '#28A745',
    // fontSize handled dynamically
  },
  hearSlowlyBtn: {
    backgroundColor: '#F0E6FF',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    // paddingVertical handled dynamically
  },
  hearSlowlyText: {
    fontWeight: '600',
    color: Colors.purple,
    // fontSize handled dynamically
  },
});
