import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type Role = 'CHILD' | 'PARENT' | 'EDUCATOR';

const ROLES: { value: Role; label: string; emoji: string; desc: string }[] = [
  { value: 'CHILD', label: 'I am a Reader', emoji: '📚', desc: 'Ages 7–12, learning to read' },
  { value: 'PARENT', label: 'I am a Parent', emoji: '👩‍👦', desc: 'Supporting my child\'s reading' },
  { value: 'EDUCATOR', label: 'I am a Teacher', emoji: '🧑‍🏫', desc: 'Helping students read better' },
];

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('CHILD');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim() || displayName.length < 2)
      newErrors.displayName = 'Name must be at least 2 characters';
    if (!gender)
      newErrors.gender = 'Please select your gender';
    if (age) {
      const ageNum = parseInt(age, 10);
      if (role === 'CHILD') {
        if (isNaN(ageNum) || ageNum < 3 || ageNum > 18)
          newErrors.age = 'Age must be between 3 and 18';
      } else {
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100)
          newErrors.age = 'Age must be between 18 and 100';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Enter a valid email address';
    if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password))
      newErrors.password = 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password))
      newErrors.password = 'Password must contain at least one number';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        role,
        displayName: displayName.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen scrollable withKeyboard backgroundColor={Colors.cream}>
      <View style={[styles.container, isTablet && styles.containerTablet]}>
        {/* Back button */}
        <TouchableOpacity
        style={styles.backBtn}
        onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, step === 2 && styles.progressLineActive]} />
        <View style={[styles.progressDot, step === 2 && styles.progressDotActive]} />
      </View>

      {step === 1 ? (
        <>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>Step 1 of 2 — Your profile</Text>

          {/* Role selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
                onPress={() => setRole(r.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === r.value }}
                accessibilityLabel={r.label}
              >
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <Text style={[styles.roleLabel, role === r.value && styles.roleLabelSelected]}>
                  {r.label}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ marginBottom: 8 }}>Your name *</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            style={[styles.plainInput, errors.displayName && styles.plainInputError]}
            autoCapitalize="words"
            placeholder="e.g. Aarav"
          />
          {errors.displayName && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.displayName}</Text>}

          {/* Gender Selection */}
          <Text style={{ marginBottom: 8 }}>Gender *</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'MALE' && styles.genderBtnSelected]}
              onPress={() => setGender('MALE')}
            >
              <Text style={styles.genderEmoji}>👦</Text>
              <Text style={[styles.genderLabel, gender === 'MALE' && styles.genderLabelSelected]}>Boy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'FEMALE' && styles.genderBtnSelected]}
              onPress={() => setGender('FEMALE')}
            >
              <Text style={styles.genderEmoji}>👧</Text>
              <Text style={[styles.genderLabel, gender === 'FEMALE' && styles.genderLabelSelected]}>Girl</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.gender}</Text>}

          {/* Age - shown for all roles with different placeholders */}
          <Text style={{ marginBottom: 8 }}>
            Age {role === 'CHILD' ? '(optional)' : '*'}
          </Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            style={[styles.plainInput, errors.age && styles.plainInputError]}
            keyboardType="number-pad"
            placeholder={role === 'CHILD' ? 'e.g. 8' : 'e.g. 35'}
            maxLength={role === 'CHILD' ? 2 : 3}
          />
          {errors.age && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.age}</Text>}

          <Button label="Continue" onPress={handleNext} fullWidth size="lg" />
        </>
      ) : (
        <>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Step 2 of 2 — Sign-in details</Text>

          <Text style={{ marginBottom: 8 }}>Email address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={[styles.plainInput, errors.email && styles.plainInputError]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {errors.email && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.email}</Text>}

          <Text style={{ marginBottom: 8 }}>Password *</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={[styles.plainInput, errors.password && styles.plainInputError]}
            secureTextEntry={!showPassword}
          />
          <Text style={{ fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 16 }}>Min 8 chars, one uppercase, one number</Text>
          {errors.password && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.password}</Text>}

          <Text style={{ marginBottom: 8 }}>Confirm password *</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={[styles.plainInput, errors.confirmPassword && styles.plainInputError]}
            secureTextEntry={!showPassword}
          />
          {errors.confirmPassword && <Text style={{ color: Colors.error, marginBottom: 16 }}>{errors.confirmPassword}</Text>}

          <Button
            label="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            fullWidth
            size="lg"
          />
        </>
      )}

      <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign in</Text>
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
  backBtn: { paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  backText: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '600' },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.purple },
  progressLine: { flex: 1, height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },
  progressLineActive: { backgroundColor: Colors.purple },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  roleGrid: { gap: Spacing.sm, marginBottom: Spacing.xl },
  roleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    borderColor: Colors.purple,
    backgroundColor: Colors.lavender,
  },
  roleEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  roleLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  roleLabelSelected: { color: Colors.purple },
  roleDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  showHide: {
    fontSize: FontSize.sm,
    color: Colors.purple,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: { fontSize: FontSize.md, color: Colors.textSecondary },
  footerLink: { fontSize: FontSize.md, color: Colors.purple, fontWeight: '700' },
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
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  genderBtnSelected: {
    borderColor: Colors.purple,
    backgroundColor: Colors.lavender,
  },
  genderEmoji: {
    fontSize: 24,
  },
  genderLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  genderLabelSelected: {
    color: Colors.purple,
  },
});
