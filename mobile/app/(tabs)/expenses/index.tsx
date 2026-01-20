import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useExpenses } from '@/hooks/useExpenses';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ExpensesScreen() {
  const { data, isLoading, error } = useExpenses();
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
          Failed to load expenses
        </Text>
      </View>
    );
  }

  const expenses = data?.items ?? [];

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('travel')) return 'airplane-outline';
    if (categoryLower.includes('food') || categoryLower.includes('meal')) return 'restaurant-outline';
    if (categoryLower.includes('office')) return 'briefcase-outline';
    if (categoryLower.includes('utilities')) return 'flash-outline';
    if (categoryLower.includes('software')) return 'laptop-outline';
    return 'receipt-outline';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No expenses yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Track your business expenses
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.expenseCard}>
            <View style={styles.expenseHeader}>
              <IconBadge
                icon={getCategoryIcon(item.category)}
                size={40}
                backgroundColor={colors.accentLight + '20'}
                iconColor={colors.accent}
              />
              <View style={styles.expenseInfo}>
                <Text style={[styles.description, { color: colors.text }]}>
                  {item.description}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.category, { color: colors.textSecondary }]}>
                    {item.category}
                  </Text>
                  {item.vendor && (
                    <>
                      <Text style={[styles.separator, { color: colors.textTertiary }]}>•</Text>
                      <Text style={[styles.vendor, { color: colors.textSecondary }]}>
                        {item.vendor}
                      </Text>
                    </>
                  )}
                </View>
                <Text style={[styles.date, { color: colors.textTertiary }]}>
                  {format(new Date(item.expense_date), 'MMM dd, yyyy')}
                </Text>
              </View>
              <Text style={[styles.amount, { color: colors.error }]}>
                -{item.currency} {parseFloat(item.amount).toFixed(2)}
              </Text>
            </View>

            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.primaryLight + '20' }]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
                {item.tags.length > 3 && (
                  <Text style={[styles.moreTag, { color: colors.textSecondary }]}>
                    +{item.tags.length - 3} more
                  </Text>
                )}
              </View>
            )}
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
  expenseCard: {
    marginBottom: Spacing.md,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  amount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    alignSelf: 'center',
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
});
