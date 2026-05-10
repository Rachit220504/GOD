import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

// ═══════════════════════════════════════════════════════════════════════════
// READING PET COMPANION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

interface ReadingPetProps {
  progress: {
    totalXP: number;
    level: number;
    currentStreak: number;
    lastActivityDate?: string;
    todayMinutesRead: number;
    dailyGoalMinutes: number;
  };
  onPetTap?: () => void;
  onFeedPet?: () => void;
  onCustomizePet?: () => void;
}

type PetMood = 'happy' | 'excited' | 'sleepy' | 'hungry' | 'celebrating';

// Pet stages based on level
const PET_STAGES = [
  { level: 1, name: 'Baby', emoji: '🐣', accessory: '' },
  { level: 3, name: 'Young', emoji: '🐥', accessory: '🎀' },
  { level: 5, name: 'Teen', emoji: '🐤', accessory: '🧢' },
  { level: 8, name: 'Adult', emoji: '🐔', accessory: '👑' },
  { level: 12, name: 'Wise', emoji: '🦉', accessory: '✨' },
];

// Pet accessories unlocked by achievements
const ACCESSORIES = [
  { id: 'bow', emoji: '🎀', unlockLevel: 2 },
  { id: 'hat', emoji: '🧢', unlockLevel: 4 },
  { id: 'glasses', emoji: '👓', unlockLevel: 6 },
  { id: 'crown', emoji: '👑', unlockLevel: 8 },
  { id: 'wand', emoji: '🪄', unlockLevel: 10 },
  { id: 'cape', emoji: '🦸', unlockLevel: 12 },
];

