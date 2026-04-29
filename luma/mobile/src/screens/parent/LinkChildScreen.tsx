import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { SafeScreen } from '../../components/common/SafeScreen';
import { Button } from '../../components/ui/Button';
import { profileApi } from '../../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'ParentDashboard'>;

export function LinkChildScreen({ navigation }: Props) {
  const [childEmail, setChildEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLinkChild = async () => {
    if (!childEmail.trim()) {
      setError('Please enter a child email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await profileApi.linkChild(childEmail.trim());
      Alert.alert('Success', result.message);
      setChildEmail('');
      navigation.goBack();
    } catch (err: unknown) {
      let message = 'Failed to link child account';
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        // Handle specific 409 conflict errors from backend
        if (errorMsg.includes('already linked to your account')) {
          message = 'This child is already linked to your account';
        } else if (errorMsg.includes('already linked to another parent')) {
          message = 'This child is linked to another parent account';
        } else if (errorMsg.includes('not registered as a child')) {
          message = 'This account is not a child account';
        } else if (errorMsg.includes('no user found')) {
          message = 'No account found with this email';
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen scrollable withKeyboard backgroundColor={Colors.cream}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.title}>Link Child Account</Text>
        <Text style={styles.subtitle}>
          Enter your child's email address to link their account to yours
        </Text>
      </View>

      {/* Input */}
      <View style={styles.form}>
        <Text style={styles.label}>Child's Email Address</Text>
        <TextInput
          value={childEmail}
          onChangeText={(text) => {
            setChildEmail(text);
            if (error) setError('');
          }}
          style={[styles.input, error && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="child@example.com"
          editable={!isLoading}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          label={isLoading ? 'Linking...' : 'Link Child Account'}
          onPress={handleLinkChild}
          isLoading={isLoading}
          fullWidth
          size="lg"
          style={styles.linkBtn}
        />
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Enter the email address your child used to register{'\n'}
          • They must have a CHILD account type{'\n'}
          • Once linked, you can view their reading progress{'\n'}
          • A child can only be linked to one parent
        </Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.purple,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
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
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  linkBtn: {
    marginTop: Spacing.sm,
  },
  infoBox: {
    backgroundColor: Colors.lavender,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.purple,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
