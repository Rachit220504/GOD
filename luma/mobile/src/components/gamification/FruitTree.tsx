import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// FRUIT TREE GAMIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

interface FruitTreeProps {
  progress: {
    totalXP: number;
    level: number;
    fruitsHarvested: number;
    wordsRead: number;
    booksCompleted: number;
    currentStreak: number;
    maxStreak: number;
  };
  onHarvestFruit?: () => void;
  onViewDetails?: () => void;
}

// Tree stages based on total XP
const TREE_STAGES = [
  { level: 1, xp: 0, name: 'Seed', emoji: '🌰', fruits: 0, description: 'Plant your reading journey' },
  { level: 2, xp: 50, name: 'Sprout', emoji: '🌱', fruits: 0, description: 'Your tree is growing!' },
  { level: 3, xp: 150, name: 'Sapling', emoji: '🌿', fruits: 1, description: 'First branches appearing' },
  { level: 4, xp: 300, name: 'Young Tree', emoji: '🌳', fruits: 2, description: 'Small fruits growing' },
  { level: 5, xp: 500, name: 'Fruit Tree', emoji: '🌳', fruits: 3, description: 'Ready to harvest!' },
  { level: 6, xp: 800, name: 'Blooming Tree', emoji: '🌳', fruits: 4, description: 'Full of fruits!' },
  { level: 7, xp: 1200, name: 'Mature Tree', emoji: '🌳', fruits: 5, description: 'Bountiful harvests!' },
  { level: 8, xp: 1800, name: 'Grand Tree', emoji: '🌳', fruits: 6, description: 'Legendary reader!' },
  { level: 9, xp: 2500, name: 'Ancient Tree', emoji: '🌳', fruits: 8, description: 'Reading master!' },
  { level: 10, xp: 3500, name: 'Mythical Tree', emoji: '🌳', fruits: 10, description: 'Ultimate achievement!' },
];

const FRUIT_TYPES = ['🍎', '🍊', '🍋', '🍐', '🍑', '🍒', '🥝', '🫐', '🍇', '🍓'];

export function FruitTree({ progress, onHarvestFruit, onViewDetails }: FruitTreeProps) {
  // Animation values
  const treeScale = useRef(new Animated.Value(1)).current;
  const fruitAnimations = useRef<Animated.Value[]>([]).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const swayAnimation = useRef(new Animated.Value(0)).current;
  
  const [showHarvestEffect, setShowHarvestEffect] = useState(false);

  // Get current stage
  const currentStage = TREE_STAGES.slice().reverse().find(s => progress.totalXP >= s.xp) || TREE_STAGES[0];
  const nextStage = TREE_STAGES.find(s => s.xp > progress.totalXP);
  
  // Calculate progress to next stage
  const progressToNext = nextStage
    ? Math.min(100, Math.max(0, ((progress.totalXP - currentStage.xp) / (nextStage.xp - currentStage.xp)) * 100))
    : 100;

  // Initialize fruit animations
  useEffect(() => {
    const numFruits = currentStage.fruits;
    fruitAnimations.length = 0;
    for (let i = 0; i < numFruits; i++) {
      fruitAnimations.push(new Animated.Value(0));
    }
  }, [currentStage.fruits]);

  // Tree sway animation
  useEffect(() => {
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnimation, {
          toValue: -1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    sway.start();
    return () => sway.stop();
  }, []);

  // Glow pulse animation for harvestable fruits
  useEffect(() => {
    if (currentStage.fruits > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [currentStage.fruits]);

  // Animate fruits appearing
  useEffect(() => {
    fruitAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fruitAnimations.length]);

  // Check if harvest is available
  const canHarvest = currentStage.fruits > 0;

  // Harvest animation
  const handleHarvest = () => {
    if (canHarvest && onHarvestFruit) {
      // Scale up tree
      Animated.sequence([
        Animated.timing(treeScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(treeScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      setShowHarvestEffect(true);
      setTimeout(() => setShowHarvestEffect(false), 1000);
      onHarvestFruit();
    }
  };

  // Tree rotation based on sway
  const treeRotation = swayAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

  // Glow opacity
  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Tree Container */}
      <View style={styles.treeWrapper}>
        {/* Background Glow */}
        {currentStage.fruits > 0 && (
          <Animated.View
            style={[
              styles.glow,
              { opacity: glowOpacity },
            ]}
          />
        )}

        {/* Tree */}
        <Animated.View
          style={[
            styles.tree,
            { transform: [{ scale: treeScale }, { rotate: treeRotation }] },
          ]}
        >
          {/* Tree Crown */}
          <View style={styles.crown}>
            <Text style={styles.treeEmoji}>{currentStage.emoji}</Text>
            
            {/* Fruits positioned around the tree */}
            {fruitAnimations.map((anim, index) => {
              const angle = (index / currentStage.fruits) * 2 * Math.PI - Math.PI / 2;
              const radius = 50;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius - 20;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.fruit,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        { scale: anim },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.fruitEmoji}>
                    {FRUIT_TYPES[index % FRUIT_TYPES.length]}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* Trunk */}
          <View style={styles.trunk}>
            <View style={styles.trunkBar} />
          </View>
        </Animated.View>

        {/* Harvest Effect */}
        {showHarvestEffect && (
          <View style={styles.harvestEffect}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    transform: [
                      { rotate: `${i * 45}deg` },
                      { translateY: -60 },
                    ],
                  },
                ]}
              >
                ✨
              </Animated.Text>
            ))}
          </View>
        )}
      </View>

      {/* Stage Info */}
      <View style={styles.stageInfo}>
        <Text style={styles.stageName}>{currentStage.name}</Text>
        <Text style={styles.stageDescription}>{currentStage.description}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressToNext)}% to next level
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{progress.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{progress.totalXP}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{progress.fruitsHarvested}</Text>
          <Text style={styles.statLabel}>Fruits</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{progress.wordsRead}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {currentStage.fruits > 0 ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.harvestButton]}
            onPress={handleHarvest}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonEmoji}>🍎</Text>
            <Text style={styles.actionButtonText}>Harvest Fruits!</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionButton, styles.disabledButton]}>
            <Text style={styles.actionButtonEmoji}>🌰</Text>
            <Text style={styles.actionButtonText}>Need {currentStage.xp === 0 ? '50 XP' : `${(TREE_STAGES.find(s => s.fruits > 0) || TREE_STAGES[2]).xp - currentStage.xp} XP`} for fruits</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={onViewDetails}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Tree Details</Text>
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
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  treeWrapper: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.purple + '30',
    top: 10,
  },
  tree: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  crown: {
    width: 140,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  treeEmoji: {
    fontSize: 100,
  },
  fruit: {
    position: 'absolute',
  },
  fruitEmoji: {
    fontSize: 28,
  },
  trunk: {
    alignItems: 'center',
  },
  trunkBar: {
    width: 24,
    height: 40,
    backgroundColor: '#8B4513',
    borderRadius: BorderRadius.md,
  },
  harvestEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  stageInfo: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stageName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  stageDescription: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.purple,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minWidth: 70,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.purple,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginTop: 2,
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
  },
  harvestButton: {
    backgroundColor: Colors.purple,
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  detailsButton: {
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
});

export default FruitTree;
