import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type StatusBreakdownProps = {
  /** Only statuses that occur are present; a missing key means 0. */
  counts: Record<string, number>;
};

const STATUS_ORDER = ["paid", "sent", "draft", "overdue", "cancelled"] as const;

const STATUS_LABELS: Record<(typeof STATUS_ORDER)[number], string> = {
  paid: "Paid",
  sent: "Sent",
  draft: "Draft",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

/** One stacked bar showing how this month's invoices split by status, with a labelled legend (colour is never the only cue). */
export function StatusBreakdown({ counts }: StatusBreakdownProps) {
  const { colors } = useTheme();

  const fills: Record<(typeof STATUS_ORDER)[number], string> = {
    paid: colors.success,
    sent: colors.info,
    draft: colors.textTertiary,
    overdue: colors.error,
    cancelled: colors.gold,
  };

  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: Math.max(counts[status] ?? 0, 0),
  }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return (
      <Text style={[styles.empty, { color: colors.textTertiary }]}>
        No invoices issued this month.
      </Text>
    );
  }

  const summary = rows
    .filter((row) => row.count > 0)
    .map((row) => `${row.count} ${STATUS_LABELS[row.status].toLowerCase()}`)
    .join(", ");

  return (
    <View>
      <View
        style={[styles.bar, { backgroundColor: colors.borderLight }]}
        accessible
        accessibilityLabel={`Invoice status: ${summary}`}
      >
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <View
              key={row.status}
              style={{ flex: row.count, backgroundColor: fills[row.status] }}
            />
          ))}
      </View>

      <View style={styles.legend}>
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <View key={row.status} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: fills[row.status] }]} />
              <Text style={[styles.legendLabel, { color: colors.text }]}>
                {STATUS_LABELS[row.status]}
              </Text>
              <Text style={[styles.legendCount, { color: colors.textSecondary }]}>
                {row.count} ({Math.round((row.count / total) * 100)}%)
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    height: 14,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  legend: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
  },
  legendCount: {
    fontSize: Typography.sizes.sm,
  },
  empty: {
    fontSize: Typography.sizes.sm,
  },
});
