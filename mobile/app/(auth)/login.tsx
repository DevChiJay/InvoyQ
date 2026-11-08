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
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { AuthField } from "@/components/auth/AuthField";
import { Spacing, BorderRadius, HIT_SLOP } from "@/constants/colors";
import { Typography } from "@/constants/typography";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);
  const { login, isLoggingIn, loginError } = useAuth();
  const { colors } = useTheme();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    login({ username: email.trim(), password: password.trim() });
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
            style={[styles.subtitle, { color: colors.textSecondary }]}
            accessibilityRole="header"
          >
            Sign in to your account
          </Text>
        </View>

        <View style={styles.formContainer}>
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
            textContentType="username"
            returnKeyType="next"
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
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            ref={passwordRef}
            labelAccessory={
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
                hitSlop={HIT_SLOP}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
              >
                <Text
                  style={[styles.forgotPasswordLink, { color: colors.primaryText }]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            }
          />

          {loginError && (
            <View
              accessibilityRole="alert"
              style={[
                styles.errorContainer,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.errorText }]}>
                Invalid email or password
              </Text>
            </View>
          )}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoggingIn}
            disabled={isLoggingIn}
            variant="primary"
            size="lg"
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={styles.linkContainer}
            accessibilityRole="link"
            accessibilityLabel="Don't have an account? Sign up"
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Don't have an account?{" "}
              <Text style={{ fontWeight: "600", color: colors.primaryText }}>
                Sign Up
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
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  forgotPasswordLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
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
  loginButton: {
    marginTop: Spacing.md,
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
