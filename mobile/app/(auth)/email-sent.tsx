import { View, Text, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, BorderRadius } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';

export default function EmailSentScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Card variant="elevated" style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="mail-outline" size={64} color={colors.success} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Verification Email Sent
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            We've sent a verification link to{' '}
            <Text style={{ fontWeight: Typography.weights.semibold }}>
              {email || 'your email address'}
            </Text>
            . Please check your inbox and click the link to verify your account.
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Don't forget to check your spam folder if you don't see the email.
            </Text>
          </View>

          <Button
            title="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            size="lg"
            style={styles.button}
          />

          <Button
            title="Resend Email"
            onPress={() => {
              // TODO: Implement resend verification email
            }}
            variant="outline"
            size="lg"
            style={styles.button}
          />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  card: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
});
