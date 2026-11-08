import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { useProducts } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterState } from "@/hooks/useFilterState";
import {
  Card,
  Badge,
  SearchBar,
  FilterChip,
  EmptyState,
  SkeletonList,
  ErrorState,
  FAB,
} from "@/components/ui";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { Spacing } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import { Typography } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useEffect } from "react";

type FilterType =
  | "all"
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "active"
  | "inactive";

export default function ProductsScreen() {
  const { colors } = useTheme();
  const { contentBottom } = useTabBarInset();
  const { filterState, isLoaded, updateFilter } = useFilterState("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useProducts({
    search: debouncedSearch || undefined,
    is_active:
      filter === "active" ? true : filter === "inactive" ? false : undefined,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Restore filter state
  useEffect(() => {
    if (isLoaded) {
      if (filterState.searchQuery) setSearchQuery(filterState.searchQuery);
      if (filterState.selectedFilter)
        setFilter(filterState.selectedFilter as FilterType);
    }
  }, [isLoaded]);

  // Save filter state
  useEffect(() => {
    if (isLoaded && debouncedSearch) {
      updateFilter("searchQuery", debouncedSearch);
    }
  }, [debouncedSearch, isLoaded]);

  useEffect(() => {
    if (isLoaded && filter !== "all") {
      updateFilter("selectedFilter", filter);
    }
  }, [filter, isLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  // Only apply client-side stock-level filtering; search and active/inactive are server-side
  const filteredProducts = useMemo(() => {
    if (filter === "all" || filter === "active" || filter === "inactive") {
      return products;
    }

    return products.filter((product) => {
      switch (filter) {
        case "in-stock":
          return product.quantity_available > 10;
        case "low-stock":
          return (
            product.quantity_available > 0 && product.quantity_available <= 10
          );
        case "out-of-stock":
          return product.quantity_available === 0;
        default:
          return true;
      }
    });
  }, [products, filter]);

  const getStockCount = (type: FilterType) => {
    if (type === "all") return products.length;
    return products.filter((p) => {
      switch (type) {
        case "in-stock":
          return p.quantity_available > 10;
        case "low-stock":
          return p.quantity_available > 0 && p.quantity_available <= 10;
        case "out-of-stock":
          return p.quantity_available === 0;
        case "active":
          return p.is_active;
        case "inactive":
          return !p.is_active;
        default:
          return true;
      }
    }).length;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Products",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          onClear={() => setSearchQuery("")}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <FilterChip
          label="All"
          selected={filter === "all"}
          onPress={() => setFilter("all")}
          count={getStockCount("all")}
        />
        <FilterChip
          label="In Stock"
          selected={filter === "in-stock"}
          onPress={() => setFilter("in-stock")}
          icon="checkmark-circle"
          count={getStockCount("in-stock")}
        />
        <FilterChip
          label="Low Stock"
          selected={filter === "low-stock"}
          onPress={() => setFilter("low-stock")}
          icon="warning"
          count={getStockCount("low-stock")}
        />
        <FilterChip
          label="Out of Stock"
          selected={filter === "out-of-stock"}
          onPress={() => setFilter("out-of-stock")}
          icon="close-circle"
          count={getStockCount("out-of-stock")}
        />
        <FilterChip
          label="Active"
          selected={filter === "active"}
          onPress={() => setFilter("active")}
          count={getStockCount("active")}
        />
        <FilterChip
          label="Inactive"
          selected={filter === "inactive"}
          onPress={() => setFilter("inactive")}
          count={getStockCount("inactive")}
        />
      </ScrollView>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : error ? (
        <ErrorState
          title="Failed to load products"
          message="We couldn't fetch your products. Please check your connection and try again."
          onRetry={refetch}
        />
      ) : (
      <FlatList
        data={filteredProducts}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: contentBottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon="pricetag-outline"
            title={
              searchQuery || filter !== "all"
                ? "No products found"
                : "No products yet"
            }
            message={
              searchQuery || filter !== "all"
                ? "No products match your search or filter"
                : "Add products to track inventory"
            }
            actionLabel={
              !searchQuery && filter === "all" ? "Add Product" : undefined
            }
            onAction={
              !searchQuery && filter === "all"
                ? () => router.push("/products/create")
                : undefined
            }
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primaryText} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Product ${item.name}`}
            onPress={() =>
              router.push({
                pathname: `/products/${item.id}`,
                params: { from: "list" },
              })
            }
          >
            <Card variant="elevated" style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.sku, { color: colors.textSecondary }]}>
                    SKU: {item.sku}
                  </Text>
                </View>
                <Badge
                  label={item.is_active ? "Active" : "Inactive"}
                  variant={item.is_active ? "success" : "default"}
                  size="sm"
                />
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.chevron}
                />
              </View>

              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Price:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatCurrency(parseFloat(item.unit_price), item.currency)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Stock:
                  </Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color:
                          item.quantity_available > 10
                            ? colors.successText
                            : item.quantity_available > 0
                              ? colors.warningText
                              : colors.errorText,
                      },
                    ]}
                  >
                    {item.quantity_available} units
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
      )}

      <FAB
        onPress={() => router.push("/products/create")}
        accessibilityLabel="Add product"
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
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterContainer: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  productCard: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  sku: {
    fontSize: Typography.sizes.sm,
  },
  productDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: Typography.sizes.sm,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
