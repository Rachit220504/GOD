import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useProgressData } from '../../hooks/useProgressData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

type Props = NativeStackScreenProps<ProgressStackParamList, 'MyReadingTree'>;

const FRUITS = [
  { id: 1, emoji: '🍎', x: 30, y: 50, earned: true },
  { id: 2, emoji: '🍎', x: 70, y: 60, earned: true },
  { id: 3, emoji: '🍎', x: 50, y: 80, earned: true },
  { id: 4, emoji: '🍊', x: 25, y: 100, earned: true },
  { id: 5, emoji: '🍎', x: 75, y: 90, earned: true },
  { id: 6, emoji: '🍊', x: 50, y: 40, earned: true },
  { id: 7, emoji: '❓', x: 35, y: 30, earned: false },
  { id: 8, emoji: '❓', x: 65, y: 35, earned: false },
  { id: 9, emoji: '❓', x: 50, y: 20, earned: false },
];

function TreeVisual({ fruitsEarned }: { fruitsEarned: number }) {
  const { spacing, mScale, wp, isTablet } = useResponsiveLayout();
  const totalFruits = FRUITS.length;
  const earnedCount = Math.min(fruitsEarned, totalFruits);

  // Responsive tree sizing
  const treeWidth = mScale(isTablet ? 280 : 200, 0.4);
  const treeHeight = mScale(isTablet ? 350 : 250, 0.4);
  const sunSize = mScale(60, 0.3);
  const sunInnerSize = mScale(40, 0.3);
  const foliageWidth = treeWidth * 0.8;
  const foliageHeight = treeHeight * 0.72;
  const foliageRadius = foliageWidth / 2;
  const fruitSize = mScale(30, 0.3);
  const fruitEmojiSize = mScale(24, 0.3);
  const trunkWidth = mScale(30, 0.3);
  const trunkHeight = mScale(60, 0.3);
  const groundWidth = mScale(140, 0.4);
  const groundHeight = mScale(15, 0.3);

  return (
    <View style={[treeStyles.container, { paddingBottom: spacing.xl }]}>
      <View style={[
        treeStyles.sun,
        {
          top: spacing.lg,
          left: spacing.lg,
          width: sunSize,
          height: sunSize,
          borderRadius: sunSize / 2,
        }
      ]}>
        <View style={{
          width: sunInnerSize,
          height: sunInnerSize,
          borderRadius: sunInnerSize / 2,
          backgroundColor: '#FFEB3B',
        }} />
      </View>
      <View style={[treeStyles.treeContainer, { width: treeWidth, height: treeHeight }]}>
        <View style={[
          treeStyles.foliage,
          {
            width: foliageWidth,
            height: foliageHeight,
            borderRadius: foliageRadius,
          }
        ]}>
          {FRUITS.map((fruit, index) => {
            const isEarned = index < earnedCount;
            return (
              <View
                key={fruit.id}
                style={[
                  treeStyles.fruit,
                  { 
                    left: `${fruit.x}%`, 
                    top: `${fruit.y}%`,
                    width: fruitSize,
                    height: fruitSize,
                  },
                  !isEarned && treeStyles.fruitHidden,
                ]}
              >
                <Text style={[treeStyles.fruitEmoji, { fontSize: fruitEmojiSize }]}>
                  {isEarned ? fruit.emoji : '🌿'}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={[
          treeStyles.trunk,
          {
            width: trunkWidth,
            height: trunkHeight,
            marginTop: -spacing.xs,
          }
        ]} />
        <View style={{
          width: groundWidth,
          height: groundHeight,
          backgroundColor: '#A5D6A7',
          borderRadius: 8,
          marginTop: -5,
        }} />
      </View>
    </View>
  );
}

const treeStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // paddingBottom handled dynamically
  },
  sun: {
    position: 'absolute',
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
    // top, left, width, height, borderRadius handled dynamically
  },
  treeContainer: {
    alignItems: 'center',
    // width, height handled dynamically
  },
  foliage: {
    backgroundColor: '#4CAF50',
    position: 'relative',
    zIndex: 2,
    // width, height, borderRadius handled dynamically
  },
  fruit: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // width, height handled dynamically
  },
  fruitHidden: {
    opacity: 0.3,
  },
  fruitEmoji: {
    // fontSize handled dynamically
  },
  trunk: {
    backgroundColor: '#8D6E63',
    zIndex: 1,
    // width, height, marginTop handled dynamically
  },
});

