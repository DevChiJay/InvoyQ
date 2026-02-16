import { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spacing, BorderRadius } from "@/constants/colors";
import { Typography } from "@/constants/typography";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      style={[styles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.subtitle]}>Sign in to your account</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label]}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="rgba(107, 114, 128, 0.7)"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "#1F2937",
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor="rgba(107, 114, 128, 0.7)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.label]}>Password</Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={[styles.forgotPasswordLink]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="rgba(107, 114, 128, 0.7)"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  styles.inputWithRightIcon,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "#1F2937",
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor="rgba(107, 114, 128, 0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="rgba(107, 114, 128, 0.7)"
                />
              </TouchableOpacity>
            </View>
          </View>

          {loginError && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
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
          >
            <Text style={[styles.linkText]}>
              Don't have an account?{" "}
              <Text style={{ fontWeight: "600" }}>Sign Up</Text>
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
    backgroundColor: "#6366F120", // Warm orange background
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
  logo: {
    width: 180,
    height: 54,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
    color: "#fff",
  },
  subtitle: {
    fontSize: Typography.sizes.md,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing.md,
    padding: Spacing.xs,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  forgotPasswordLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.sizes.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: "rgba(255, 255, 255, 0.7)",
  },
  linkContainer: {
    marginTop: Spacing.lg,
    alignItems: "center",
  },
  linkText: {
    fontSize: Typography.sizes.sm,
  },
});
