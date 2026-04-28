import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingSuccess'>;

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiParticle({ delay, x, color }: { delay: number; x: number; color: string }) {
  const fall = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(fall, {
            toValue: 700,
            duration: 2800,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(fall, { toValue: -40, duration: 0, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: fall }, { rotate: spin }],
      }}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  Colors.purple, Colors.orange, Colors.success, Colors.purpleLight, Colors.orangeLight,
];

export function OnboardingSuccessScreen({ navigation }: Props) {
  const { setOnboardingComplete } = useAuth();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 8,
        stiffness: 120,
        mass: 0.8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEnterApp = () => {
    setOnboardingComplete();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeScreen backgroundColor={Colors.cream}>
      {/* Confetti particles — non-distracting, gentle */}
      {Array.from({ length: 12 }, (_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 180}
          x={(i / 12) * 360 + Math.random() * 30}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]!}
        />
      ))}

      <View style={styles.container}>
        {/* Star burst */}
        <Animated.View
          style={[styles.starBurst, { transform: [{ scale: scaleAnim }] }]}
        >
          <Text style={styles.starEmoji}>⭐</Text>
        </Animated.View>

        {/* Text */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', gap: Spacing.md }}>
          <Text style={styles.title}>You're all set! 🎉</Text>
          <Text style={styles.subtitle}>
            Your reading adventure starts now.{'\n'}
            Let's find a great story for you!
          </Text>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {['📚 Reader', '⚡ Streak', '🏆 Points'].map((badge) => (
              <View key={badge} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrapper, { opacity: fadeAnim }]}>
          <Button
            label="Start Reading! 🚀"
            onPress={handleEnterApp}
            fullWidth
            size="lg"
            variant="primary"
          />
          <Text style={styles.hint}>
            You can change your reading settings anytime
          </Text>
        </Animated.View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xxl,
  },
  starBurst: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: { fontSize: 72 },
  title: {
    fontSize: FontSize.display,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ctaWrapper: {
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
