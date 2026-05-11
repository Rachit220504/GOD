import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { phonicsApi } from '../../services/api';
import { PhonicsLesson, PhonicsProgress } from '../../types';
import { Colors, BorderRadius, Shadow } from '../../constants/theme';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';
import * as Speech from 'expo-speech';

// ─── Letter Circle in Selector ────────────────────────────────────────────────

function LetterCircle({
  letter,
  isSelected,
  onPress,
  size,
  fontSize,
}: {
  letter: string;
  isSelected: boolean;
  onPress: () => void;
  size: number;
  fontSize: number;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.letterCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        isSelected && styles.letterCircleSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.letterCircleText,
        { fontSize },
        isSelected && styles.letterCircleTextSelected
      ]}>
        {letter}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Word Option Button ─────────────────────────────────────────────────────

function WordOption({
  word,
  isCorrect,
  isSelected,
  showResult,
  onPress,
  width,
  fontSize,
}: {
  word: string;
  isCorrect: boolean;
  isSelected: boolean;
  showResult: boolean;
  onPress: () => void;
  width: string;
  fontSize: number;
}) {
  // Determine button style based on state
  const getButtonStyle = () => {
    if (showResult) {
      // Results are shown - display final state
      if (isCorrect) return [styles.wordButton, styles.wordButtonCorrect];
      if (isSelected && !isCorrect) return [styles.wordButton, styles.wordButtonWrong];
      return [styles.wordButton, styles.wordButtonDimmed];
    } else {
      // Results not shown yet - show selection state
      if (isSelected) return [styles.wordButton, styles.wordButtonSelected];
      return styles.wordButton;
    }
  };

  const getTextStyle = () => {
    if (showResult) {
      // Results are shown - display final state
      if (isCorrect) return [styles.wordButtonText, styles.wordButtonTextCorrect];
      if (isSelected && !isCorrect) return [styles.wordButtonText, styles.wordButtonTextWrong];
      return [styles.wordButtonText, styles.wordButtonTextDimmed];
    } else {
      // Results not shown yet - show selection state
      if (isSelected) return [styles.wordButtonText, styles.wordButtonTextSelected];
      return styles.wordButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        { width }
      ]}
      onPress={onPress}
      activeOpacity={showResult ? 1 : 0.7}
      disabled={showResult}
    >
      <Text style={[getTextStyle(), { fontSize }]}>{word}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PhonicsPracticeScreen() {
  // Responsive layout
  const { 
    spacing, 
    mScale, 
    screenPadding, 
    isTablet
  } = useResponsiveLayout();
  
  // Responsive font sizes
  const titleSize = mScale(isTablet ? 32 : 28, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const bigLetterSize = mScale(isTablet ? 96 : 72, 0.3);
  const smallLetterSize = mScale(isTablet ? 32 : 24, 0.3);
  const displayLetterSize = mScale(isTablet ? 160 : 120, 0.3);
  const soundTextSize = mScale(isTablet ? 32 : 24, 0.3);
  const gamePromptSize = mScale(isTablet ? 20 : 16, 0.3);
  const wordButtonTextSize = mScale(isTablet ? 20 : 16, 0.3);
  const letterCircleFontSize = mScale(isTablet ? 20 : 16, 0.3);
  const letterCircleSize = mScale(isTablet ? 56 : 44, 0.2);
  
  // Calculate grid columns for word buttons (2x2 matrix)
  const wordColumns = 2;
  
  const [lessons, setLessons] = useState<PhonicsLesson[]>([]);
  const [progress, setProgress] = useState<PhonicsProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Word game state
  const [gameWords, setGameWords] = useState<{ word: string; isCorrect: boolean }[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  
    
  
  const fetchData = useCallback(async () => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        phonicsApi.getLessons(),
        phonicsApi.getMyProgress(),
      ]);
      setLessons(lessonsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load phonics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Setup word game when lesson changes
  useEffect(() => {
    if (lessons.length === 0) return;

    const lesson = lessons[selectedIndex]!;
    if (!lesson) return;

    // Mix 2 correct words with 2 wrong words
    const correct = lesson.examples.slice(0, 2).map((w) => ({ word: w, isCorrect: true }));
    const wrong = lesson.wrongExamples?.slice(0, 2).map((w) => ({ word: w, isCorrect: false })) ?? [
      { word: 'cat', isCorrect: false },
      { word: 'dog', isCorrect: false },
    ];

    // Shuffle
    const mixed = [...correct, ...wrong].sort(() => Math.random() - 0.5);
    setGameWords(mixed);
    setSelectedWords(new Set());
    setShowResults(false);
  }, [selectedIndex, lessons]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleLetterSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleHearIt = () => {
    const lesson = lessons[selectedIndex];
    if (!lesson) return;

    // First speak the letter, then the sound, then examples
    // Use pauses and slower rate for better learning
    Speech.speak(`The letter ${lesson.letter}.`, {
      rate: 0.6,
      pitch: 1.0,
      onDone: () => {
        setTimeout(() => {
          Speech.speak(`Makes the sound: ${lesson.sound}.`, {
            rate: 0.5,
            pitch: 1.1,
            onDone: () => {
              setTimeout(() => {
                Speech.speak(`Listen: ${lesson.examples.join(', ')}.`, {
                  rate: 0.7,
                  pitch: 1.0,
                });
              }, 500);
            },
          });
        }, 300);
      },
    });
  };

  const handleWordPress = (word: string) => {
    if (showResults) return;

    const wordData = gameWords.find(w => w.word === word);
    if (!wordData) return;

    const newSelected = new Set(selectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setSelectedWords(newSelected);

    // Check if all correct words are selected
    const correctWords = gameWords.filter((w) => w.isCorrect).map((w) => w.word);
    const allCorrectSelected = correctWords.every((w) => newSelected.has(w));

    // Check if user has selected any wrong words
    const selectedWrongWords = Array.from(newSelected).filter(selectedWord => {
      const selectedData = gameWords.find(w => w.word === selectedWord);
      return selectedData && !selectedData.isCorrect;
    });

    if (allCorrectSelected && newSelected.size >= correctWords.length && selectedWrongWords.length === 0) {
      // Success! All correct words selected, no wrong words
      setShowResults(true);
      // Record success
      const lesson = lessons[selectedIndex];
      if (lesson) {
        void phonicsApi.recordPractice(lesson.id, true);
      }
    } else if (selectedWrongWords.length > 0 && newSelected.size >= correctWords.length + 1) {
      // User has selected wrong words - show results immediately
      setShowResults(true);
      // Record failure
      const lesson = lessons[selectedIndex];
      if (lesson) {
        void phonicsApi.recordPractice(lesson.id, false);
      }
    }
  };

  const getProgressForLesson = (lessonId: string) => {
    return progress.find((p) => p.lessonId === lessonId);
  };

  if (isLoading) {
    return (
      <SafeScreen scrollable={false}>
        <LoadingSpinner fullScreen message="Loading phonics practice..." />
      </SafeScreen>
    );
  }

  const currentLesson = lessons[selectedIndex];

  if (!currentLesson) {
    return (
      <SafeScreen>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔤</Text>
          <Text style={styles.emptyTitle}>No phonics lessons available</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen withPadding={false} scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: screenPadding }
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Phonics Practice</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Trace letter, then tap right words</Text>
        </View>

        {/* Letter Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.letterSelector,
            { gap: spacing.sm, marginBottom: spacing.lg, paddingVertical: spacing.xs }
          ]}
        >
          {lessons.map((lesson, index) => (
            <LetterCircle
              key={lesson.id}
              letter={lesson.letter}
              isSelected={index === selectedIndex}
              onPress={() => handleLetterSelect(index)}
              size={letterCircleSize}
              fontSize={letterCircleFontSize}
            />
          ))}
        </ScrollView>

        {/* Main Lesson Card */}
        <View style={[
          styles.lessonCard,
          { 
            backgroundColor: currentLesson.colorTheme,
            borderRadius: BorderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            gap: spacing.lg
          }
        ]}>
          <View style={[styles.lessonCardLeft, { alignItems: 'center', justifyContent: 'center', minWidth: 80 }]}>
            <Text style={[styles.bigLetter, { fontSize: bigLetterSize }]}>{currentLesson.letter}</Text>
            <Text style={[styles.smallLetter, { fontSize: smallLetterSize }]}>{currentLesson.letter.toLowerCase()}</Text>
          </View>
          <View style={[styles.lessonCardRight, { flex: 1, gap: spacing.sm }]}>
            <View style={[
              styles.soundBox,
              {
                backgroundColor: Colors.white,
                borderRadius: BorderRadius.lg,
                padding: spacing.md
              }
            ]}>
              <Text style={styles.soundLabel}>Sound</Text>
              <Text style={[styles.soundText, { fontSize: soundTextSize }]}>{currentLesson.sound}</Text>
            </View>
            <TouchableOpacity style={[
              styles.hearItButton,
              {
                backgroundColor: '#E8F5E9',
                borderRadius: BorderRadius.lg,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                alignItems: 'center'
              }
            ]} onPress={handleHearIt}>
              <Text style={styles.hearItText}>Hear it</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Letter Display */}
        <View style={[
          styles.letterDisplayCard,
          {
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.lg,
            alignItems: 'center'
          }
        ]}>
          <Text style={[styles.displayLetter, { fontSize: displayLetterSize }]}>{currentLesson.letter}</Text>
          <Text style={styles.letterHint}>Practice writing this letter</Text>
        </View>

        {/* Word Selection Game */}
        <View style={[styles.gameSection, { marginBottom: spacing.lg }]}>
          <Text style={[
            styles.gamePrompt,
            {
              fontSize: gamePromptSize,
              fontWeight: '700',
              color: Colors.purple,
              marginBottom: spacing.md,
              textAlign: 'center'
            }
          ]}>
            Tap words that start with {currentLesson.sound}
          </Text>
          
          {/* Selection Progress */}
          {!showResults && (
            <View style={[
              styles.selectionProgress,
              {
                backgroundColor: Colors.lavender,
                borderRadius: BorderRadius.lg,
                padding: spacing.sm,
                marginBottom: spacing.md,
                alignItems: 'center'
              }
            ]}>
              <Text style={styles.selectionProgressText}>
                Selected: {selectedWords.size} of {gameWords.filter(w => w.isCorrect).length} correct words
              </Text>
            </View>
          )}
          
          {/* 2x2 Matrix Grid for Word Buttons */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.md,
            justifyContent: 'space-between',
          }}>
            {gameWords.map((item) => (
              <WordOption
                key={item.word}
                word={item.word}
                isCorrect={item.isCorrect}
                isSelected={selectedWords.has(item.word)}
                showResult={showResults}
                onPress={() => handleWordPress(item.word)}
                width="47%"
                fontSize={wordButtonTextSize}
              />
            ))}
          </View>
        </View>

        {/* Progress indicator */}
        <View style={[
          styles.progressSection,
          { alignItems: 'center', marginTop: spacing.md }
        ]}>
          {(() => {
            const p = getProgressForLesson(currentLesson.id);
            if (p) {
              return (
                <View style={[styles.progressInfo, { alignItems: 'center' }]}>
                  <Text style={styles.progressText}>
                    Mastery: {Math.round(p.masteryLevel)}%
                  </Text>
                  <Text style={styles.progressSubtext}>
                    {p.correctCount}/{p.attempts} correct
                  </Text>
                </View>
              );
            }
            return null;
          })()}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    // paddingHorizontal handled dynamically
    // paddingTop handled dynamically
  },
  header: {
    // marginBottom handled dynamically
  },
  title: {
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -0.5,
    // fontSize, marginBottom handled dynamically
  },
  subtitle: {
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  letterSelector: {
    flexDirection: 'row',
    // gap, marginBottom, paddingVertical handled dynamically
  },
  letterCircle: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    // width, height, borderRadius handled dynamically
  },
  letterCircleSelected: {
    backgroundColor: Colors.purple,
  },
  letterCircleText: {
    fontWeight: '600',
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  letterCircleTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  lessonCard: {
    flexDirection: 'row',
    ...Shadow.sm,
    // borderRadius, padding, marginBottom, gap, backgroundColor handled dynamically
  },
  lessonCardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  bigLetter: {
    fontWeight: '800',
    color: Colors.purple,
    lineHeight: 80,
    // fontSize handled dynamically
  },
  smallLetter: {
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
    // fontSize handled dynamically
  },
  lessonCardRight: {
    flex: 1,
    // gap handled dynamically
  },
  soundBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    // padding handled dynamically
  },
  soundLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  soundText: {
    fontWeight: '700',
    color: Colors.textPrimary,
    // fontSize handled dynamically
  },
  hearItButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    // paddingVertical, paddingHorizontal handled dynamically
  },
  hearItText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  letterDisplayCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    ...Shadow.sm,
    // borderRadius, padding, marginBottom handled dynamically
  },
  displayLetter: {
    fontWeight: '800',
    color: Colors.purple,
    // fontSize, marginBottom handled dynamically
  },
  letterHint: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  gameSection: {
    // marginBottom handled dynamically
  },
  gamePrompt: {
    // fontSize, fontWeight, color, marginBottom, textAlign handled dynamically
  },
  selectionProgress: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    // padding, marginBottom handled dynamically
  },
  selectionProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.purple,
  },
  wordButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.sm,
    // width, paddingVertical, paddingHorizontal handled dynamically
  },
  wordButtonSelected: {
    backgroundColor: Colors.lavender,
    borderWidth: 2,
    borderColor: Colors.purple,
  },
  wordButtonCorrect: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  wordButtonWrong: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#EF5350',
  },
  wordButtonDimmed: {
    opacity: 0.5,
  },
  wordButtonText: {
    fontWeight: '700',
    color: Colors.purple,
    // fontSize handled dynamically
  },
  wordButtonTextSelected: {
    color: Colors.purple,
    fontWeight: '800',
  },
  wordButtonTextCorrect: {
    color: '#4CAF50',
  },
  wordButtonTextWrong: {
    color: '#EF5350',
  },
  wordButtonTextDimmed: {
    color: Colors.textMuted,
  },
  progressSection: {
    alignItems: 'center',
    // marginTop handled dynamically
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.purple,
  },
  progressSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 56,
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