export function ReadingPet({ progress, onPetTap, onFeedPet, onCustomizePet }: ReadingPetProps) {
  const [mood, setMood] = useState<PetMood>('happy');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation refs
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const snoreAnim = useRef(new Animated.Value(0)).current;

  // Get pet stage
  const petStage = PET_STAGES.slice().reverse().find(s => progress.level >= s.level) || PET_STAGES[0];
  
  // Get unlocked accessories
  const unlockedAccessories = ACCESSORIES.filter(a => progress.level >= a.unlockLevel);
  const currentAccessory = unlockedAccessories.length > 0 
    ? unlockedAccessories[unlockedAccessories.length - 1].emoji 
    : '';

  // Calculate mood based on activity
  useEffect(() => {
    const lastActivity = progress.lastActivityDate ? new Date(progress.lastActivityDate) : null;
    const today = new Date();
    const daysSinceActivity = lastActivity 
      ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (progress.currentStreak > 0 && progress.todayMinutesRead >= progress.dailyGoalMinutes) {
      setMood('celebrating');
    } else if (daysSinceActivity > 2) {
      setMood('sleepy');
    } else if (progress.todayMinutesRead < progress.dailyGoalMinutes / 2) {
      setMood('hungry');
    } else if (progress.currentStreak > 3) {
      setMood('excited');
    } else {
      setMood('happy');
    }
  }, [progress]);

  // Idle animations based on mood
  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    if (mood === 'sleepy') {
      // Gentle breathing/snoring animation
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(snoreAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(snoreAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    } else if (mood === 'excited' || mood === 'celebrating') {
      // Bouncing animation
      animation = Animated.loop(
        Animated.sequence([
          Animated.spring(bounceAnim, {
            toValue: -15,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ])
      );
    } else {
      // Subtle wiggle for happy/hungry
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: -1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    }

    animation.start();
    return () => animation.stop();
  }, [mood]);

  // Handle pet tap
  const handlePetTap = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Heart animation
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setIsAnimating(false));

    onPetTap?.();
  };

  // Get mood emoji and message
  const getMoodDisplay = () => {
    switch (mood) {
      case 'happy':
        return { emoji: '😊', message: 'I love reading with you!' };
      case 'excited':
        return { emoji: '🤩', message: 'Amazing streak! Keep going!' };
      case 'celebrating':
        return { emoji: '🎉', message: 'Daily goal complete! You\'re awesome!' };
      case 'sleepy':
        return { emoji: '😴', message: 'I miss reading with you...' };
      case 'hungry':
        return { emoji: '😋', message: 'Let\'s read something together!' };
      default:
        return { emoji: '😊', message: 'Ready to read?' };
    }
  };

  const moodDisplay = getMoodDisplay();

  // Animation transforms
  const bounceTransform = bounceAnim.interpolate({
    inputRange: [-15, 0],
    outputRange: [-15, 0],
  });

  const wiggleRotation = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const snoreScale = snoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const heartTranslate = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  return (
    <View style={styles.container}>
      {/* Pet Display Area */}
      <TouchableOpacity
        style={styles.petArea}
        onPress={handlePetTap}
        activeOpacity={0.9}
      >
        {/* Floating Hearts */}
        <Animated.View
          style={[
            styles.floatingHeart,
            {
              opacity: heartOpacity,
              transform: [{ translateY: heartTranslate }],
            },
          ]}
        >
          <Text style={styles.heartEmoji}>❤️</Text>
        </Animated.View>

        {/* Pet Character */}
        <Animated.View
          style={[
            styles.pet,
            {
              transform: mood === 'sleepy'
                ? [{ scale: snoreScale }]
                : mood === 'excited' || mood === 'celebrating'
                ? [{ translateY: bounceTransform }]
                : [{ rotate: wiggleRotation }],
            },
          ]}
        >
          <Text style={styles.petEmoji}>{petStage.emoji}</Text>
          
          {/* Accessory */}
          {currentAccessory && (
            <View style={styles.accessory}>
              <Text style={styles.accessoryEmoji}>{currentAccessory}</Text>
            </View>
          )}

          {/* Mood Indicator */}
          <View style={styles.moodBubble}>
            <Text style={styles.moodEmoji}>{moodDisplay.emoji}</Text>
          </View>
        </Animated.View>

        {/* Sleep Zzz for sleepy mood */}
        {mood === 'sleepy' && (
          <Animated.View style={styles.sleepIndicator}>
            <Text style={styles.sleepText}>Zzz...</Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Pet Info */}
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{petStage.name} Reader Pet</Text>
        <Text style={styles.petMessage}>{moodDisplay.message}</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{progress.currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>{progress.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>📖</Text>
          <Text style={styles.statValue}>{progress.todayMinutesRead}</Text>
          <Text style={styles.statLabel}>Min Today</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {progress.todayMinutesRead >= progress.dailyGoalMinutes ? (
          <View style={[styles.actionButton, styles.completedButton]}>
            <Text style={styles.actionButtonEmoji}>🎉</Text>
            <Text style={styles.actionButtonText}>Goal Complete!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.feedButton]}
            onPress={onFeedPet}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonEmoji}>📚</Text>
            <Text style={styles.actionButtonText}>
              Read to Feed! ({progress.dailyGoalMinutes - progress.todayMinutesRead} min left)
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.customizeButton]}
          onPress={onCustomizePet}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonEmoji}>🎨</Text>
          <Text style={styles.actionButtonText}>Customize Pet</Text>
          {unlockedAccessories.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unlockedAccessories.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  petArea: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pet: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  petEmoji: {
    fontSize: 80,
  },
  accessory: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  accessoryEmoji: {
    fontSize: 28,
  },
  moodBubble: {
    position: 'absolute',
    top: -15,
    right: -20,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 20,
  },
  floatingHeart: {
    position: 'absolute',
    top: 20,
  },
  heartEmoji: {
    fontSize: 32,
  },
  sleepIndicator: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  sleepText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  petInfo: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  petName: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  petMessage: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.purple,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  feedButton: {
    backgroundColor: Colors.purple,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completedButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  customizeButton: {
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  actionButtonEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  actionButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.black,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ReadingPet;
