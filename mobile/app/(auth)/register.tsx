import { useRef, useState } from "react";
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
  Linking,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { AuthField } from "@/components/auth/AuthField";
import { Spacing, BorderRadius } from "@/constants/colors";
import { Typography } from "@/constants/typography";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const { register, isRegistering, registerError } = useAuth();
  const { colors } = useTheme();

  const handleRegister = () => {
    if (!email || !fullName || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    register(
      {
        email: email.trim(),
        full_name: fullName.trim(),
        password: password.trim(),
        registration_source: "mobile",
      },
      {
        onSuccess: () => {
          router.replace(
            `/(auth)/email-sent?email=${encodeURIComponent(email.trim())}`,
          );
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join Invoyq to manage your business
          </Text>
        </View>

        <View style={styles.formContainer}>
          <AuthField
            label="Full Name"
            icon="person-outline"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <AuthField
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            ref={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <AuthField
            label="Password"
            icon="lock-closed-outline"
            password
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            ref={passwordRef}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <AuthField
            label="Confirm Password"
            icon="lock-closed-outline"
            password
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            ref={confirmRef}
            onSubmitEditing={handleRegister}
          />

          {registerError && (
            <View
              accessibilityRole="alert"
              style={[
                styles.errorContainer,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.errorText }]}>
                Registration failed. Please try again.
              </Text>
            </View>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isRegistering}
            disabled={isRegistering}
            variant="primary"
            size="lg"
            style={styles.registerButton}
          />

          <View style={styles.privacyContainer}>
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              By continuing, you agree to our{" "}
              <Text
                style={[styles.privacyLink, { color: colors.primaryText }]}
                accessibilityRole="link"
                onPress={() =>
                  Linking.openURL(
                    `${process.env.EXPO_PUBLIC_FRONTEND_URL}/privacy`,
                  )
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkContainer}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign in"
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Already have an account?{" "}
              <Text style={{ fontWeight: "600", color: colors.primaryText }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: "center",
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    textAlign: "center",
  },
  registerButton: {
    marginTop: Spacing.md,
  },
  privacyContainer: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  privacyText: {
    fontSize: Typography.sizes.xs,
    textAlign: "center",
  },
  privacyLink: {
    fontWeight: Typography.weights.semibold,
    textDecorationLine: "underline",
  },
  linkContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: {
    fontSize: Typography.sizes.sm,
    textAlign: "center",
  },
});
