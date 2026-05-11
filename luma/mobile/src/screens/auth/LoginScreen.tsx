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
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsiveLayout } from '../../utils/responsiveHelpers';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  
  // Responsive layout
  const { spacing, mScale, screenPadding, formMaxWidth, centeredContent, isTablet } = useResponsiveLayout();
  
  // Responsive font sizes
  const titleSize = mScale(isTablet ? 32 : 28, 0.35);
  const subtitleSize = mScale(16, 0.3);
  const logoEmojiSize = mScale(36, 0.3);
  const inputLabelSize = mScale(14, 0.3);
  const dividerTextSize = mScale(14, 0.3);
  const demoTitleSize = mScale(14, 0.3);
  const demoBtnTextSize = mScale(16, 0.3);
  const footerTextSize = mScale(16, 0.3);
  const inputFontSize = mScale(16, 0.3);
  
  // Responsive sizing
  const logoSize = mScale(72, 0.3);
  const inputMinHeight = mScale(52, 0.2);

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
      <View style={[
        styles.container,
        isTablet && [
          centeredContent,
          { maxWidth: formMaxWidth, width: '100%', paddingVertical: spacing.xl }
        ]
      ]}>
        <View style={[styles.header, { 
          alignItems: 'center', 
          paddingTop: spacing.xxl, 
          paddingBottom: spacing.xl, 
          gap: spacing.sm 
        }]}>
          <View style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize / 2,
            backgroundColor: Colors.lavender,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: logoEmojiSize }}>🌟</Text>
          </View>
          <Text style={[styles.title, { fontSize: titleSize }]}>Welcome back!</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Sign in to continue reading</Text>
        </View>

        <Animated.View style={[styles.form, { gap: 0, transform: [{ translateX: shakeAnim }] }]}>
          <Text style={{ marginBottom: spacing.xs, fontSize: inputLabelSize }}>Email address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={[styles.plainInput, 
              { 
                fontSize: inputFontSize,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.md,
                minHeight: inputMinHeight,
              },
              errors.email && styles.plainInputError
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {errors.email && <Text style={{ color: Colors.error, marginBottom: spacing.lg, fontSize: inputLabelSize }}>{errors.email}</Text>}

          <Text style={{ marginBottom: spacing.xs, fontSize: inputLabelSize }}>Password *</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            style={[styles.plainInput, 
              { 
                fontSize: inputFontSize,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                marginBottom: spacing.md,
                minHeight: inputMinHeight,
              },
              errors.password && styles.plainInputError
            ]}
            secureTextEntry={!showPassword}
            autoComplete="password"
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={handleLogin}
          />
          {errors.password && <Text style={{ color: Colors.error, marginBottom: spacing.lg, fontSize: inputLabelSize }}>{errors.password}</Text>}

          <Button
            label="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            size="lg"
            style={[styles.loginBtn, { marginTop: spacing.sm }]}
          />
        </Animated.View>

        <View style={[styles.divider, { 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: spacing.md, 
          marginVertical: spacing.xl 
        }]}>
          <View style={[styles.dividerLine, { flex: 1, height: 1, backgroundColor: Colors.border }]} />
          <Text style={[styles.dividerText, { fontSize: dividerTextSize }]}>or</Text>
          <View style={[styles.dividerLine, { flex: 1, height: 1, backgroundColor: Colors.border }]} />
        </View>

        <View style={[styles.demoSection, { gap: spacing.sm }]}>
          <Text style={[styles.demoTitle, { fontSize: demoTitleSize, marginBottom: spacing.xs }]}>Try a demo account</Text>
          {[
            { label: '👧 Child (Aarav)', email: 'aarav@luma.app', password: 'Child@123' },
            { label: '👩 Parent', email: 'parent@luma.app', password: 'Parent@123' },
          ].map((demo) => (
            <TouchableOpacity
              key={demo.email}
              style={[styles.demoBtn, { 
                paddingVertical: spacing.md, 
                paddingHorizontal: spacing.lg, 
                borderRadius: BorderRadius.lg,
              }]}
              onPress={() => {
                setEmail(demo.email);
                setPassword(demo.password);
              }}
            >
              <Text style={[styles.demoBtnText, { fontSize: demoBtnTextSize }]}>{demo.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.footer, { 
          flexDirection: 'row', 
          justifyContent: 'center', 
          marginTop: spacing.xxl, 
          paddingBottom: spacing.xl 
        }]}>
          <Text style={[styles.footerText, { fontSize: footerTextSize }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.footerLink, { fontSize: footerTextSize }]}>Sign up</Text>
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
  header: {
    // alignItems, paddingTop, paddingBottom, gap handled dynamically
  },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    // fontSize handled dynamically
  },
  subtitle: {
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    // fontSize handled dynamically
  },
  form: {
    gap: 0,
  },
  loginBtn: {
    // marginTop handled dynamically
  },
  showHide: {
    color: Colors.purple,
    fontWeight: '600',
    // fontSize handled dynamically
  },
  divider: {
    // flexDirection, alignItems, gap, marginVertical handled dynamically
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    // fontSize handled dynamically
  },
  demoSection: {
    // gap handled dynamically
  },
  demoTitle: {
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    // fontSize, marginBottom handled dynamically
  },
  demoBtn: {
    backgroundColor: Colors.softBlue,
    borderWidth: 1,
    borderColor: Colors.border,
    // paddingVertical, paddingHorizontal, borderRadius handled dynamically
  },
  demoBtnText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    // fontSize handled dynamically
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    // marginTop, paddingBottom handled dynamically
  },
  footerText: {
    color: Colors.textSecondary,
    // fontSize handled dynamically
  },
  footerLink: {
    color: Colors.purple,
    fontWeight: '700',
    // fontSize handled dynamically
  },
  plainInput: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    // fontSize, paddingHorizontal, paddingVertical, marginBottom, minHeight handled dynamically
  },
  plainInputError: {
    borderColor: Colors.error,
  },
});