export function MyReadingTreeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { stats, isLoading } = useProgressData(user?.id);
  
  // Responsive layout
  const { spacing, mScale, screenPadding, centeredContent, isTablet } = useResponsiveLayout();
  
  // Responsive font sizes
  const titleSize = mScale(isTablet ? 30 : 26, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const fruitIconEmojiSize = mScale(16, 0.3);
  const earnedCountSize = mScale(20, 0.35);
  const labelSize = mScale(12, 0.3);
  const statValueSize = mScale(24, 0.35);
  const statLabelSize = mScale(12, 0.3);
  const progressTextSize = mScale(16, 0.3);
  const progressDetailSize = mScale(14, 0.3);
  const ctaTextSize = mScale(18, 0.3);
  const shareTextSize = mScale(16, 0.3);
  
  // Responsive sizing
  const fruitIconSize = mScale(40, 0.3);
  const treeAreaMinHeight = mScale(280, 0.4);
  const statBoxMinHeight = mScale(80, 0.3);
  const progressTrackHeight = mScale(12, 0.2);

  if (isLoading) return <LoadingSpinner fullScreen message="Growing your tree..." />;

  const storiesDone = stats?.booksCompleted ?? 0;
  const wordsRead = stats?.totalWordsRead ?? 0;
  const phonicsSkill = stats?.skillProgress?.[0]?.percentage ?? 0;

  const totalFruits = 9;
  const fruitsEarned = Math.min(storiesDone, totalFruits);
  const nextFruitAt = fruitsEarned + 1;

  return (
    <SafeScreen scrollable withPadding={false}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          { padding: screenPadding, paddingTop: spacing.xl },
          centeredContent,
        ]}
      >
        <View style={[styles.header, { alignItems: 'center', marginBottom: spacing.lg }]}>
          <Text style={[styles.title, { fontSize: titleSize, marginBottom: spacing.xs }]}>
            My Reading Tree 🌳
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
            Each fruit = 1 story completed!
          </Text>
        </View>

        <View style={[styles.fruitRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
          <View style={[
            styles.fruitBox, 
            styles.earnedBox,
            { 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center',
              borderRadius: BorderRadius.lg, 
              padding: spacing.md, 
              gap: spacing.sm,
            }
          ]}>
            <View style={[
              styles.fruitIcon,
              {
                width: fruitIconSize,
                height: fruitIconSize,
                borderRadius: fruitIconSize / 2,
              }
            ]}>
              <Text style={{ fontSize: fruitIconEmojiSize }}>🍎</Text>
            </View>
            <View>
              <Text style={[styles.earnedCount, { fontSize: earnedCountSize }]}>×{fruitsEarned}</Text>
              <Text style={[styles.earnedLabel, { fontSize: labelSize }]}>Fruits earned</Text>
            </View>
          </View>
          <View style={[
            styles.fruitBox, 
            styles.growingBox,
            { 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center',
              borderRadius: BorderRadius.lg, 
              padding: spacing.md, 
              gap: spacing.sm,
            }
          ]}>
            <View style={[
              styles.fruitIcon, 
              styles.growingIcon,
              {
                width: fruitIconSize,
                height: fruitIconSize,
                borderRadius: fruitIconSize / 2,
              }
            ]}>
              <Text style={{ fontSize: fruitIconEmojiSize }}>🍎</Text>
            </View>
            <View>
              <Text style={[styles.growingCount, { fontSize: earnedCountSize }]}>×{totalFruits - fruitsEarned}</Text>
              <Text style={[styles.growingLabel, { fontSize: labelSize }]}>Still growing</Text>
            </View>
          </View>
        </View>

        <View style={[
          styles.treeArea,
          {
            backgroundColor: '#E3F2FD',
            borderRadius: BorderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            minHeight: treeAreaMinHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }
        ]}>
          <TreeVisual fruitsEarned={fruitsEarned} />
        </View>

        <View style={[styles.statsRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
          <View style={[
            styles.statBox, 
            { 
              backgroundColor: '#E8F5E9',
              flex: 1,
              borderRadius: BorderRadius.xl,
              padding: spacing.md,
              alignItems: 'center',
              minHeight: statBoxMinHeight,
              justifyContent: 'center',
            }
          ]}>
            <Text style={[
              styles.statValue, 
              { color: '#2E7D32', fontSize: statValueSize, marginBottom: spacing.xs }
            ]}>
              {storiesDone}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize, textAlign: 'center' }]}>
              Stories Done
            </Text>
          </View>
          <View style={[
            styles.statBox, 
            { 
              backgroundColor: Colors.lavender,
              flex: 1,
              borderRadius: BorderRadius.xl,
              padding: spacing.md,
              alignItems: 'center',
              minHeight: statBoxMinHeight,
              justifyContent: 'center',
            }
          ]}>
            <Text style={[
              styles.statValue,
              { color: Colors.purple, fontSize: statValueSize, marginBottom: spacing.xs }
            ]}>
              {wordsRead}
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize, textAlign: 'center' }]}>
              Words Read
            </Text>
          </View>
          <View style={[
            styles.statBox, 
            { 
              backgroundColor: '#FFF8E1',
              flex: 1,
              borderRadius: BorderRadius.xl,
              padding: spacing.md,
              alignItems: 'center',
              minHeight: statBoxMinHeight,
              justifyContent: 'center',
            }
          ]}>
            <Text style={[
              styles.statValue, 
              { color: '#F57C00', fontSize: statValueSize, marginBottom: spacing.xs }
            ]}>
              {phonicsSkill}%
            </Text>
            <Text style={[styles.statLabel, { fontSize: statLabelSize, textAlign: 'center' }]}>
              Letter Skill
            </Text>
          </View>
        </View>

        <View style={[
          styles.progressCard,
          {
            backgroundColor: Colors.white,
            borderRadius: BorderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }
        ]}>
          <Text style={[
            styles.progressText,
            { fontSize: progressTextSize, marginBottom: spacing.md }
          ]}>
            {fruitsEarned < totalFruits
              ? `🍎 Next fruit at ${nextFruitAt} stories!`
              : '🎉 All fruits grown! Amazing reader!'}
          </Text>
          <View style={[
            styles.progressTrack,
            {
              height: progressTrackHeight,
              borderRadius: progressTrackHeight / 2,
              overflow: 'hidden',
              marginBottom: spacing.sm,
            }
          ]}>
            <View style={[
              styles.progressFill, 
              { 
                height: '100%',
                borderRadius: progressTrackHeight / 2,
                width: `${(fruitsEarned / totalFruits) * 100}%`,
              }
            ]} />
          </View>
          <Text style={[
            styles.progressDetail, 
            { fontSize: progressDetailSize, textAlign: 'center' }
          ]}>
            {fruitsEarned} of {totalFruits} fruits grown
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.ctaButton,
            {
              backgroundColor: '#FF9800',
              borderRadius: BorderRadius.xl,
              padding: spacing.lg,
              alignItems: 'center',
              marginBottom: spacing.md,
            }
          ]} 
          onPress={() => navigation.navigate('GamificationMain')}
        >
          <Text style={[styles.ctaText, { fontSize: ctaTextSize }]}>Grow Another Fruit! 🍊</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{
            backgroundColor: '#FFF8E1',
            borderRadius: BorderRadius.xl,
            padding: spacing.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#FFE082',
          }}
        >
          <Text style={[styles.shareText, { fontSize: shareTextSize }]}>Share my tree 🌳</Text>
        </TouchableOpacity>

        <View style={{ height: mScale(100, 0.2) }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: { 
    // alignItems, marginBottom handled dynamically
  },
  title: { 
    fontWeight: '800', 
    color: '#2E7D32',
    // fontSize, marginBottom handled dynamically
  },
  subtitle: { 
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  fruitRow: { 
    flexDirection: 'row',
    // gap, marginBottom handled dynamically
  },
  fruitBox: { 
    backgroundColor: Colors.white,
    ...Shadow.sm,
    // flex, flexDirection, alignItems, borderRadius, padding, gap handled dynamically
  },
  earnedBox: { backgroundColor: '#FFEBEE' },
  growingBox: { backgroundColor: '#F5F5F5' },
  fruitIcon: { 
    backgroundColor: '#EF5350', 
    alignItems: 'center', 
    justifyContent: 'center',
    // width, height, borderRadius handled dynamically
  },
  growingIcon: { backgroundColor: '#E0E0E0' },
  earnedCount: { 
    fontWeight: '800', 
    color: '#C62828',
    // fontSize handled dynamically
  },
  earnedLabel: { 
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  growingCount: { 
    fontWeight: '800', 
    color: Colors.textMuted,
    // fontSize handled dynamically
  },
  growingLabel: { 
    color: Colors.textMuted,
    // fontSize handled dynamically
  },
  treeArea: { 
    // backgroundColor, borderRadius, padding, marginBottom, minHeight, alignItems, justifyContent handled dynamically
  },
  statsRow: { 
    flexDirection: 'row',
    // gap, marginBottom handled dynamically
  },
  statBox: { 
    // backgroundColor, flex, borderRadius, padding, alignItems, minHeight, justifyContent handled dynamically
  },
  statValue: { 
    fontWeight: '800',
    // color, fontSize, marginBottom handled dynamically
  },
  statLabel: { 
    color: Colors.textSecondary,
    // fontSize, textAlign handled dynamically
  },
  progressCard: { 
    ...Shadow.sm,
    // backgroundColor, borderRadius, padding, marginBottom handled dynamically
  },
  progressText: { 
    fontWeight: '700', 
    color: '#2E7D32',
    // fontSize, marginBottom handled dynamically
  },
  progressTrack: { 
    backgroundColor: '#E0E0E0',
    // height, borderRadius, overflow, marginBottom handled dynamically
  },
  progressFill: { 
    backgroundColor: '#FF9800',
    // height, borderRadius, width handled dynamically
  },
  progressDetail: { 
    color: Colors.textMuted,
    // fontSize, textAlign handled dynamically
  },
  ctaButton: { 
    // backgroundColor, borderRadius, padding, alignItems, marginBottom handled dynamically
  },
  ctaText: { 
    color: Colors.white,
    fontWeight: '700',
    // fontSize handled dynamically
  },
  shareText: { 
    color: '#F57C00',
    fontWeight: '600',
    // fontSize handled dynamically
  },
});
