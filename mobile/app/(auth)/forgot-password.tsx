import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/services/api/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { colors } = useTheme();

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.requestPasswordReset(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.successIconContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="mail-outline" size={48} color={colors.success} />
              </View>
            </View>

            <Text style={[styles.successTitle, { color: colors.text }]}>
              Check Your Email
            </Text>

            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
              We've sent a password reset link to{' '}
              <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
            </Text>

            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </Text>

            <Button
              title="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backButton}
            />

            <TouchableOpacity
              onPress={() => setEmailSent(false)}
              style={styles.linkContainer}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                Didn't receive the email?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we'll send you a link to reset your password
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title="Send Reset Link"
            onPress={handleSendResetLink}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            size="lg"
            style={styles.sendButton}
          />

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkContainer}
            disabled={isLoading}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Remember your password?{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 180,
    height: 54,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  formCard: {
    padding: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  sendButton: {
    marginTop: Spacing.md,
  },
  linkContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: Typography.sizes.sm,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successMessage: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  instructionText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
});
