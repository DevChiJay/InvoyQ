import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, router } from "expo-router";
import { useInfiniteInvoices } from "@/hooks/useInvoices";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  SearchBar,
  FilterChip,
  EmptyState,
  SkeletonList,
  ErrorState,
  FAB,
} from "@/components/ui";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterState } from "@/hooks/useFilterState";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useState, useCallback, useEffect } from "react";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesScreen() {
  const { colors } = useTheme();
  const { contentBottom } = useTabBarInset();
  const { filterState, isLoaded, updateFilter } = useFilterState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteInvoices({
    search: debouncedSearch || undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    sort_by: "created_at",
    sort_order: -1,
  });

  const invoices = data?.pages.flatMap((p) => p.items) ?? [];

  // Restore filter state
  useEffect(() => {
    if (isLoaded) {
      if (filterState.searchQuery) {
        setSearchQuery(filterState.searchQuery);
      }
      if (filterState.selectedStatus && filterState.selectedStatus !== "all") {
        setSelectedStatus(filterState.selectedStatus);
      } else if (filterState.selectedStatus === "all") {
        updateFilter("selectedStatus", undefined);
      }
    }
  }, [isLoaded]);

  // Save filter state
  useEffect(() => {
    if (isLoaded && debouncedSearch !== undefined) {
      updateFilter("searchQuery", debouncedSearch);
    }
  }, [debouncedSearch, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      if (selectedStatus !== "all") {
        updateFilter("selectedStatus", selectedStatus);
      } else {
        updateFilter("selectedStatus", undefined);
      }
    }
  }, [selectedStatus, isLoaded]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleInvoicePress = (id: string) => {
    router.push({
      pathname: `/invoices/${id}`,
      params: { from: "list" },
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "sent":
        return "info";
      case "overdue":
        return "error";
      case "cancelled":
        return "default";
      default:
        return "warning";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Invoices",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search invoices..."
        />
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              selected={selectedStatus === item.value}
              onPress={() => setSelectedStatus(item.value)}
            />
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Invoice List */}
      {isLoading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState
          title="Failed to load invoices"
          message="We couldn't fetch your invoices. Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
      <FlatList
        data={invoices}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: contentBottom }]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.primaryText}
              style={styles.loadingFooter}
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={
              searchQuery || selectedStatus !== "all"
                ? "No invoices found"
                : "No invoices yet"
            }
            description={
              searchQuery || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice"
            }
            actionLabel={
              !searchQuery && selectedStatus === "all"
                ? "Create Invoice"
                : undefined
            }
            onAction={
              !searchQuery && selectedStatus === "all"
                ? () => router.push("/invoices/create")
                : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleInvoicePress(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Invoice ${item.number || item.id.slice(-6)}, ${item.status}`}
          >
            <Card variant="elevated" style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text
                    style={[styles.invoiceNumber, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {item.number || `INV-${item.id.slice(-6)}`}
                  </Text>
                  {item.client && (
                    <Text
                      style={[
                        styles.clientName,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.client.name}
                    </Text>
                  )}
                </View>
                <Badge
                  label={item.status.toUpperCase()}
                  variant={getStatusVariant(item.status)}
                  size="sm"
                />
              </View>

              <View style={styles.invoiceDetails}>
                {item.issued_date && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Issued: {formatDate(item.issued_date)}
                    </Text>
                  </View>
                )}
                {item.due_date && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Due: {formatDate(item.due_date)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
                <Text
                  style={[styles.totalLabel, { color: colors.textSecondary }]}
                >
                  Total
                </Text>
                <View style={styles.totalRow}>
                  <Text
                    style={[styles.totalAmount, { color: colors.primaryText }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatCurrency(
                      parseFloat(item.total || "0"),
                      item.currency,
                    )}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
      )}

      <FAB
        onPress={() => router.push("/invoices/create")}
        accessibilityLabel="Create invoice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  filtersContainer: {
    paddingBottom: Spacing.sm,
  },
  filtersList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
  },
  loadingFooter: {
    paddingVertical: Spacing.md,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  invoiceNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  clientName: {
    fontSize: Typography.sizes.sm,
  },
  invoiceDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: Typography.sizes.sm,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  totalAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    flexShrink: 1,
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
