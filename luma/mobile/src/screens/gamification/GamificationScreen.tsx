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
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

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
  
  // Responsive layout
  const { spacing, mScale, screenPadding, centeredContent, isTablet, calculateColumns } = useResponsiveLayout();
  
  // Responsive font sizes
  const titleSize = mScale(isTablet ? 32 : 26, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const badgeTextSize = mScale(14, 0.3);
  const tabTextSize = mScale(16, 0.3);
  const sectionTitleSize = mScale(20, 0.3);
  const statValueSize = mScale(28, 0.35);
  const statLabelSize = mScale(14, 0.3);
  const skillNameSize = mScale(16, 0.3);
  const skillPercentSize = mScale(16, 0.3);
  const badgeNameSize = mScale(14, 0.3);
  const achievementNameSize = mScale(16, 0.3);
  const achievementDescSize = mScale(14, 0.3);
  const testButtonTextSize = mScale(12, 0.3);
  const loadingTextSize = mScale(16, 0.3);
  
  // Responsive sizing
  const statCardWidth = isTablet ? '23%' : '48%';
  const badgeColumns = calculateColumns(100, 80, 16);
  const badgeWidth = `${100 / badgeColumns - 2}%`;
  const badgeIconSize = mScale(60, 0.3);
  const badgeEmojiSize = mScale(32, 0.3);
  const achievementIconSize = mScale(32, 0.3);
  const unlockedBadgeSize = mScale(28, 0.2);
  const tabEmojiSize = mScale(20, 0.3);
  const progressBarHeight = mScale(10, 0.2);

  const [contentAnim] = useState(new Animated.Value(1));
  const [showTreeDetails, setShowTreeDetails] = useState(false);
  const [showPetCustomization, setShowPetCustomization] = useState(false);

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={[styles.loadingContainer, { backgroundColor: Colors.cream }]}>
          <LoadingSpinner message="Loading your world..." />
          <Text style={[styles.loadingText, { marginTop: spacing.lg, fontSize: loadingTextSize }]}>
            Preparing something magical...
          </Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen scrollable backgroundColor={Colors.cream}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          padding: spacing.lg,
          paddingTop: screenPadding + spacing.lg,
          backgroundColor: Colors.purple,
          alignItems: 'center',
        }
      ]}>
        <Text style={[styles.title, { fontSize: titleSize, marginBottom: spacing.xs }]}>
          My Progress
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize, textAlign: 'center' }]}>
          Keep reading to grow your tree and pet!
        </Text>
        {hasUnclaimedRewards && (
          <View style={[
            styles.rewardBadge,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: BorderRadius.full,
              marginTop: spacing.sm,
            }
          ]}>
            <Text style={[styles.rewardBadgeText, { fontSize: badgeTextSize }]}>
              🎁 {state?.milestones?.filter((m: any) => !m.isClaimed).length} rewards waiting!
            </Text>
          </View>
        )}
        
        {/* Test Controls */}
        <View style={[styles.testControls, { marginTop: spacing.md, gap: spacing.sm }]}>
          <TouchableOpacity 
            style={[
              styles.testButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: BorderRadius.md,
              }
            ]}
            onPress={() => simulateReadingSession('phonics', 5)}
          >
            <Text style={[styles.testButtonText, { fontSize: testButtonTextSize }]}>
              +Phonics (5min)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.testButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: BorderRadius.md,
              }
            ]}
            onPress={() => simulateReadingSession('story', 10)}
          >
            <Text style={[styles.testButtonText, { fontSize: testButtonTextSize }]}>
              +Story (10min)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.testButton,
              {
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: BorderRadius.md,
              }
            ]}
            onPress={() => simulateReadingSession('practice', 3)}
          >
            <Text style={[styles.testButtonText, { fontSize: testButtonTextSize }]}>
              +Practice (3min)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={[
        styles.tabContainer,
        {
          flexDirection: 'row',
          padding: spacing.md,
          backgroundColor: Colors.cream,
          gap: spacing.md,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.lg,
              borderWidth: 2,
              borderColor: Colors.border,
              gap: spacing.sm,
            },
            currentTab === 'tree' && styles.tabActive
          ]}
          onPress={() => setCurrentTab('tree')}
        >
          <Text style={[styles.tabEmoji, { fontSize: tabEmojiSize }]}>🌳</Text>
          <Text style={[
            styles.tabText,
            { fontSize: tabTextSize },
            currentTab === 'tree' && styles.tabTextActive
          ]}>
            Fruit Tree
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.lg,
              borderWidth: 2,
              borderColor: Colors.border,
              gap: spacing.sm,
            },
            currentTab === 'pet' && styles.tabActive
          ]}
          onPress={() => setCurrentTab('pet')}
        >
          <Text style={[styles.tabEmoji, { fontSize: tabEmojiSize }]}>🐾</Text>
          <Text style={[
            styles.tabText,
            { fontSize: tabTextSize },
            currentTab === 'pet' && styles.tabTextActive
          ]}>
            Reading Pet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={[styles.content, { flex: 1 }]}
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
        <View style={[
          styles.statsGrid,
          {
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: spacing.lg,
            justifyContent: 'space-between',
            gap: spacing.md,
          }
        ]}>
          <View style={[
            styles.statCard,
            {
              width: statCardWidth,
              padding: spacing.lg,
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              backgroundColor: '#EDE9FE',
            }
          ]}>
            <Text style={[styles.statValue, { color: '#7C3AED', fontSize: statValueSize, marginBottom: spacing.xs }]}>
              {state?.plant?.wordsRead || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Words Read</Text>
          </View>
          <View style={[
            styles.statCard,
            {
              width: statCardWidth,
              padding: spacing.lg,
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              backgroundColor: '#FEF3C7',
            }
          ]}>
            <Text style={[styles.statValue, { color: '#D97706', fontSize: statValueSize, marginBottom: spacing.xs }]}>
              {fruitTreeProgress?.currentStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Day Streak</Text>
          </View>
          <View style={[
            styles.statCard,
            {
              width: statCardWidth,
              padding: spacing.lg,
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              backgroundColor: '#D1FAE5',
            }
          ]}>
            <Text style={[styles.statValue, { color: '#059669', fontSize: statValueSize, marginBottom: spacing.xs }]}>
              {state?.totalUnlocked || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Achievements</Text>
          </View>
          <View style={[
            styles.statCard,
            {
              width: statCardWidth,
              padding: spacing.lg,
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              backgroundColor: '#FEE2E2',
            }
          ]}>
            <Text style={[styles.statValue, { color: '#DC2626', fontSize: statValueSize, marginBottom: spacing.xs }]}>
              {state?.plant?.sessionsCompleted || 0}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Sessions Done</Text>
          </View>
        </View>

        {/* Skill Progress */}
        <View style={[styles.section, { padding: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.md }]}>
            Skill Progress
          </Text>
          <View style={[styles.skillItem, { marginBottom: spacing.md }]}>
            <View style={[styles.skillHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }]}>
              <Text style={[styles.skillName, { fontSize: skillNameSize }]}>Letter Recognition</Text>
              <Text style={[styles.skillPercent, { fontSize: skillPercentSize, color: '#7C3AED' }]}>85%</Text>
            </View>
            <View style={[styles.progressBar, { height: progressBarHeight, backgroundColor: '#E5E7EB', borderRadius: BorderRadius.full, overflow: 'hidden' }]}>
              <View style={[styles.progressFill, { height: '100%', width: '85%', backgroundColor: '#7C3AED', borderRadius: BorderRadius.full }]} />
            </View>
          </View>
          <View style={[styles.skillItem, { marginBottom: spacing.md }]}>
            <View style={[styles.skillHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }]}>
              <Text style={[styles.skillName, { fontSize: skillNameSize }]}>Sound Blending</Text>
              <Text style={[styles.skillPercent, { fontSize: skillPercentSize, color: '#10B981' }]}>60%</Text>
            </View>
            <View style={[styles.progressBar, { height: progressBarHeight, backgroundColor: '#E5E7EB', borderRadius: BorderRadius.full, overflow: 'hidden' }]}>
              <View style={[styles.progressFill, { height: '100%', width: '60%', backgroundColor: '#10B981', borderRadius: BorderRadius.full }]} />
            </View>
          </View>
          <View style={[styles.skillItem, { marginBottom: spacing.md }]}>
            <View style={[styles.skillHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }]}>
              <Text style={[styles.skillName, { fontSize: skillNameSize }]}>Syllable Awareness</Text>
              <Text style={[styles.skillPercent, { fontSize: skillPercentSize, color: '#EC4899' }]}>40%</Text>
            </View>
            <View style={[styles.progressBar, { height: progressBarHeight, backgroundColor: '#E5E7EB', borderRadius: BorderRadius.full, overflow: 'hidden' }]}>
              <View style={[styles.progressFill, { height: '100%', width: '40%', backgroundColor: '#EC4899', borderRadius: BorderRadius.full }]} />
            </View>
          </View>
          <View style={[styles.skillItem, { marginBottom: spacing.md }]}>
            <View style={[styles.skillHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }]}>
              <Text style={[styles.skillName, { fontSize: skillNameSize }]}>Reading Fluency</Text>
              <Text style={[styles.skillPercent, { fontSize: skillPercentSize, color: '#D97706' }]}>55%</Text>
            </View>
            <View style={[styles.progressBar, { height: progressBarHeight, backgroundColor: '#E5E7EB', borderRadius: BorderRadius.full, overflow: 'hidden' }]}>
              <View style={[styles.progressFill, { height: '100%', width: '55%', backgroundColor: '#D97706', borderRadius: BorderRadius.full }]} />
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={[styles.section, { padding: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.md }]}>
            Badges
          </Text>
          <View style={[
            styles.badgesGrid,
            {
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.md,
              justifyContent: 'flex-start',
            }
          ]}>
            {[
              { icon: '🏅', name: 'First Word', earned: true },
              { icon: '🔥', name: '7-Day Streak', earned: true },
              { icon: '⭐', name: 'Phonics Star', earned: true },
              { icon: '📚', name: 'Brave Reader', earned: false },
              { icon: '📖', name: 'Story Finisher', earned: false },
              { icon: '🔤', name: 'Super Speller', earned: false },
            ].map((badge, index) => (
              <View 
                key={index} 
                style={[
                  styles.badgeItem, 
                  { width: badgeWidth, alignItems: 'center', marginBottom: spacing.md },
                  !badge.earned && styles.badgeLocked
                ]}
              >
                <View style={[
                  styles.badgeIcon,
                  {
                    width: badgeIconSize,
                    height: badgeIconSize,
                    borderRadius: badgeIconSize / 2,
                    backgroundColor: Colors.cream,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: spacing.xs,
                  }
                ]}>
                  <Text style={[styles.badgeEmoji, { fontSize: badgeEmojiSize }]}>{badge.icon}</Text>
                </View>
                <Text style={[styles.badgeName, { fontSize: badgeNameSize, textAlign: 'center' }]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        {state?.achievements && state.achievements.length > 0 && (
          <View style={[styles.section, { padding: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: spacing.md }]}>
              🏆 Achievements
            </Text>
            <View style={[styles.achievementsList, { gap: spacing.md }]}>
              {state.achievements.slice(0, 5).map((achievement: any) => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementCard,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: Colors.white,
                      padding: spacing.md,
                      borderRadius: BorderRadius.lg,
                    }
                  ]}
                >
                  <Text style={[styles.achievementIcon, { fontSize: achievementIconSize, marginRight: spacing.md }]}>
                    {achievement.icon}
                  </Text>
                  <View style={[styles.achievementInfo, { flex: 1 }]}>
                    <Text style={[styles.achievementName, { fontSize: achievementNameSize, marginBottom: 2 }]}>
                      {achievement.name}
                    </Text>
                    <Text style={[styles.achievementDesc, { fontSize: achievementDescSize }]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.isUnlocked && (
                    <View style={[
                      styles.unlockedBadge,
                      {
                        width: unlockedBadgeSize,
                        height: unlockedBadgeSize,
                        borderRadius: unlockedBadgeSize / 2,
                        backgroundColor: '#4CAF50',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }
                    ]}>
                      <Text style={[styles.unlockedText, { fontSize: unlockedBadgeSize * 0.5 }]}>✓</Text>
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
    // backgroundColor handled dynamically
  },
  loadingText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    // marginTop, fontSize handled dynamically
  },
  header: {
    // padding, paddingTop, backgroundColor, alignItems handled dynamically
  },
  title: {
    fontWeight: '800',
    color: Colors.white,
    // fontSize, marginBottom handled dynamically
  },
  subtitle: {
    color: Colors.white + 'CC',
    // fontSize, textAlign handled dynamically
  },
  rewardBadge: {
    backgroundColor: '#FFF3E0',
    // paddingHorizontal, paddingVertical, borderRadius, marginTop handled dynamically
  },
  rewardBadgeText: {
    fontWeight: '700',
    color: '#FF9800',
    // fontSize handled dynamically
  },
  tabContainer: {
    // flexDirection, padding, backgroundColor, gap handled dynamically
  },
  tab: {
    // flex, flexDirection, alignItems, justifyContent, paddingVertical, backgroundColor, 
    // borderRadius, borderWidth, borderColor, gap handled dynamically
  },
  tabActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  tabEmoji: {
    // fontSize handled dynamically
  },
  tabText: {
    fontWeight: '700',
    color: Colors.textPrimary,
    // fontSize handled dynamically
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    // flex handled dynamically
  },
  section: {
    // padding handled dynamically
  },
  sectionTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
    // fontSize, marginBottom handled dynamically
  },
  achievementsList: {
    // gap handled dynamically
  },
  achievementCard: {
    ...Shadow.sm,
    // flexDirection, alignItems, backgroundColor, padding, borderRadius handled dynamically
  },
  achievementIcon: {
    // fontSize, marginRight handled dynamically
  },
  achievementInfo: {
    // flex handled dynamically
  },
  achievementName: {
    fontWeight: '700',
    color: Colors.textPrimary,
    // fontSize, marginBottom handled dynamically
  },
  achievementDesc: {
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  unlockedBadge: {
    // width, height, borderRadius, backgroundColor, justifyContent, alignItems handled dynamically
  },
  unlockedText: {
    color: Colors.white,
    fontWeight: '800',
    // fontSize handled dynamically
  },
  statsGrid: {
    // flexDirection, flexWrap, padding, justifyContent, gap handled dynamically
  },
  statCard: {
    // width, padding, borderRadius, alignItems, backgroundColor handled dynamically
  },
  statValue: {
    fontWeight: '800',
    // color, fontSize, marginBottom handled dynamically
  },
  statLabel: {
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  skillItem: {
    // marginBottom handled dynamically
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom handled dynamically
  },
  skillName: {
    fontWeight: '600',
    color: Colors.textPrimary,
    // fontSize handled dynamically
  },
  skillPercent: {
    fontWeight: '700',
    // fontSize handled dynamically
  },
  progressBar: {
    // height, backgroundColor, borderRadius, overflow handled dynamically
  },
  progressFill: {
    // height, borderRadius handled dynamically
  },
  badgesGrid: {
    // flexDirection, flexWrap, gap, justifyContent handled dynamically
  },
  badgeItem: {
    // width, alignItems, marginBottom handled dynamically
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    // width, height, borderRadius, marginBottom handled dynamically
  },
  badgeEmoji: {
    // fontSize handled dynamically
  },
  badgeName: {
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    // fontSize handled dynamically
  },
  testControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // marginTop, gap handled dynamically
  },
  testButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.purple,
    // paddingHorizontal, paddingVertical, borderRadius handled dynamically
  },
  testButtonText: {
    fontWeight: '600',
    color: Colors.purple,
    // fontSize handled dynamically
  },
});
