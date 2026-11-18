import { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import {
  ReferralSourcePicker,
  referralPayload,
} from "@/components/auth/ReferralSourcePicker";
import { Spacing, BorderRadius } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { ReferralAnswer, ReferralSource } from "@/types/auth";

type WelcomeModalProps = {
  visible: boolean;
  firstName: string | null;
  /** Show "How did you hear about InvoyQ?" (Google sign-ups never saw the register form) */
  askReferral: boolean;
  /** Called with the referral answer (empty if none) before closing */
  onCreateInvoice: (answer: ReferralAnswer) => void;
  onDismiss: (answer: ReferralAnswer) => void;
};

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const STEPS: ReadonlyArray<Step> = [
  {
    icon: "document-text-outline",
    title: "Create your first invoice",
    body: "Add a client, your items and a due date. It takes about a minute.",
  },
  {
    icon: "sparkles-outline",
    title: "Or let AI fill it in",
    body: "On the new invoice screen, tap Extract with AI and paste a chat or screenshot.",
  },
  {
    icon: "share-outline",
    title: "Send it and get paid",
    body: "Share the PDF with your client and track when it's paid.",
  },
];

export function WelcomeModal({
  visible,
  firstName,
  askReferral,
  onCreateInvoice,
  onDismiss,
}: WelcomeModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [referralSource, setReferralSource] = useState<ReferralSource | null>(null);
  const [referralOther, setReferralOther] = useState("");

  const answer = () => (askReferral ? referralPayload(referralSource, referralOther) : {});

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onDismiss(answer())}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="rocket-outline" size={40} color={colors.primaryText} />
          </View>

          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {firstName ? `Welcome to InvoyQ, ${firstName}!` : "Welcome to InvoyQ!"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You're all set. Let's get your first invoice out the door.
          </Text>

          <View style={styles.steps}>
            {STEPS.map((step, index) => (
              <View
                key={step.title}
                style={[
                  styles.step,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={step.icon} size={22} color={colors.primaryText} />
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    {index + 1}. {step.title}
                  </Text>
                  <Text style={[styles.stepBody, { color: colors.textSecondary }]}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {askReferral && (
            <ReferralSourcePicker
              source={referralSource}
              otherText={referralOther}
              onChangeSource={setReferralSource}
              onChangeOtherText={setReferralOther}
            />
          )}

          <View style={styles.actions}>
            <Button
              title="Create your first invoice"
              onPress={() => onCreateInvoice(answer())}
              variant="primary"
              size="lg"
            />
            <Button
              title="Maybe later"
              onPress={() => onDismiss(answer())}
              variant="ghost"
              size="md"
              style={styles.later}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  steps: {
    marginBottom: Spacing.md,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  stepBody: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  actions: {
    marginTop: "auto",
    paddingTop: Spacing.md,
  },
  later: {
    marginTop: Spacing.sm,
  },
});
