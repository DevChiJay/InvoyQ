import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import {
  Card,
  GradientCard,
  MonthNavigator,
  EmptyState,
  ErrorState,
  SkeletonCard,
  IconBadge,
} from "@/components/ui";
import { TrendBarChart } from "@/components/stats/TrendBarChart";
import { DailyAreaChart } from "@/components/stats/DailyAreaChart";
import { StatusBreakdown } from "@/components/stats/StatusBreakdown";
import { relativeChange, toNumber } from "@/components/stats/chartUtils";
import { formatCurrency } from "@/utils/formatters";
import { Typography } from "@/constants/typography";
import { Spacing, BorderRadius } from "@/constants/colors";

export default function MonthlyStatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    stats,
    trend,
    isLoading,
    error,
    month,
    year,
    goToPreviousMonth,
    goToNextMonth,
    setMonthYear,
    refetch,
    refetchAll,
    currency,
  } = useMonthlyStats();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  // The trend ends at the selected month, so the one before it is last month.
  const previous =
    trend && trend.months.length >= 2
      ? trend.months[trend.months.length - 2]
      : undefined;

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          message="Failed to load monthly statistics"
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Month Navigator */}
        <MonthNavigator
          month={month}
          year={year}
          onMonthChange={setMonthYear}
          showTodayButton={true}
        />

        {isLoading ? (
          <>
            <SkeletonCard style={styles.skeletonCard} />
            <SkeletonCard style={styles.skeletonCard} />
            <SkeletonCard style={styles.skeletonCard} />
          </>
        ) : !stats ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No activity this month"
            message="Invoices and expenses you record for this month will show up here."
          />
        ) : (
          <>
            {/* Financial Overview */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Financial Overview
              </Text>
              <View style={styles.financialGrid}>
                <GradientCard
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.financialCard}
                >
                  <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                  <Text
                    style={styles.financialValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatCurrency(
                      parseFloat(stats.total_revenue),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel} numberOfLines={1} adjustsFontSizeToFit>Total Revenue</Text>
                  {previous && (
                    <DeltaLine
                      current={toNumber(stats.total_revenue)}
                      previous={toNumber(previous.revenue)}
                    />
                  )}
                </GradientCard>

                <GradientCard
                  colors={[colors.error, "#DC2626"]}
                  style={styles.financialCard}
                >
                  <Ionicons name="trending-down" size={24} color="#FFFFFF" />
                  <Text
                    style={styles.financialValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatCurrency(
                      parseFloat(stats.total_expenses),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel} numberOfLines={1} adjustsFontSizeToFit>Total Expenses</Text>
                  {previous && (
                    <DeltaLine
                      current={toNumber(stats.total_expenses)}
                      previous={toNumber(previous.expenses)}
                    />
                  )}
                </GradientCard>

                <GradientCard
                  colors={
                    parseFloat(stats.net_income) >= 0
                      ? [colors.success, "#059669"]
                      : [colors.error, "#DC2626"]
                  }
                  style={[styles.financialCard, styles.fullWidth]}
                >
                  <Ionicons
                    name={
                      parseFloat(stats.net_income) >= 0
                        ? "arrow-up-circle"
                        : "arrow-down-circle"
                    }
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text
                    style={styles.financialValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatCurrency(
                      parseFloat(stats.net_income),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel} numberOfLines={1} adjustsFontSizeToFit>Net Income</Text>
                  {previous && (
                    <DeltaLine
                      current={toNumber(stats.net_income)}
                      previous={toNumber(previous.net_income)}
                    />
                  )}
                </GradientCard>
              </View>
            </View>

            {/* Invoices Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Invoices
              </Text>
              <View style={styles.invoiceGrid}>
                <Card
                  style={[styles.statCard, { backgroundColor: colors.surface }]}
                >
                  <IconBadge
                    icon="document-text"
                    backgroundColor={colors.primarySoft}
                    iconColor={colors.primaryText}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.total_invoices}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Total Invoices
                  </Text>
                </Card>

                <Card
                  style={[styles.statCard, { backgroundColor: colors.surface }]}
                >
                  <IconBadge
                    icon="checkmark-circle"
                    backgroundColor={colors.successLight}
                    iconColor={colors.successText}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.paid_invoices}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Paid
                  </Text>
                </Card>

                <Card
                  style={[styles.statCard, { backgroundColor: colors.surface }]}
                >
                  <IconBadge
                    icon="time"
                    backgroundColor={colors.warningLight}
                    iconColor={colors.warningText}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.unpaid_invoices}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    Unpaid
                  </Text>
                </Card>
              </View>
            </View>

            {/* Invoice status */}
            {stats.status_counts && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Invoice Status
                </Text>
                <Card style={{ backgroundColor: colors.surface, padding: Spacing.lg }}>
                  <StatusBreakdown counts={stats.status_counts} />
                </Card>
              </View>
            )}

            {/* Trend (optional: the screen still works if it fails to load) */}
            {trend && trend.months.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Last {trend.months.length} Months
                </Text>
                <Card style={{ backgroundColor: colors.surface, padding: Spacing.md }}>
                  <TrendBarChart
                    points={trend.months}
                    selectedMonth={month}
                    selectedYear={year}
                    currency={currency}
                    onSelect={setMonthYear}
                  />
                </Card>
              </View>
            )}

            {trend && trend.daily.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Daily Activity
                </Text>
                <Card style={{ backgroundColor: colors.surface, padding: Spacing.md }}>
                  <DailyAreaChart points={trend.daily} />
                </Card>
              </View>
            )}

            {/* Products Sold */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Products
              </Text>
              <Card
                style={{ backgroundColor: colors.surface, padding: Spacing.lg }}
              >
                <View style={styles.productsSoldHeader}>
                  <IconBadge
                    icon="cube"
                    backgroundColor={colors.accentLight}
                    iconColor={colors.accent}
                  />
                  <View style={styles.productsSoldInfo}>
                    <Text
                      style={[styles.productsSoldValue, { color: colors.text }]}
                    >
                      {stats.total_products_sold}
                    </Text>
                    <Text
                      style={[
                        styles.productsSoldLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Total Units Sold
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Top Products */}
            {stats.top_products && stats.top_products.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Top 5 Products
                </Text>
                <Card
                  style={{
                    backgroundColor: colors.surface,
                    padding: Spacing.md,
                  }}
                >
                  {stats.top_products.map((product, index) => (
                    <View
                      key={product.product_id || index}
                      style={[
                        styles.topProductItem,
                        { borderBottomColor: colors.border },
                        index === stats.top_products.length - 1 &&
                          styles.lastItem,
                      ]}
                    >
                      <View style={styles.topProductRank}>
                        <Text
                          style={[styles.rankNumber, { color: colors.primaryText }]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.topProductInfo}>
                        <Text
                          style={[
                            styles.topProductName,
                            { color: colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>
                      </View>
                      <View style={styles.topProductQuantity}>
                        <Text
                          style={[styles.quantityValue, { color: colors.text }]}
                        >
                          {product.quantity_sold}
                        </Text>
                        <Text
                          style={[
                            styles.quantityLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          units
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* New Clients */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Clients
              </Text>
              <Card
                style={{ backgroundColor: colors.surface, padding: Spacing.lg }}
              >
                <View style={styles.productsSoldHeader}>
                  <IconBadge
                    icon="people"
                    backgroundColor={colors.secondaryLight}
                    iconColor={colors.secondary}
                  />
                  <View style={styles.productsSoldInfo}>
                    <Text
                      style={[styles.productsSoldValue, { color: colors.text }]}
                    >
                      {stats.new_clients}
                    </Text>
                    <Text
                      style={[
                        styles.productsSoldLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      New Clients Added
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** "▲ 12% vs last month" on a gradient card. "—" when last month had nothing to compare against. */
function DeltaLine({ current, previous }: { current: number; previous: number }) {
  const change = relativeChange(current, previous);
  const text =
    change === null
      ? "— vs last month"
      : `${change > 0 ? "▲" : change < 0 ? "▼" : "•"} ${Math.abs(Math.round(change))}% vs last month`;
  return (
    <Text
      style={styles.deltaText}
      numberOfLines={1}
      adjustsFontSizeToFit
      accessibilityLabel={
        change === null
          ? "No comparison with last month"
          : `${change >= 0 ? "Up" : "Down"} ${Math.abs(Math.round(change))} percent compared with last month`
      }
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  deltaText: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    marginBottom: Spacing.md,
  },
  financialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Spacing.md,
  },
  financialCard: {
    width: "48%",
    padding: Spacing.lg,
    minHeight: 120,
  },
  fullWidth: {
    width: "100%",
  },
  financialValue: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold as any,
    color: "#FFFFFF",
    marginTop: Spacing.sm,
  },
  financialLabel: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  invoiceGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 4,
    textAlign: "center",
  },
  productsSoldHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  productsSoldInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  productsSoldValue: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold as any,
  },
  productsSoldLabel: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
  },
  topProductInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  topProductName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium as any,
  },
  topProductQuantity: {
    alignItems: "flex-end",
  },
  quantityValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
  },
  quantityLabel: {
    fontSize: Typography.sizes.xs,
  },
  skeletonCard: {
    marginBottom: Spacing.md,
  },
});
