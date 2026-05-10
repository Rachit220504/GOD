import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';

interface TreeDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  progress: {
    totalXP: number;
    level: number;
    fruitsHarvested: number;
    wordsRead: number;
    booksCompleted: number;
    currentStreak: number;
    maxStreak: number;
  };
}

export function TreeDetailsModal({ visible, onClose, progress }: TreeDetailsModalProps) {
  const getTreeStage = (level: number) => {
    if (level < 2) return { name: 'Seed', description: 'Just planted', emoji: '🌰' };
    if (level < 4) return { name: 'Sprout', description: 'First signs of life', emoji: '🌱' };
    if (level < 6) return { name: 'Sapling', description: 'Growing strong', emoji: '🌿' };
    if (level < 8) return { name: 'Young Tree', description: 'Taking shape', emoji: '🌳' };
    if (level < 10) return { name: 'Fruit Tree', description: 'Bearing fruit', emoji: '🌳' };
    return { name: 'Ancient Tree', description: 'Mighty and wise', emoji: '🌳' };
  };

  const treeStage = getTreeStage(progress.level);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tree Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tree Overview */}
          <View style={styles.section}>
            <View style={styles.treeHeader}>
              <Text style={styles.treeEmoji}>{treeStage.emoji}</Text>
              <View style={styles.treeInfo}>
                <Text style={styles.treeName}>{treeStage.name}</Text>
                <Text style={styles.treeDescription}>{treeStage.description}</Text>
                <Text style={styles.treeLevel}>Level {progress.level}</Text>
              </View>
            </View>
          </View>

          {/* Progress Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{progress.totalXP}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{progress.wordsRead}</Text>
                <Text style={styles.statLabel}>Words Read</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{progress.fruitsHarvested}</Text>
                <Text style={styles.statLabel}>Fruits</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{progress.booksCompleted}</Text>
                <Text style={styles.statLabel}>Books</Text>
              </View>
            </View>
          </View>

          {/* Streak Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reading Streaks</Text>
            <View style={styles.streakCard}>
              <View style={styles.streakRow}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{progress.currentStreak} days 🔥</Text>
              </View>
              <View style={styles.streakRow}>
                <Text style={styles.streakLabel}>Best Streak</Text>
                <Text style={styles.streakValue}>{progress.maxStreak} days ⭐</Text>
              </View>
            </View>
          </View>

          {/* Growth Milestones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth Milestones</Text>
            <View style={styles.milestoneList}>
              {[
                { xp: 50, name: 'First Sprout', completed: progress.totalXP >= 50 },
                { xp: 150, name: 'Sapling Stage', completed: progress.totalXP >= 150 },
                { xp: 300, name: 'Young Tree', completed: progress.totalXP >= 300 },
                { xp: 500, name: 'First Fruits', completed: progress.totalXP >= 500 },
                { xp: 800, name: 'Blooming Tree', completed: progress.totalXP >= 800 },
                { xp: 1200, name: 'Mature Tree', completed: progress.totalXP >= 1200 },
              ].map((milestone, index) => (
                <View key={index} style={styles.milestoneItem}>
                  <View style={[styles.milestoneIcon, milestone.completed && styles.milestoneCompleted]}>
                    <Text style={styles.milestoneEmoji}>
                      {milestone.completed ? '✅' : '🔒'}
                    </Text>
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneName}>{milestone.name}</Text>
                    <Text style={styles.milestoneXP}>Required: {milestone.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth Tips</Text>
            <View style={styles.tipsCard}>
              <Text style={styles.tipText}>📚 Read daily to maintain your streak</Text>
              <Text style={styles.tipText}>🍎 Harvest fruits for bonus XP</Text>
              <Text style={styles.tipText}>⭐ Complete achievements for rewards</Text>
              <Text style={styles.tipText}>🔥 Longer streaks = more XP bonuses</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.screen,
    backgroundColor: Colors.purple,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  treeEmoji: {
    fontSize: 60,
    marginRight: Spacing.lg,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  treeDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  treeLevel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.purple,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  streakValue: {
    fontSize: FontSize.md,
    color: Colors.purple,
    fontWeight: '800',
  },
  milestoneList: {
    gap: Spacing.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  milestoneCompleted: {
    backgroundColor: '#D1FAE5',
  },
  milestoneEmoji: {
    fontSize: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  milestoneXP: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  tipText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
});
