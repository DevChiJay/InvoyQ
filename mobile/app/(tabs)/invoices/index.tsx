import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useInvoices } from '@/hooks/useInvoices';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function InvoicesScreen() {
  const { data: invoices, isLoading, error } = useInvoices();
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
          Failed to load invoices
        </Text>
      </View>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No invoices yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create your first invoice
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={[styles.invoiceNumber, { color: colors.text }]}>
                  {item.number || `INV-${item.id.slice(-6)}`}
                </Text>
                {item.client && (
                  <Text style={[styles.clientName, { color: colors.textSecondary }]}>
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
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Issued: {format(new Date(item.issued_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}
              {item.due_date && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Due: {format(new Date(item.due_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.totalContainer}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {item.currency} {item.total ? parseFloat(item.total).toFixed(2) : '0.00'}
              </Text>
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
  invoiceCard: {
    marginBottom: Spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: Typography.sizes.sm,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  totalAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
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
