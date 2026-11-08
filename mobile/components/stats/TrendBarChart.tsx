import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { formatCurrency } from "@/utils/formatters";
import type { TrendPoint } from "@/services/api/stats";
import { formatCompact, monthShort, toNumber } from "./chartUtils";

type TrendBarChartProps = {
  points: TrendPoint[];
  selectedMonth: number;
  selectedYear: number;
  currency: string;
  onSelect: (month: number, year: number) => void;
};

const HEIGHT = 190;
const GUTTER_LEFT = 44;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

/** Grouped revenue/expense bars per month. The selected month is solid, the rest are dimmed; tap a month to jump to it. */
export function TrendBarChart({
  points,
  selectedMonth,
  selectedYear,
  currency,
  onSelect,
}: TrendBarChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const values = points.flatMap((p) => [toNumber(p.revenue), toNumber(p.expenses)]);
  const max = Math.max(...values, 0);
  const hasData = max > 0;
  const scaleMax = hasData ? max : 1;

  const plotWidth = Math.max(width - GUTTER_LEFT, 0);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = points.length > 0 ? plotWidth / points.length : 0;
  const barWidth = Math.max(Math.min(slot * 0.28, 22), 4);
  const baseline = PAD_TOP + plotHeight;

  const barHeight = (value: number) => (value / scaleMax) * plotHeight;

  return (
    <View onLayout={onLayout} style={styles.wrapper}>
      {width > 0 && (
        <>
          <Svg width={width} height={HEIGHT}>
            {/* Gridlines at 0, 50% and 100% */}
            {[0, 0.5, 1].map((fraction) => {
              const y = baseline - fraction * plotHeight;
              return (
                <G key={fraction}>
                  <Line
                    x1={GUTTER_LEFT}
                    x2={width}
                    y1={y}
                    y2={y}
                    stroke={colors.border}
                    strokeWidth={1}
                    strokeDasharray={fraction === 0 ? undefined : "4 4"}
                  />
                  <SvgText
                    x={GUTTER_LEFT - 6}
                    y={y + 4}
                    fontSize={10}
                    fill={colors.textTertiary}
                    textAnchor="end"
                  >
                    {hasData ? formatCompact(fraction * scaleMax) : fraction === 0 ? "0" : ""}
                  </SvgText>
                </G>
              );
            })}

            {points.map((point, index) => {
              const selected =
                point.month === selectedMonth && point.year === selectedYear;
              const opacity = selected ? 1 : 0.45;
              const center = GUTTER_LEFT + slot * index + slot / 2;
              const revenue = barHeight(toNumber(point.revenue));
              const expenses = barHeight(toNumber(point.expenses));
              return (
                <G key={`${point.year}-${point.month}`}>
                  <Rect
                    x={center - barWidth - 1}
                    y={baseline - revenue}
                    width={barWidth}
                    height={revenue}
                    rx={3}
                    fill={colors.primary}
                    opacity={opacity}
                  />
                  <Rect
                    x={center + 1}
                    y={baseline - expenses}
                    width={barWidth}
                    height={expenses}
                    rx={3}
                    fill={colors.warning}
                    opacity={opacity}
                  />
                  <SvgText
                    x={center}
                    y={HEIGHT - 8}
                    fontSize={11}
                    fontWeight={selected ? "700" : "400"}
                    fill={selected ? colors.text : colors.textSecondary}
                    textAnchor="middle"
                  >
                    {monthShort(point.month)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          {/* Touch + screen-reader targets, one per month column */}
          <View style={[styles.touchRow, { left: GUTTER_LEFT, width: plotWidth }]}>
            {points.map((point) => {
              const selected =
                point.month === selectedMonth && point.year === selectedYear;
              return (
                <TouchableOpacity
                  key={`${point.year}-${point.month}`}
                  style={styles.touchColumn}
                  activeOpacity={0.6}
                  onPress={() => onSelect(point.month, point.year)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${monthShort(point.month)} ${point.year}: revenue ${formatCurrency(
                    toNumber(point.revenue),
                    currency,
                  )}, expenses ${formatCurrency(toNumber(point.expenses), currency)}`}
                />
              );
            })}
          </View>
        </>
      )}

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Revenue" />
        <LegendItem color={colors.warning} label="Expenses" />
      </View>

      {!hasData && width > 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>
          No revenue or expenses in these months yet.
        </Text>
      )}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  touchRow: {
    position: "absolute",
    top: 0,
    height: HEIGHT,
    flexDirection: "row",
  },
  touchColumn: {
    flex: 1,
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
  },
  empty: {
    fontSize: Typography.sizes.xs,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
