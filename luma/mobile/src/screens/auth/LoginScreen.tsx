import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { useAuth } from '../../contexts/AuthContext';
import { isTablet, FORM_MAX_WIDTH } from '../../utils/responsive';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      shake();
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      shake();
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      Alert.alert('Oops!', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen scrollable withKeyboard backgroundColor={Colors.cream}>
      <View style={[styles.container, isTablet && styles.containerTablet]}>
        <View style={styles.header}>
          <View style={styles.logoMini}>
            <Text style={styles.logoEmoji}>🌟</Text>
          </View>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Sign in to continue reading</Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={{ marginBottom: 8 }}>Email address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={[styles.plainInput, errors.email && styles.plainInputError]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {errors.email && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.email}</Text>}

          <Text style={{ marginBottom: 8 }}>Password *</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            style={[styles.plainInput, errors.password && styles.plainInputError]}
            secureTextEntry={!showPassword}
            autoComplete="password"
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={handleLogin}
          />
          {errors.password && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.password}</Text>}

          <Button
            label="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Try a demo account</Text>
          {[
            { label: '👧 Child (Aarav)', email: 'aarav@luma.app', password: 'Child@123' },
            { label: '👩 Parent', email: 'parent@luma.app', password: 'Parent@123' },
          ].map((demo) => (
            <TouchableOpacity
              key={demo.email}
              style={styles.demoBtn}
              onPress={() => {
                setEmail(demo.email);
                setPassword(demo.password);
              }}
            >
              <Text style={styles.demoBtnText}>{demo.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  containerTablet: {
    maxWidth: FORM_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoMini: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  form: {
    gap: 0,
  },
  loginBtn: {
    marginTop: Spacing.sm,
  },
  showHide: {
    fontSize: FontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  demoSection: {
    gap: Spacing.sm,
  },
  demoTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: Spacing.xs,
  },
  demoBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.softBlue,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoBtnText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.md,
    color: Colors.purple,
    fontWeight: '700',
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