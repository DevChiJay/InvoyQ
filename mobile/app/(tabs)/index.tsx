import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/useAuth";
import {
  useInvoices,
  useInvoiceStats,
  INVOICE_KEYS,
} from "@/hooks/useInvoices";
import {
  useExpenses,
  useExpenseSummary,
  EXPENSE_KEYS,
} from "@/hooks/useExpenses";
import {
  useProducts,
  useProductStats,
  PRODUCT_KEYS,
} from "@/hooks/useProducts";
import { useClients, useClientStats, CLIENT_KEYS } from "@/hooks/useClients";
import { USAGE_KEYS } from "@/hooks/useUsage";
import { UsageCard } from "@/components/ui/UsageCard";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { router, useNavigation } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { GradientCard } from "@/components/ui/GradientCard";
import { Card } from "@/components/ui/Card";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { IconBadge } from "@/components/ui/IconBadge";
import { Badge } from "@/components/ui/Badge";
import { Spacing } from "@/constants/colors";
import { FAB } from "@/components/ui/FAB";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { contentBottom } = useTabBarInset();
  const scrollY = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh: every dashboard query lives under one of these prefix keys,
  // so refetching them re-pulls all the cards and recent lists (no new endpoint needed).
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        [
          INVOICE_KEYS.all,
          EXPENSE_KEYS.all,
          PRODUCT_KEYS.all,
          CLIENT_KEYS.all,
          USAGE_KEYS.all,
        ].map((queryKey) => queryClient.refetchQueries({ queryKey })),
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch accurate stats from dedicated endpoints
  const { data: statsData, isLoading: statsLoading } = useInvoiceStats();
  const { data: clientStatsData, isLoading: clientStatsLoading } =
    useClientStats();
  const { data: productStatsData, isLoading: productStatsLoading } =
    useProductStats();
  const { data: expenseSummaryData, isLoading: expenseSummaryLoading } =
    useExpenseSummary();

  // Fetch limited data for display in "Recent" sections
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    limit: 5,
  });
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({
    limit: 5,
  });
  const { data: productsData, isLoading: productsLoading } = useProducts({
    limit: 5,
  });
  const { data: clients, isLoading: clientsLoading } = useClients({ limit: 5 });

  const expenses = expensesData?.items || [];
  const products = productsData?.pages?.[0]?.items || [];
  const recentInvoices = invoicesData?.items ?? [];

  // Use accurate stats from API instead of calculating from limited list
  const stats = statsData?.stats;
  const totalRevenue = stats ? parseFloat(stats.total_revenue) : 0;
  const collectedAmount = stats ? parseFloat(stats.paid_amount) : 0;
  const pendingAmount = stats ? parseFloat(stats.pending_amount) : 0;
  const paidInvoices = stats?.paid_count || 0;
  const totalInvoices = stats?.total_count || 0;
  const collectionRate =
    totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  // Client and product stats from dedicated endpoints
  const totalClients = clientStatsData?.stats?.total_count || 0;
  const productStats = productStatsData?.stats;
  const totalProducts = productStats?.total_count || 0;
  const lowStockProducts = productStats?.low_stock_count || 0;

  // Use accurate total from expense summary API (all expenses, not just recent 5)
  const totalExpenses = expenseSummaryData
    ? parseFloat(expenseSummaryData.grand_total)
    : 0;

  const isLoading =
    statsLoading ||
    clientStatsLoading ||
    productStatsLoading ||
    expenseSummaryLoading ||
    invoicesLoading ||
    expensesLoading ||
    productsLoading ||
    clientsLoading;

  // Hide/show header title on scroll
  useEffect(() => {
    // Only update the header when crossing the threshold, not on every frame.
    // Nothing is applied on mount, so the title shows until the first scroll.
    let scrolled: boolean | undefined;
    const apply = (isScrolled: boolean) => {
      if (scrolled === isScrolled) return;
      scrolled = isScrolled;
      navigation.setOptions({
        headerTitle: isScrolled ? "Dashboard" : "",
        headerStyle: {
          backgroundColor: isScrolled ? colors.surface : "transparent",
        },
      });
    };
    const listener = scrollY.addListener(({ value }) => apply(value > 50));

    return () => scrollY.removeListener(listener);
  }, [scrollY, navigation, colors]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primaryText} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingTop: insets.top + 44, paddingBottom: contentBottom },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={insets.top + 44}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.full_name || "User"}!
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={[
              "rgba(99, 102, 241, 0.05)",
              "rgba(99, 102, 241, 0.02)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.statsBackground}
          >
            <View style={styles.statsGrid}>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/invoices")}
                activeOpacity={0.8}
                style={styles.statCardWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Total revenue ${formatCurrency(totalRevenue)}. Open invoices`}
              >
                <GradientCard
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.statCard}
                  shadowColor={colors.primary}
                >
                  <View style={styles.statIconWrapper}>
                    <Ionicons name="trending-up" size={26} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatCurrency(totalRevenue)}
                  </Text>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
                    Total Revenue
                  </Text>
                </GradientCard>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/expenses")}
                activeOpacity={0.8}
                style={styles.statCardWrapper}
                accessibilityRole="button"
                accessibilityLabel={`Total expenses ${formatCurrency(totalExpenses)}. Open expenses`}
              >
                <GradientCard
                  colors={[colors.error, "#DC2626"]}
                  style={styles.statCard}
                  shadowColor={colors.error}
                >
                  <View style={styles.statIconWrapper}>
                    <Ionicons name="trending-down" size={26} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {formatCurrency(totalExpenses)}
                  </Text>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
                    Total Expenses
                  </Text>
                </GradientCard>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/invoices")}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <Card variant="elevated" style={styles.quickStatCard}>
                  <View style={styles.quickStatContent}>
                    <IconBadge
                      icon="document-text-outline"
                      backgroundColor={colors.accentLight + "20"}
                      iconColor={colors.accent}
                      size={40}
                    />
                    <View style={styles.quickStatInfo}>
                      <Text
                        style={[styles.quickStatValue, { color: colors.text }]}
                      >
                        {totalInvoices}
                      </Text>
                      <Text
                        style={[
                          styles.quickStatLabel,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        Invoices
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/clients")}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <Card variant="elevated" style={styles.quickStatCard}>
                  <View style={styles.quickStatContent}>
                    <IconBadge
                      icon="people-outline"
                      backgroundColor={colors.primaryLight + "20"}
                      iconColor={colors.primaryText}
                      size={40}
                    />
                    <View style={styles.quickStatInfo}>
                      <Text
                        style={[styles.quickStatValue, { color: colors.text }]}
                      >
                        {totalClients}
                      </Text>
                      <Text
                        style={[
                          styles.quickStatLabel,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        Clients
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/products")}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <Card variant="elevated" style={styles.quickStatCard}>
                  <View style={styles.quickStatContent}>
                    <IconBadge
                      icon="pricetag-outline"
                      backgroundColor={colors.gold + "20"}
                      iconColor={colors.gold}
                      size={40}
                    />
                    <View style={styles.quickStatInfo}>
                      <Text
                        style={[styles.quickStatValue, { color: colors.text }]}
                      >
                        {totalProducts}
                      </Text>
                      <Text
                        style={[
                          styles.quickStatLabel,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        Products
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Plan usage (hidden on Pro) */}
        <UsageCard style={styles.usageCard} />

        {/* Monthly Stats Card */}
        <TouchableOpacity
          onPress={() => router.push("/stats/monthly")}
          activeOpacity={0.8}
          style={styles.monthlyStatsContainer}
        >
          <Card variant="elevated" style={styles.monthlyStatsCard}>
            <View style={styles.monthlyStatsContent}>
              <View style={styles.monthlyStatsLeft}>
                <View
                  style={[
                    styles.monthlyStatsIconContainer,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons name="bar-chart" size={28} color={colors.primaryText} />
                </View>
                <View style={styles.monthlyStatsText}>
                  <Text
                    style={[styles.monthlyStatsTitle, { color: colors.text }]}
                  >
                    Monthly Statistics
                  </Text>
                  <Text
                    style={[
                      styles.monthlyStatsSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    View detailed monthly breakdown
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Collection Rate */}
        <Card variant="elevated" style={styles.collectionCard}>
          <View style={styles.collectionHeader}>
            <Text style={[styles.collectionTitle, { color: colors.text }]}>
              Collection Rate
            </Text>
            <Badge
              label={`${paidInvoices}/${totalInvoices} paid`}
              variant="success"
              size="sm"
            />
          </View>
          <View style={styles.collectionContent}>
            <CircularProgress
              percentage={collectionRate}
              size={100}
              strokeWidth={10}
              color={colors.successText}
              showPercentage
            />
            <View style={styles.collectionStats}>
              <View style={styles.collectionStat}>
                <Text
                  style={[
                    styles.collectionStatValue,
                    { color: colors.successText },
                  ]}
                >
                  {formatCurrency(collectedAmount)}
                </Text>
                <Text
                  style={[
                    styles.collectionStatLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Collected
                </Text>
              </View>
              <View style={styles.collectionStat}>
                <Text
                  style={[styles.collectionStatValue, { color: colors.errorText }]}
                >
                  {formatCurrency(pendingAmount)}
                </Text>
                <Text
                  style={[
                    styles.collectionStatLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Pending
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Alerts */}
        {lowStockProducts > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/products")}
            activeOpacity={0.7}
          >
            <Card variant="elevated" style={styles.alertCard}>
              <View
                style={[
                  styles.alertContent,
                  { backgroundColor: colors.warningLight },
                ]}
              >
                <Ionicons name="warning" size={24} color={colors.warningText} />
                <View style={styles.alertText}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    Low Stock Alert
                  </Text>
                  <Text
                    style={[
                      styles.alertMessage,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {lowStockProducts} product{lowStockProducts > 1 ? "s" : ""}{" "}
                    running low on stock
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Recent Invoices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Invoices
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/invoices")}>
              <Text style={[styles.sectionLink, { color: colors.primaryText }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.length > 0 ? (
            recentInvoices.slice(0, 3).map((invoice) => (
              <Card key={invoice.id} variant="elevated" style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View>
                    <Text
                      style={[styles.listItemTitle, { color: colors.text }]}
                    >
                      {invoice.number || `INV-${invoice.id.slice(-6)}`}
                    </Text>
                    <Text
                      style={[
                        styles.listItemSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {invoice.client?.name || "Unknown Client"}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text
                      style={[styles.listItemAmount, { color: colors.primaryText }]}
                    >
                      {formatCurrency(invoice.total || "0", invoice.currency)}
                    </Text>
                    <Badge
                      label={invoice.status.toUpperCase()}
                      variant={
                        invoice.status === "paid"
                          ? "success"
                          : invoice.status === "sent"
                            ? "info"
                            : invoice.status === "overdue"
                              ? "error"
                              : "warning"
                      }
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No invoices yet
            </Text>
          )}
        </View>

        {/* Recent Expenses */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Expenses
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
              <Text style={[styles.sectionLink, { color: colors.primaryText }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {expenses && expenses.length > 0 ? (
            expenses.slice(0, 3).map((expense) => (
              <Card key={expense.id} variant="elevated" style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View style={styles.expenseInfo}>
                    <IconBadge
                      icon="receipt-outline"
                      backgroundColor={colors.accentLight + "20"}
                      iconColor={colors.accent}
                      size={32}
                    />
                    <View>
                      <Text
                        style={[styles.listItemTitle, { color: colors.text }]}
                      >
                        {expense.description}
                      </Text>
                      <Text
                        style={[
                          styles.listItemSubtitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {expense.category} • {formatDate(expense.expense_date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.expenseAmount, { color: colors.errorText }]}>
                    -{formatCurrency(expense.amount, expense.currency)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No expenses yet
            </Text>
          )}
        </View>
      </Animated.ScrollView>

      <FAB
        onPress={() => router.push("/(tabs)/invoices/create")}
        accessibilityLabel="Create invoice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  statsSection: {
    overflow: "hidden",
  },
  statsBackground: {
    paddingBottom: Spacing.xl,
  },
  statCardWrapper: {
    flex: 1,
    minHeight: 150,
  },
  greeting: {
    fontSize: Typography.sizes.md,
  },
  userName: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 150,
    justifyContent: "flex-end",
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: "#FFFFFF",
    marginTop: 2,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
    fontWeight: Typography.weights.medium,
    letterSpacing: 0.3,
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickStatCard: {
    flex: 1,
    padding: Spacing.sm,
  },
  quickStatContent: {
    alignItems: "center",
  },
  quickStatInfo: {
    marginTop: Spacing.xs,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  quickStatLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  usageCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  monthlyStatsContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  monthlyStatsCard: {
    padding: Spacing.lg,
  },
  monthlyStatsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthlyStatsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  monthlyStatsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  monthlyStatsText: {
    flex: 1,
  },
  monthlyStatsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  monthlyStatsSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  collectionCard: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  collectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  collectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  collectionStats: {
    flex: 1,
    gap: Spacing.md,
  },
  collectionStat: {},
  collectionStatValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  collectionStatLabel: {
    fontSize: Typography.sizes.sm,
  },
  alertCard: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  alertMessage: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  lastSection: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  sectionLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  listItem: {
    marginBottom: Spacing.sm,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  listItemSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  listItemRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  listItemAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  expenseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  expenseAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: "center",
    padding: Spacing.lg,
  },
});
