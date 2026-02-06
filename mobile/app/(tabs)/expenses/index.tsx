import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Stack, router } from "expo-router";
import { useExpenses } from "@/hooks/useExpenses";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/Card";
import { IconBadge } from "@/components/ui/IconBadge";
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

const categoryFilters = [
  {
    label: "All",
    value: "all",
    icon: "apps" as keyof typeof Ionicons.glyphMap,
  },
  {
    label: "Food & Dining",
    value: "food-dining",
    icon: "restaurant" as keyof typeof Ionicons.glyphMap,
  },
  {
    label: "Transportation",
    value: "transportation",
    icon: "car" as keyof typeof Ionicons.glyphMap,
  },
  {
    label: "Office",
    value: "office-supplies",
    icon: "briefcase" as keyof typeof Ionicons.glyphMap,
  },
  {
    label: "Utilities",
    value: "utilities",
    icon: "flash" as keyof typeof Ionicons.glyphMap,
  },
  {
    label: "Other",
    value: "other",
    icon: "ellipsis-horizontal" as keyof typeof Ionicons.glyphMap,
  },
];

export default function ExpensesScreen() {
  const { data, isLoading, error, refetch } = useExpenses();
  const { colors } = useTheme();
  const { filterState, isLoaded, updateFilter } = useFilterState("expenses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Restore filter state
  useEffect(() => {
    if (isLoaded) {
      if (filterState.searchQuery) setSearchQuery(filterState.searchQuery);
      if (filterState.selectedFilter)
        setSelectedCategory(filterState.selectedFilter);
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
      if (selectedCategory !== "all") {
        updateFilter("selectedFilter", selectedCategory);
      } else {
        updateFilter("selectedFilter", "");
      }
    }
  }, [selectedCategory, isLoaded]);

  const expenses = data?.items ?? [];

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        !debouncedSearch ||
        expense.description
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        expense.category
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || expense.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, debouncedSearch, selectedCategory]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: expenses.length };
    categoryFilters.forEach((filter) => {
      if (filter.value !== "all") {
        counts[filter.value] = expenses.filter(
          (e) => e.category === filter.value,
        ).length;
      }
    });
    return counts;
  }, [expenses]);

  const getCategoryIcon = (
    category: string,
  ): keyof typeof Ionicons.glyphMap => {
    const categoryMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "food-dining": "restaurant",
      transportation: "car",
      "office-supplies": "briefcase",
      utilities: "flash",
      rent: "home",
      salaries: "people",
      marketing: "megaphone",
      other: "ellipsis-horizontal",
    };
    return categoryMap[category] || "pricetag";
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleExpensePress = (id: string) => {
    router.push({
      pathname: `/expenses/${id}`,
      params: { from: "list" },
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Expenses",
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
            title: "Expenses",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <ErrorState
          title="Failed to load expenses"
          message="We couldn't fetch your expenses. Please check your connection and try again."
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Expenses",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/expenses/create")}
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
          placeholder="Search expenses..."
        />
      </View>

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              count={filterCounts[item.value] || 0}
              selected={selectedCategory === item.value}
              onPress={() => setSelectedCategory(item.value)}
              icon={item.icon}
            />
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
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
            icon="receipt-outline"
            title={
              searchQuery || selectedCategory !== "all"
                ? "No expenses found"
                : "No expenses yet"
            }
            description={
              searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters"
                : "Track your business expenses"
            }
            actionLabel={
              !searchQuery && selectedCategory === "all"
                ? "Add Expense"
                : undefined
            }
            onActionPress={
              !searchQuery && selectedCategory === "all"
                ? () => router.push("/expenses/create")
                : undefined
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleExpensePress(item.id)}>
            <Card variant="elevated" style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <IconBadge
                  icon={getCategoryIcon(item.category)}
                  size={40}
                  backgroundColor={colors.accentLight + "20"}
                  iconColor={colors.accent}
                />
                <View style={styles.expenseInfo}>
                  <Text style={[styles.description, { color: colors.text }]}>
                    {item.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text
                      style={[styles.category, { color: colors.textSecondary }]}
                    >
                      {item.category}
                    </Text>
                    {item.vendor && (
                      <>
                        <Text
                          style={[
                            styles.separator,
                            { color: colors.textTertiary },
                          ]}
                        >
                          •
                        </Text>
                        <Text
                          style={[
                            styles.vendor,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.vendor}
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={[styles.date, { color: colors.textTertiary }]}>
                    {formatDate(item.expense_date)}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amount, { color: colors.error }]}>
                    {formatCurrency(parseFloat(item.amount), item.currency)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tag,
                        { backgroundColor: colors.primaryLight + "20" },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                  {item.tags.length > 3 && (
                    <Text
                      style={[styles.moreTag, { color: colors.textSecondary }]}
                    >
                      +{item.tags.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/expenses/create")}
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
  expenseCard: {
    marginBottom: Spacing.md,
  },
  expenseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  description: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  category: {
    fontSize: Typography.sizes.sm,
  },
  separator: {
    fontSize: Typography.sizes.sm,
  },
  vendor: {
    fontSize: Typography.sizes.sm,
  },
  date: {
    fontSize: Typography.sizes.xs,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  moreTag: {
    fontSize: Typography.sizes.xs,
    alignSelf: "center",
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
