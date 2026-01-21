import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, Badge, SearchBar, FilterChip, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';

type FilterType = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'active' | 'inactive';

export default function ProductsScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  // Filter products based on search query and filter
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter((product) => {
        switch (filter) {
          case 'in-stock':
            return product.quantity_available > 10;
          case 'low-stock':
            return product.quantity_available > 0 && product.quantity_available <= 10;
          case 'out-of-stock':
            return product.quantity_available === 0;
          case 'active':
            return product.is_active;
          case 'inactive':
            return !product.is_active;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [products, debouncedSearch, filter]);

  const getStockCount = (type: FilterType) => {
    if (type === 'all') return products.length;
    return products.filter((p) => {
      switch (type) {
        case 'in-stock': return p.quantity_available > 10;
        case 'low-stock': return p.quantity_available > 0 && p.quantity_available <= 10;
        case 'out-of-stock': return p.quantity_available === 0;
        case 'active': return p.is_active;
        case 'inactive': return !p.is_active;
        default: return true;
      }
    }).length;
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load products
        </Text>
      </View>
    );
  }

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Products',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/products/create')}
              style={styles.headerButton}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          onClear={() => setSearchQuery('')}
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
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          count={getStockCount('all')}
        />
        <FilterChip
          label="In Stock"
          selected={filter === 'in-stock'}
          onPress={() => setFilter('in-stock')}
          icon="checkmark-circle"
          count={getStockCount('in-stock')}
        />
        <FilterChip
          label="Low Stock"
          selected={filter === 'low-stock'}
          onPress={() => setFilter('low-stock')}
          icon="warning"
          count={getStockCount('low-stock')}
        />
        <FilterChip
          label="Out of Stock"
          selected={filter === 'out-of-stock'}
          onPress={() => setFilter('out-of-stock')}
          icon="close-circle"
          count={getStockCount('out-of-stock')}
        />
        <FilterChip
          label="Active"
          selected={filter === 'active'}
          onPress={() => setFilter('active')}
          count={getStockCount('active')}
        />
        <FilterChip
          label="Inactive"
          selected={filter === 'inactive'}
          onPress={() => setFilter('inactive')}
          count={getStockCount('inactive')}
        />
      </ScrollView>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            title={searchQuery || filter !== 'all' ? 'No products found' : 'No products yet'}
            message={
              searchQuery || filter !== 'all'
                ? 'No products match your search or filter'
                : 'Add products to track inventory'
            }
            actionLabel={!searchQuery && filter === 'all' ? 'Add Product' : undefined}
            onAction={!searchQuery && filter === 'all' ? () => router.push('/products/create') : undefined}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/products/${item.id}`)}>
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
                  label={item.is_active ? 'Active' : 'Inactive'}
                  variant={item.is_active ? 'success' : 'default'}
                  size="sm"
                />
              </View>

              <View style={styles.productDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Price:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {item.currency} {parseFloat(item.unit_price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Stock:</Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color:
                          item.quantity_available > 10
                            ? colors.success
                            : item.quantity_available > 0
                            ? colors.warning
                            : colors.error,
                      },
                    ]}
                  >
                    {item.quantity_available} units
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
                style={styles.chevron}
              />
            </Card>
          </TouchableOpacity>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  productCard: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: Typography.sizes.sm,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
});
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.sizes.sm,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.sizes.md,
  },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
});
