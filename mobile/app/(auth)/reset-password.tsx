import { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/services/api/auth';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (!token) {
      Alert.alert('Error', 'Invalid reset link', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword(token, password);
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please login with your new password.',
        [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <Ionicons name="key-outline" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your new password below
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Must be at least 8 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
            size="lg"
            style={styles.resetButton}
          />

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={styles.linkContainer}
            disabled={isLoading}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Back to{' '}
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
  hint: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  resetButton: {
    marginTop: Spacing.md,
  },
  linkContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: Typography.sizes.sm,
  },
});
