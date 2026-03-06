import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

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
import { formatCurrency } from "@/utils/formatters";
import { Typography } from "@/constants/typography";
import { Spacing, BorderRadius } from "@/constants/colors";

export default function MonthlyStatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    stats,
    isLoading,
    error,
    month,
    year,
    goToPreviousMonth,
    goToNextMonth,
    setMonthYear,
  } = useMonthlyStats();

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Monthly Statistics",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ErrorState
          message="Failed to load monthly statistics"
          onRetry={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Monthly Statistics",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
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
            message="No data available for this month"
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
                  <Text style={styles.financialValue}>
                    {formatCurrency(
                      parseFloat(stats.total_revenue),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel}>Total Revenue</Text>
                </GradientCard>

                <GradientCard
                  colors={[colors.error, "#DC2626"]}
                  style={styles.financialCard}
                >
                  <Ionicons name="trending-down" size={24} color="#FFFFFF" />
                  <Text style={styles.financialValue}>
                    {formatCurrency(
                      parseFloat(stats.total_expenses),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel}>Total Expenses</Text>
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
                  <Text style={styles.financialValue}>
                    {formatCurrency(
                      parseFloat(stats.net_income),
                      stats.currency,
                    )}
                  </Text>
                  <Text style={styles.financialLabel}>Net Income</Text>
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
                    backgroundColor={colors.primaryLight}
                    iconColor={colors.primary}
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
                    backgroundColor={colors.successLight || "#D1FAE5"}
                    iconColor={colors.success}
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
                    backgroundColor={colors.warningLight || "#FEF3C7"}
                    iconColor={colors.warning}
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
                          style={[styles.rankNumber, { color: colors.primary }]}
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
                    backgroundColor={colors.secondaryLight || "#E0E7FF"}
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

const styles = StyleSheet.create({
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
    gap: Spacing.md,
  },
  financialCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    minHeight: 120,
  },
  fullWidth: {
    width: "100%",
    minWidth: "100%",
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
  headerButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});
