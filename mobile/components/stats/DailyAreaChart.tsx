import { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { G, Line, Path, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import type { DailyPoint } from "@/services/api/stats";
import { formatCompact, toNumber } from "./chartUtils";

type DailyAreaChartProps = {
  points: DailyPoint[];
};

const HEIGHT = 150;
const GUTTER_LEFT = 44;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;

/** Revenue (filled area) and expenses (line) for each day of the selected month. */
export function DailyAreaChart({ points }: DailyAreaChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const revenue = points.map((p) => toNumber(p.revenue));
  const expenses = points.map((p) => toNumber(p.expenses));
  const max = Math.max(...revenue, ...expenses, 0);
  const hasData = max > 0;

  const plotWidth = Math.max(width - GUTTER_LEFT - 6, 0);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const baseline = PAD_TOP + plotHeight;
  const lastIndex = Math.max(points.length - 1, 1);

  const x = (index: number) => GUTTER_LEFT + (index / lastIndex) * plotWidth;
  const y = (value: number) => baseline - (value / (hasData ? max : 1)) * plotHeight;

  const linePath = (values: number[]) =>
    values
      .map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`)
      .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath(revenue)} L${x(points.length - 1)},${baseline} L${x(0)},${baseline} Z`
      : "";

  // Day-of-month labels at the start, middle and end.
  const labelIndexes = Array.from(
    new Set([0, Math.floor(points.length / 2), points.length - 1]),
  ).filter((i) => i >= 0 && i < points.length);

  return (
    <View onLayout={onLayout} style={styles.wrapper}>
      {width > 0 && points.length > 0 && (
        <Svg
          width={width}
          height={HEIGHT}
          accessibilityLabel="Daily revenue and expenses for the selected month"
        >
          {[0, 1].map((fraction) => {
            const gy = baseline - fraction * plotHeight;
            return (
              <G key={fraction}>
                <Line
                  x1={GUTTER_LEFT}
                  x2={width}
                  y1={gy}
                  y2={gy}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray={fraction === 0 ? undefined : "4 4"}
                />
                <SvgText
                  x={GUTTER_LEFT - 6}
                  y={gy + 4}
                  fontSize={10}
                  fill={colors.textTertiary}
                  textAnchor="end"
                >
                  {hasData ? formatCompact(fraction * max) : fraction === 0 ? "0" : ""}
                </SvgText>
              </G>
            );
          })}

          {hasData && (
            <>
              <Path d={areaPath} fill={colors.primary} opacity={0.18} />
              <Path
                d={linePath(revenue)}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d={linePath(expenses)}
                fill="none"
                stroke={colors.warning}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </>
          )}

          {labelIndexes.map((index) => (
            <SvgText
              key={index}
              x={x(index)}
              y={HEIGHT - 6}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor={
                index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"
              }
            >
              {String(new Date(`${points[index].date}T00:00:00`).getDate())}
            </SvgText>
          ))}
        </Svg>
      )}

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Revenue" />
        <LegendItem color={colors.warning} label="Expenses" />
      </View>

      {!hasData && width > 0 && (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>
          No daily activity this month.
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
