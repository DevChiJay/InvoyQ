import { View, Text, StyleSheet } from "react-native";
import { FilterChip } from "@/components/ui/FilterChip";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { ReferralAnswer, ReferralSource } from "@/types/auth";

const OPTIONS: ReadonlyArray<{ value: ReferralSource; label: string }> = [
  { value: "instagram", label: "Instagram" },
  { value: "friend", label: "A friend" },
  { value: "x", label: "X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "app_store", label: "App store search" },
  { value: "other", label: "Other" },
];

export const REFERRAL_OTHER_MAX_LENGTH = 200;

type ReferralSourcePickerProps = {
  source: ReferralSource | null;
  otherText: string;
  onChangeSource: (source: ReferralSource | null) => void;
  onChangeOtherText: (text: string) => void;
};

/** Optional "How did you hear about InvoyQ?" chips, with free text for "Other". */
export function ReferralSourcePicker({
  source,
  otherText,
  onChangeSource,
  onChangeOtherText,
}: ReferralSourcePickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]} nativeID="referral-label">
        How did you hear about InvoyQ?{" "}
        <Text style={{ color: colors.textTertiary, fontWeight: Typography.weights.regular }}>
          (optional)
        </Text>
      </Text>
      <View style={styles.chips} accessibilityLabelledBy="referral-label">
        {OPTIONS.map((option) => (
          <View key={option.value} style={styles.chip}>
            <FilterChip
              label={option.label}
              selected={source === option.value}
              // Tapping the selected chip again clears the answer
              onPress={() => onChangeSource(source === option.value ? null : option.value)}
            />
          </View>
        ))}
      </View>
      {source === "other" && (
        <Input
          placeholder="Tell us where"
          accessibilityLabel="Where did you hear about InvoyQ?"
          value={otherText}
          onChangeText={onChangeOtherText}
          maxLength={REFERRAL_OTHER_MAX_LENGTH}
          returnKeyType="done"
          style={styles.otherInput}
        />
      )}
    </View>
  );
}

/** Request fields for an answer; empty when nothing was picked. */
export function referralPayload(source: ReferralSource | null, otherText: string): ReferralAnswer {
  if (!source) return {};
  const other = otherText.trim();
  return source === "other" && other
    ? { referral_source: source, referral_source_other: other }
    : { referral_source: source };
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    marginBottom: Spacing.sm,
  },
  otherInput: {
    marginTop: Spacing.xs,
  },
});
