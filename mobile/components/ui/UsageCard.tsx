import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useUsage } from "@/hooks/useUsage";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { UsageCounter } from "@/types/usage";

type UsageCardProps = {
  style?: StyleProp<ViewStyle>;
};

/** "1 Dec" from an ISO timestamp; empty string if it can't be parsed. */
function formatResetDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

type UsageRowProps = {
  label: string;
  counter: UsageCounter;
};

function UsageRow({ label, counter }: UsageRowProps) {
  const { colors } = useTheme();
  const { used, limit } = counter;
  if (limit === null) return null;

  const percent = limit > 0 ? (used / limit) * 100 : 100;
  const atLimit = used >= limit;
  const barColor = atLimit
    ? colors.error
    : percent >= 80
      ? colors.warning
      : colors.primary;
  const valueColor = atLimit
    ? colors.errorText
    : percent >= 80
      ? colors.warningText
      : colors.text;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${used} of ${limit} used this month`}
    >
      <View style={styles.rowHeader}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <Text style={[styles.rowValue, { color: valueColor }]}>
          {used} / {limit}
        </Text>
      </View>
      <ProgressBar progress={percent} color={barColor} height={8} />
    </View>
  );
}

/**
 * Free plan allowance for the month. Renders nothing while loading, on error,
 * or when both limits are unlimited (Pro), so it never gets in the way.
 */
export function UsageCard({ style }: UsageCardProps) {
  const { colors } = useTheme();
  const { data } = useUsage();

  if (!data) return null;
  if (data.invoices.limit === null && data.extractions.limit === null) {
    return null;
  }

  const resets = formatResetDate(data.resets_at);

  return (
    <Card variant="elevated" style={style}>
      <Text style={[styles.title, { color: colors.text }]}>
        Free plan usage
      </Text>
      <UsageRow label="Invoices" counter={data.invoices} />
      <UsageRow label="AI extractions" counter={data.extractions} />
      {resets ? (
        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Resets on {resets}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  row: {
    marginBottom: Spacing.md,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: Spacing.xs + 2,
  },
  rowLabel: {
    fontSize: Typography.sizes.sm,
  },
  rowValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  footer: {
    fontSize: Typography.sizes.xs,
  },
});
