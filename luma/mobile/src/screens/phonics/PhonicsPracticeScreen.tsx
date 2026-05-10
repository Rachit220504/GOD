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
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SCREEN_PADDING } from '../../utils/responsive';
import * as Speech from 'expo-speech';

// ─── Letter Circle in Selector ────────────────────────────────────────────────

function LetterCircle({
  letter,
  isSelected,
  onPress,
}: {
  letter: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.letterCircle, isSelected && styles.letterCircleSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.letterCircleText, isSelected && styles.letterCircleTextSelected]}>
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
}: {
  word: string;
  isCorrect: boolean;
  isSelected: boolean;
  showResult: boolean;
  onPress: () => void;
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
      style={getButtonStyle()}
      onPress={onPress}
      activeOpacity={showResult ? 1 : 0.7}
      disabled={showResult}
    >
      <Text style={getTextStyle()}>{word}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PhonicsPracticeScreen() {
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.purple} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Phonics Practice</Text>
          <Text style={styles.subtitle}>Trace the letter, then tap the right words</Text>
        </View>

        {/* Letter Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.letterSelector}
        >
          {lessons.map((lesson, index) => (
            <LetterCircle
              key={lesson.id}
              letter={lesson.letter}
              isSelected={index === selectedIndex}
              onPress={() => handleLetterSelect(index)}
            />
          ))}
        </ScrollView>

        {/* Main Lesson Card */}
        <View style={[styles.lessonCard, { backgroundColor: currentLesson.colorTheme }]}>
          <View style={styles.lessonCardLeft}>
            <Text style={styles.bigLetter}>{currentLesson.letter}</Text>
            <Text style={styles.smallLetter}>{currentLesson.letter.toLowerCase()}</Text>
          </View>
          <View style={styles.lessonCardRight}>
            <View style={styles.soundBox}>
              <Text style={styles.soundLabel}>Sound</Text>
              <Text style={styles.soundText}>{currentLesson.sound}</Text>
            </View>
            <TouchableOpacity style={styles.hearItButton} onPress={handleHearIt}>
              <Text style={styles.hearItText}>Hear it</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Letter Display */}
        <View style={styles.letterDisplayCard}>
          <Text style={styles.displayLetter}>{currentLesson.letter}</Text>
          <Text style={styles.letterHint}>Practice writing this letter</Text>
        </View>

        {/* Word Selection Game */}
        <View style={styles.gameSection}>
          <Text style={styles.gamePrompt}>
            Tap words that start with {currentLesson.sound}
          </Text>
          
          {/* Selection Progress */}
          {!showResults && (
            <View style={styles.selectionProgress}>
              <Text style={styles.selectionProgressText}>
                Selected: {selectedWords.size} of {gameWords.filter(w => w.isCorrect).length} correct words
              </Text>
            </View>
          )}
          
          <View style={styles.wordsGrid}>
            {gameWords.map((item) => (
              <WordOption
                key={item.word}
                word={item.word}
                isCorrect={item.isCorrect}
                isSelected={selectedWords.has(item.word)}
                showResult={showResults}
                onPress={() => handleWordPress(item.word)}
              />
            ))}
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressSection}>
          {(() => {
            const p = getProgressForLesson(currentLesson.id);
            if (p) {
              return (
                <View style={styles.progressInfo}>
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
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.purple,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  letterSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  letterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleSelected: {
    backgroundColor: Colors.purple,
  },
  letterCircleText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  letterCircleTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  lessonCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  lessonCardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  bigLetter: {
    fontSize: 72,
    fontWeight: '800',
    color: Colors.purple,
    lineHeight: 80,
  },
  smallLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.purple,
    opacity: 0.7,
  },
  lessonCardRight: {
    flex: 1,
    gap: Spacing.sm,
  },
  soundBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  soundLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  soundText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hearItButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  hearItText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: '#4CAF50',
  },
  letterDisplayCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  displayLetter: {
    fontSize: 120,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.md,
  },
  letterHint: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  gameSection: {
    marginBottom: Spacing.lg,
  },
  gamePrompt: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  selectionProgress: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  selectionProgressText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.purple,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  wordButton: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
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
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.purple,
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
    marginTop: Spacing.md,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
  },
  progressSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bottomPadding: {
    height: 100,
  },
});
