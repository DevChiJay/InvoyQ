import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { isGoogleSignInConfigured } from "@/hooks/useGoogleAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type GoogleSignInSectionProps = {
  mode: "login" | "register";
};

/** "or" divider plus the Google button. Renders nothing when this build has no Google client ids. */
export function GoogleSignInSection({ mode }: GoogleSignInSectionProps) {
  const { colors } = useTheme();

  if (!isGoogleSignInConfigured) return null;

  return (
    <View>
      <View style={styles.dividerRow} accessibilityElementsHidden>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
          OR
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <GoogleSignInButton
        mode={mode}
        onSuccess={() => router.replace("/(tabs)")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
});
