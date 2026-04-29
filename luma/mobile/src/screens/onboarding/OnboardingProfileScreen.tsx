import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi } from '../../services/api';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingProfile'>;

const AGE_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12];
const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', emoji: '🌱', desc: 'Simple 3-letter words' },
  { value: 'ELEMENTARY', label: 'Elementary', emoji: '📗', desc: 'Short sentences' },
  { value: 'INTERMEDIATE', label: 'Intermediate', emoji: '📘', desc: 'Multi-syllable words' },
  { value: 'ADVANCED', label: 'Advanced', emoji: '🏆', desc: 'Complex passages' },
] as const;

export function OnboardingProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('BEGINNER');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  // Fade-in animation for each section
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('Please enter your name (at least 2 characters)');
      return;
    }
    setNameError('');
    if (!user) return;

    setIsLoading(true);
    try {
      await profileApi.updateProfile(user.id, {
        displayName: name.trim(),
        age: selectedAge ?? undefined,
        readingLevel: selectedLevel as 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED',
      });
      navigation.navigate('OnboardingAudioCheck');
    } catch {
      // Non-blocking — continue even if update fails
      navigation.navigate('OnboardingAudioCheck');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen scrollable backgroundColor={Colors.cream}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Hero emoji */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>👋</Text>
          <Text style={styles.title}>Tell me about you!</Text>
          <Text style={styles.subtitle}>
            I'll make reading just right for you
          </Text>
        </View>

        {/* Name Input */}
        <Text style={{ marginBottom: 8, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary }}>What's your name?</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.plainInput, nameError && styles.plainInputError, styles.nameInput]}
          placeholder="Type your name here..."
          autoCapitalize="words"
          autoFocus
        />
        {nameError && <Text style={{ color: Colors.error, marginBottom: 16 }}>{nameError}</Text>}

        {/* Age chips */}
        <Text style={styles.sectionLabel}>How old are you?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {AGE_OPTIONS.map((ageVal) => (
            <TouchableOpacity
              key={ageVal}
              style={[
                styles.chip,
                selectedAge === ageVal && styles.chipSelected,
              ]}
              onPress={() => setSelectedAge(ageVal)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedAge === ageVal }}
              accessibilityLabel={`Age ${ageVal}`}
            >
              <Text style={[
                styles.chipText,
                selectedAge === ageVal && styles.chipTextSelected,
              ]}>
                {ageVal}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reading level */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
          How do you read right now?
        </Text>
        <View style={styles.levelGrid}>
          {LEVEL_OPTIONS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.levelCard,
                selectedLevel === level.value && styles.levelCardSelected,
              ]}
              onPress={() => setSelectedLevel(level.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedLevel === level.value }}
            >
              <Text style={styles.levelEmoji}>{level.emoji}</Text>
              <View style={styles.levelTextBlock}>
                <Text style={[
                  styles.levelLabel,
                  selectedLevel === level.value && styles.levelLabelSelected,
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.levelDesc}>{level.desc}</Text>
              </View>
              {selectedLevel === level.value && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Let's go! →"
          onPress={handleContinue}
          isLoading={isLoading}
          fullWidth
          size="lg"
          style={styles.continueBtn}
        />
      </Animated.View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  heroEmoji: { fontSize: 60 },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  nameInput: {
    fontSize: FontSize.xl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.screen,
  },
  chip: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  chipSelected: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  chipText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.textOnDark,
  },
  levelGrid: {
    gap: Spacing.sm,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  levelCardSelected: {
    borderColor: Colors.purple,
    backgroundColor: Colors.lavender,
  },
  levelEmoji: { fontSize: 28 },
  levelTextBlock: { flex: 1 },
  levelLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  levelLabelSelected: { color: Colors.purple },
  levelDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.textOnDark,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  continueBtn: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
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
