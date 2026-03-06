import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/typography";
import { Spacing } from "@/constants/colors";

interface MonthNavigatorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  showTodayButton?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthNavigator({
  month,
  year,
  onMonthChange,
  showTodayButton = true,
}: MonthNavigatorProps) {
  const { colors } = useTheme();

  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePrevious}
        style={[styles.navButton, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        {showTodayButton && !isCurrentMonth() && (
          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={[styles.todayText, { color: colors.primary }]}>
              Today
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={[styles.navButton, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.md,
  },
  monthText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    textAlign: "center",
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  todayText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium as any,
  },
});
