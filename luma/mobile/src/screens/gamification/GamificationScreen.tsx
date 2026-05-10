import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeScreen } from '../../components/common/SafeScreen';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { 
  useGamification, 
  GamificationProvider,
} from '../../contexts/GamificationContext';
import { FruitTree } from '../../components/gamification/FruitTree';
import { ReadingPet } from '../../components/gamification/ReadingPet';
import { TreeDetailsModal } from '../../components/gamification/TreeDetailsModal';
import { PetCustomizationModal } from '../../components/gamification/PetCustomizationModal';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

// ═══════════════════════════════════════════════════════════════════════════
// INNER SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function GamificationScreenInner() {
  const { 
    currentTab,
    setCurrentTab,
    state,
    isLoading,
    isRefreshing,
    hasUnclaimedRewards,
    refreshData,
    harvestFruit,
    awardXP,
    simulateReadingSession,
    fruitTreeProgress,
    petProgress,
  } = useGamification();

  const [contentAnim] = useState(new Animated.Value(1));
  const [showTreeDetails, setShowTreeDetails] = useState(false);
  const [showPetCustomization, setShowPetCustomization] = useState(false);

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Loading your world..." />
          <Text style={styles.loadingText}>Preparing something magical...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen scrollable backgroundColor={Colors.cream}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Progress</Text>
        <Text style={styles.subtitle}>Keep reading to grow your tree and pet!</Text>
        {hasUnclaimedRewards && (
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardBadgeText}>
              🎁 {state?.milestones?.filter((m: any) => !m.isClaimed).length} rewards waiting!
            </Text>
          </View>
        )}
        
        {/* Test Controls */}
        <View style={styles.testControls}>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => simulateReadingSession('phonics', 5)}
          >
            <Text style={styles.testButtonText}>+Phonics (5min)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => simulateReadingSession('story', 10)}
          >
            <Text style={styles.testButtonText}>+Story (10min)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => simulateReadingSession('practice', 3)}
          >
            <Text style={styles.testButtonText}>+Practice (3min)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'tree' && styles.tabActive]}
          onPress={() => setCurrentTab('tree')}
        >
          <Text style={styles.tabEmoji}>🌳</Text>
          <Text style={[styles.tabText, currentTab === 'tree' && styles.tabTextActive]}>
            Fruit Tree
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'pet' && styles.tabActive]}
          onPress={() => setCurrentTab('pet')}
        >
          <Text style={styles.tabEmoji}>🐾</Text>
          <Text style={[styles.tabText, currentTab === 'pet' && styles.tabTextActive]}>
            Reading Pet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ scale: contentAnim }] }}>
          {currentTab === 'tree' && fruitTreeProgress && (
            <FruitTree
              progress={fruitTreeProgress}
              onHarvestFruit={harvestFruit}
              onViewDetails={() => {
                setShowTreeDetails(true);
              }}
            />
          )}
          
          {currentTab === 'pet' && petProgress && (
            <ReadingPet
              progress={petProgress}
              onPetTap={() => {
                // Handle pet interaction - give small XP boost
                simulateReadingSession('practice', 2);
              }}
              onFeedPet={() => {
                // Simulate feeding pet - add reading minutes
                simulateReadingSession('story', 5);
              }}
              onCustomizePet={() => {
                // Show pet customization options
                setShowPetCustomization(true);
              }}
            />
          )}
        </Animated.View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
            <Text style={[styles.statValue, { color: '#7C3AED' }]}>{state?.plant?.wordsRead || 0}</Text>
            <Text style={styles.statLabel}>Words Read</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{fruitTreeProgress?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statValue, { color: '#059669' }]}>{state?.totalUnlocked || 0}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{state?.plant?.sessionsCompleted || 0}</Text>
            <Text style={styles.statLabel}>Sessions Done</Text>
          </View>
        </View>

        {/* Skill Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skill Progress</Text>
          <View style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName}>Letter Recognition</Text>
              <Text style={[styles.skillPercent, { color: '#7C3AED' }]}>85%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%', backgroundColor: '#7C3AED' }]} />
            </View>
          </View>
          <View style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName}>Sound Blending</Text>
              <Text style={[styles.skillPercent, { color: '#10B981' }]}>60%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%', backgroundColor: '#10B981' }]} />
            </View>
          </View>
          <View style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName}>Syllable Awareness</Text>
              <Text style={[styles.skillPercent, { color: '#EC4899' }]}>40%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%', backgroundColor: '#EC4899' }]} />
            </View>
          </View>
          <View style={styles.skillItem}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName}>Reading Fluency</Text>
              <Text style={[styles.skillPercent, { color: '#D97706' }]}>55%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '55%', backgroundColor: '#D97706' }]} />
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {[
              { icon: '🏅', name: 'First Word', earned: true },
              { icon: '🔥', name: '7-Day Streak', earned: true },
              { icon: '⭐', name: 'Phonics Star', earned: true },
              { icon: '📚', name: 'Brave Reader', earned: false },
              { icon: '📖', name: 'Story Finisher', earned: false },
              { icon: '🔤', name: 'Super Speller', earned: false },
            ].map((badge, index) => (
              <View key={index} style={[styles.badgeItem, !badge.earned && styles.badgeLocked]}>
                <View style={styles.badgeIcon}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        {state?.achievements && state.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Achievements</Text>
            <View style={styles.achievementsList}>
              {state.achievements.slice(0, 5).map((achievement: any) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                  {achievement.isUnlocked && (
                    <View style={styles.unlockedBadge}>
                      <Text style={styles.unlockedText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Tree Details Modal */}
      {fruitTreeProgress && (
        <TreeDetailsModal
          visible={showTreeDetails}
          onClose={() => setShowTreeDetails(false)}
          progress={fruitTreeProgress}
        />
      )}

      {/* Pet Customization Modal */}
      {petProgress && (
        <PetCustomizationModal
          visible={showPetCustomization}
          onClose={() => setShowPetCustomization(false)}
          petLevel={petProgress.level}
          unlockedAccessories={petProgress.accessoriesUnlocked || []}
          onAccessoryChange={(accessory) => {
            // Handle accessory change - would save to storage in real app
            console.log('Accessory changed to:', accessory);
          }}
          currentAccessory={petProgress.accessoriesUnlocked?.[0] || 'none'}
        />
      )}
    </SafeScreen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function GamificationScreen() {
  return (
    <GamificationProvider>
      <GamificationScreenInner />
    </GamificationProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.screen,
    backgroundColor: Colors.purple,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.white + 'CC',
    textAlign: 'center',
  },
  rewardBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  rewardBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FF9800',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.cream,
    gap: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  tabActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  achievementsList: {
    gap: Spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  skillItem: {
    marginBottom: Spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  skillName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  skillPercent: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  testControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  testButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.purple,
  },
  testButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.purple,
  },
});
