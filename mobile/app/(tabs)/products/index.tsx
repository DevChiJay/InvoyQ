import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useProducts } from '@/hooks/useProducts';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';

export default function ProductsScreen() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useProducts();
  const { colors } = useTheme();

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
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No products yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Add products to track inventory
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
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
          </Card>
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
  listContent: {
    padding: Spacing.md,
  },
  productCard: {
    marginBottom: Spacing.md,
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
