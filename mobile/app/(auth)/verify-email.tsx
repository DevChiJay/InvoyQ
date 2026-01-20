import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { authApi } from '@/services/api/auth';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token]);

  const handleVerification = async () => {
    if (!token) return;

    setIsVerifying(true);
    try {
      await authApi.verifyEmail(token);
      setVerified(true);
      Alert.alert('Success', 'Email verified! You can now log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Verification failed. The link may be expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card variant="elevated" style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>
          {verified ? 'Email Verified!' : 'Verifying Email...'}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {verified
            ? 'Your email has been verified successfully.'
            : 'Please wait while we verify your email address.'}
        </Text>

        {!token && (
          <Text style={[styles.message, { color: colors.error }]}>
            Invalid verification link
          </Text>
        )}

        <Button
          title={verified ? 'Go to Login' : 'Back to Login'}
          onPress={() => router.replace('/(auth)/login')}
          variant="primary"
          style={styles.button}
          disabled={isVerifying}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});
