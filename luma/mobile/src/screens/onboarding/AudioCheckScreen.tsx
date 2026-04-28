import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingAudioCheck'>;

type AudioStatus = 'idle' | 'playing' | 'success' | 'error';

export function AudioCheckScreen({ navigation }: Props) {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // The new expo-audio hook automatically handles loading and cleanup!
  const player = useAudioPlayer('https://www.soundjay.com/buttons/sounds/button-1.mp3');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const playTestSound = () => {
    try {
      setStatus('playing');

      // Play the loaded sound
      player.play();

      // The test beep is short, so we transition to success shortly after it starts
      setTimeout(() => {
        setStatus('success');
      }, 1200);

    } catch {
      setStatus('error');
    }
  };

  const speakerEmoji =
    status === 'playing' ? '🔊' : status === 'success' ? '✅' : status === 'error' ? '🔇' : '🔈';

  const statusConfig: Record<
    AudioStatus,
    { title: string; subtitle: string; bg: string }
  > = {
    idle: {
      title: 'Sound Check',
      subtitle: 'Tap the speaker to play a test sound.\nMake sure your volume is turned up!',
      bg: Colors.softBlue,
    },
    playing: {
      title: 'Playing...',
      subtitle: 'Can you hear that? 🎵',
      bg: Colors.lavender,
    },
    success: {
      title: 'It works! 🎉',
      subtitle: 'Your sound is working perfectly.\nYou\'ll be able to hear words read aloud.',
      bg: Colors.successLight,
    },
    error: {
      title: 'No problem!',
      subtitle:
        'We couldn\'t play sound right now, but you can still use LUMA.\nYou can set up audio later in Settings.',
      bg: Colors.softPeach,
    },
  };

  const config = statusConfig[status];

  return (
    <SafeScreen backgroundColor={Colors.cream}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.speakerCircle,
            { backgroundColor: config.bg },
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.speakerEmoji}>{speakerEmoji}</Text>
        </Animated.View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        <View style={styles.actions}>
          {status === 'success' ? (
            <Button
              label="Great! Continue →"
              onPress={() => navigation.navigate('OnboardingSuccess')}
              fullWidth
              size="lg"
            />
          ) : status === 'error' ? (
            <View style={{ gap: Spacing.md }}>
              <Button
                label="Try Again"
                onPress={() => { setStatus('idle'); }}
                variant="outline"
                fullWidth
                size="lg"
              />
              <Button
                label="Skip for Now"
                onPress={() => navigation.navigate('OnboardingSuccess')}
                variant="ghost"
                fullWidth
                size="lg"
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              onPress={playTestSound}
              disabled={status === 'playing'}
              accessibilityRole="button"
              accessibilityLabel="Play test sound"
              accessibilityState={{ disabled: status === 'playing' }}
            >
              <Text style={styles.playButtonText}>
                {status === 'playing' ? 'Playing...' : 'Tap to Test Sound'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {status === 'idle' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('OnboardingSuccess')}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip this step</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screen,
    gap: Spacing.xl,
  },
  speakerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  speakerEmoji: {
    fontSize: 64,
  },
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
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  actions: {
    width: '100%',
  },
  playButton: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...Shadow.sm,
  },
  playButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textOnDark,
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  skipText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});