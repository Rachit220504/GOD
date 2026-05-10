// DEPRECATED: This screen is replaced by GamificationScreen
// Keeping minimal export to prevent build errors during migration
import { View, Text } from 'react-native';

export function ProgressScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Navigate to new Gamification screen</Text>
    </View>
  );
}
  },
});

// ─── Badge Component ──────────────────────────────────────────────────────────

function Badge({
  emoji,
  label,
  earned,
}: {
  emoji: string;
  label: string;
  earned: boolean;
}) {
  return (
    <View style={b.container}>
      <View style={[b.circle, earned && b.circleEarned]}>
        <Text style={b.emoji}>{earned ? emoji : '🔒'}</Text>
      </View>
      <Text style={b.label}>{label}</Text>
    </View>
  );
}

const b = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 100,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEarned: {
    backgroundColor: '#FFF8E0',
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const JOURNEY_CARDS = [
  { title: 'My Growing Plant', emoji: '🌱', color: '#E8F5E9', route: 'MyGrowingPlant' as const },
  { title: 'My Fruit Tree', emoji: '🌳', color: '#FFF3E0', route: 'MyReadingTree' as const },
  { title: 'My Star Galaxy', emoji: '✨', color: '#FFF8E1', route: 'MyStarGalaxy' as const },
  { title: 'Reading Journey', emoji: '🚗', color: '#F3E5F5', route: 'ReadingJourney' as const },
];

const BADGES = [
  { emoji: '🎖️', label: 'First Word', threshold: 1, field: 'totalWordsRead' as const },
  { emoji: '🔥', label: '7-Day Streak', threshold: 7, field: 'currentStreak' as const },
  { emoji: '⭐', label: 'Phonics Star', threshold: 5, field: 'lettersLearned' as const },
  { emoji: '📖', label: 'Brave Reader', threshold: 1, field: 'booksCompleted' as const },
  { emoji: '📚', label: 'Story Finisher', threshold: 5, field: 'booksCompleted' as const },
  { emoji: '🔤', label: 'Super Speller', threshold: 10, field: 'lettersLearned' as const },
];

const DEFAULT_SKILLS: SkillProgress[] = [
  { name: 'Letter Recognition', percentage: 0, color: '#6C5CE7' },
  { name: 'Sound Blending', percentage: 0, color: '#00B894' },
  { name: 'Syllable Awareness', percentage: 0, color: '#E84393' },
  { name: 'Reading Fluency', percentage: 0, color: '#E17055' },
];

export function ProgressScreen({ navigation }: Props) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Empty</Text>
      <Text style={styles.emptyText}>This screen is empty.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});
