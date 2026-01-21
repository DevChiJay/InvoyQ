import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useInvoice, useDeleteInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { Card } from '@/components/ui';
import { confirmDelete, showError, confirmAction } from '@/utils/alerts';
import { formatCurrency, formatDate } from '@/utils/formatters';

const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'draft':
      return colors.textSecondary;
    case 'sent':
      return colors.info;
    case 'paid':
      return colors.success;
    case 'overdue':
      return colors.error;
    case 'cancelled':
      return colors.textTertiary;
    default:
      return colors.textSecondary;
  }
};

const getStatusBgColor = (status: string, colors: any) => {
  switch (status) {
    case 'draft':
      return colors.textSecondary + '20';
    case 'sent':
      return colors.info + '20';
    case 'paid':
      return colors.success + '20';
    case 'overdue':
      return colors.error + '20';
    case 'cancelled':
      return colors.textTertiary + '20';
    default:
      return colors.textSecondary + '20';
  }
};

export default function InvoiceDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id);
  const deleteInvoice = useDeleteInvoice();
  const updateInvoice = useUpdateInvoice();

  const handleDelete = () => {
    if (!invoice) return;
    confirmDelete(`Invoice ${invoice.number || 'draft'}`, async () => {
      try {
        await deleteInvoice.mutateAsync(id);
        router.back();
      } catch (error: any) {
        showError(error.response?.data?.detail || 'Failed to delete invoice');
      }
    });
  };

  const handleEdit = () => {
    if (invoice?.status !== 'draft') {
      confirmAction(
        'Edit Non-Draft Invoice',
        'This invoice is not a draft. Are you sure you want to edit it?',
        'Edit',
        () => router.push(`/invoices/edit/${id}`)
      );
    } else {
      router.push(`/invoices/edit/${id}`);
    }
  };

  const handleMarkAsPaid = () => {
    confirmAction('Mark as Paid', 'Mark this invoice as paid?', 'Confirm', async () => {
      try {
        await updateInvoice.mutateAsync({ id, data: { status: 'paid' } });
      } catch (error: any) {
        showError(error.response?.data?.detail || 'Failed to update invoice');
      }
    });
  };

  const handleSend = () => {
    confirmAction('Send Invoice', 'Send this invoice to the client?', 'Send', async () => {
      try {
        await updateInvoice.mutateAsync({ id, data: { status: 'sent' } });
      } catch (error: any) {
        showError(error.response?.data?.detail || 'Failed to send invoice');
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Invoice not found</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(invoice.status, colors);
  const statusBgColor = getStatusBgColor(invoice.status, colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: invoice.number || 'Draft Invoice',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Ionicons name="pencil" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{invoice.status.toUpperCase()}</Text>
        </View>

        {/* Total Amount Card */}
        <Card style={styles.totalCard}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            {formatCurrency(parseFloat(invoice.total || '0'), invoice.currency)}
          </Text>
        </Card>

        {/* Client Info Card */}
        {invoice.client && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Client</Text>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{invoice.client.name}</Text>
            </View>
            {invoice.client.email && (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>{invoice.client.email}</Text>
              </View>
            )}
            {invoice.client.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>{invoice.client.phone}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Invoice Details Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice Details</Text>

          {invoice.number && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Invoice Number</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{invoice.number}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Issue Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {invoice.issued_date ? formatDate(invoice.issued_date) : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Due Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Currency</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{invoice.currency}</Text>
          </View>
        </Card>

        {/* Line Items Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Items</Text>

          {invoice.items.map((item, index) => (
            <View key={index} style={[styles.lineItem, index < invoice.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={styles.lineItemHeader}>
                <Text style={[styles.itemDescription, { color: colors.text }]}>{item.description}</Text>
                <Text style={[styles.itemAmount, { color: colors.text }]}>
                  {formatCurrency(parseFloat(item.amount), invoice.currency)}
                </Text>
              </View>
              <View style={styles.lineItemDetails}>
                <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                  {item.quantity} × {formatCurrency(parseFloat(item.unit_price), invoice.currency)}
                </Text>
                {parseFloat(item.tax_rate) > 0 && (
                  <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                    Tax: {item.tax_rate}%
                  </Text>
                )}
              </View>
            </View>
          ))}
        </Card>

        {/* Totals Card */}
        <Card style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalRowLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {formatCurrency(parseFloat(invoice.subtotal || '0'), invoice.currency)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalRowLabel, { color: colors.textSecondary }]}>Tax</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {formatCurrency(parseFloat(invoice.tax || '0'), invoice.currency)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: colors.border }]}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              {formatCurrency(parseFloat(invoice.total || '0'), invoice.currency)}
            </Text>
          </View>
        </Card>

        {/* Notes Card */}
        {invoice.notes && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{invoice.notes}</Text>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {invoice.status === 'draft' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleMarkAsPaid}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  lineItem: {
    paddingVertical: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  lineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetail: {
    fontSize: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRowLabel: {
    fontSize: 14,
  },
  totalRowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  grandTotal: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
  },
});
