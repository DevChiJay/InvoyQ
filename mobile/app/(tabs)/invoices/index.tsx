import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Stack, router } from "expo-router";
import { useInvoices } from "@/hooks/useInvoices";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  SearchBar,
  FilterChip,
  EmptyState,
  SkeletonList,
  ErrorState,
} from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterState } from "@/hooks/useFilterState";
import { Spacing } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useState, useMemo, useEffect } from "react";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export default function InvoicesScreen() {
  const { data, isLoading, error, refetch } = useInvoices();
  const { colors } = useTheme();
  const { filterState, isLoaded, updateFilter } = useFilterState("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Restore filter state
  useEffect(() => {
    if (isLoaded) {
      if (filterState.searchQuery) {
        setSearchQuery(filterState.searchQuery);
      }
      // Only restore status if it's not 'all'
      if (filterState.selectedStatus && filterState.selectedStatus !== "all") {
        setSelectedStatus(filterState.selectedStatus);
      } else if (filterState.selectedStatus === "all") {
        // Clear 'all' from storage since it's the default
        updateFilter("selectedStatus", undefined);
      }
    }
  }, [isLoaded]);

  // Save filter state
  useEffect(() => {
    if (isLoaded && debouncedSearch) {
      updateFilter("searchQuery", debouncedSearch);
    }
  }, [debouncedSearch, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      // Only save status if it's not 'all' (which is the default)
      if (selectedStatus !== "all") {
        updateFilter("selectedStatus", selectedStatus);
      } else {
        // Remove from storage when set to 'all'
        updateFilter("selectedStatus", undefined);
      }
    }
  }, [selectedStatus, isLoaded]);

  const invoices = data || [];

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        !debouncedSearch ||
        invoice.number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        invoice.client?.name
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || invoice.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, debouncedSearch, selectedStatus]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: invoices.length };
    statusFilters.forEach((filter) => {
      if (filter.value !== "all") {
        counts[filter.value] = invoices.filter(
          (i) => i.status === filter.value,
        ).length;
      }
    });
    return counts;
  }, [invoices]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Invoices",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <SkeletonList count={6} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Invoices",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <ErrorState
          title="Failed to load invoices"
          message="We couldn't fetch your invoices. Please check your connection and try again."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Invoices",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/invoices/create")}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
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
              count={filterCounts[item.value] || 0}
              selected={selectedStatus === item.value}
              onPress={() => setSelectedStatus(item.value)}
            />
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
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
            onActionPress={
              !searchQuery && selectedStatus === "all"
                ? () => router.push("/invoices/create")
                : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleInvoicePress(item.id)}>
            <Card variant="elevated" style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                  <Text style={[styles.invoiceNumber, { color: colors.text }]}>
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

              <View style={styles.totalContainer}>
                <Text
                  style={[styles.totalLabel, { color: colors.textSecondary }]}
                >
                  Total
                </Text>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/invoices/create")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerButton: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  totalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
