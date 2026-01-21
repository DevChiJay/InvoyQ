import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useInvoice, useUpdateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { FormField, Input, TextArea, NumberInput, Select, DatePicker, Button, SelectOption, Card } from '@/components/ui';
import { validateForm, hasErrors, getFieldError } from '@/utils/formHelpers';
import { showError } from '@/utils/alerts';
import { formatCurrency } from '@/utils/formatters';
import { z } from 'zod';

const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  issued_date: z.date({ required_error: 'Issue date is required' }),
  due_date: z.date({ required_error: 'Due date is required' }),
  currency: z.string().min(1, 'Currency is required'),
});

const currencyOptions: SelectOption[] = [
  { label: 'NGN - Nigerian Naira', value: 'NGN' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
];

interface LineItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export default function EditInvoiceScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoice();
  const { data: clientsData } = useClients();

  const [formData, setFormData] = useState({
    client_id: '',
    issued_date: new Date(),
    due_date: new Date(),
    currency: 'NGN',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clients = clientsData?.items || [];

  const clientOptions: SelectOption[] = clients.map((client) => ({
    label: client.name,
    value: client.id,
  }));

  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id || '',
        issued_date: invoice.issued_date ? new Date(invoice.issued_date) : new Date(),
        due_date: invoice.due_date ? new Date(invoice.due_date) : new Date(),
        currency: invoice.currency || 'NGN',
        notes: invoice.notes || '',
      });

      const items: LineItem[] = invoice.items.map((item, idx) => ({
        id: `${idx}`,
        product_id: item.product_id || undefined,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        amount: parseFloat(item.amount),
      }));

      setLineItems(items);
    }
  }, [invoice]);

  const handleChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        const qty = typeof updated.quantity === 'number' ? updated.quantity : parseFloat(updated.quantity as string) || 0;
        const price = typeof updated.unit_price === 'number' ? updated.unit_price : parseFloat(updated.unit_price as string) || 0;
        const tax = typeof updated.tax_rate === 'number' ? updated.tax_rate : parseFloat(updated.tax_rate as string) || 0;

        updated.amount = qty * price * (1 + tax / 100);
        return updated;
      })
    );
  };

  const addManualItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      amount: 0,
    };

    setLineItems((prev) => [...prev, newItem]);
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const amount = item.quantity * item.unit_price;
      return sum + amount;
    }, 0);

    const tax = lineItems.reduce((sum, item) => {
      const amount = item.quantity * item.unit_price;
      const taxAmount = (amount * item.tax_rate) / 100;
      return sum + taxAmount;
    }, 0);

    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(invoiceSchema, formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    if (lineItems.length === 0) {
      showError('Please add at least one item');
      return;
    }

    try {
      const items = lineItems.map((item) => ({
        product_id: item.product_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
      }));

      const apiData = {
        client_id: formData.client_id,
        issued_date: formData.issued_date.toISOString(),
        due_date: formData.due_date.toISOString(),
        currency: formData.currency,
        notes: formData.notes || undefined,
        items,
      };

      await updateInvoice.mutateAsync({ id, data: apiData });
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update invoice');
    }
  };

  if (invoiceLoading) {
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

  const totals = calculateTotals();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Invoice',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {invoice.status !== 'draft' && (
          <View style={[styles.warningBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              This invoice is {invoice.status}. Editing may affect the invoice history.
            </Text>
          </View>
        )}

        <FormField label="Client" required error={getFieldError(errors, 'client_id')}>
          <Select
            value={formData.client_id}
            onChange={(value) => handleChange('client_id', value)}
            options={clientOptions}
            placeholder="Select client"
            error={!!errors.client_id}
          />
        </FormField>

        <FormField label="Issue Date" required error={getFieldError(errors, 'issued_date')}>
          <DatePicker
            value={formData.issued_date}
            onChange={(value) => handleChange('issued_date', value)}
            mode="date"
            error={!!errors.issued_date}
          />
        </FormField>

        <FormField label="Due Date" required error={getFieldError(errors, 'due_date')}>
          <DatePicker
            value={formData.due_date}
            onChange={(value) => handleChange('due_date', value)}
            mode="date"
            error={!!errors.due_date}
          />
        </FormField>

        <FormField label="Currency" required error={getFieldError(errors, 'currency')}>
          <Select
            value={formData.currency}
            onChange={(value) => handleChange('currency', value)}
            options={currencyOptions}
            placeholder="Select currency"
            error={!!errors.currency}
          />
        </FormField>

        <FormField label="Notes (Optional)">
          <TextArea
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Add any additional notes"
            numberOfLines={4}
          />
        </FormField>

        {/* Line Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Line Items</Text>
          <TouchableOpacity onPress={addManualItem}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {lineItems.map((item, index) => (
          <Card key={item.id} style={styles.lineItemCard}>
            <View style={styles.lineItemHeader}>
              <Text style={[styles.lineItemTitle, { color: colors.text }]}>Item {index + 1}</Text>
              <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>

            <FormField label="Description" required>
              <Input
                value={item.description}
                onChangeText={(value) => updateLineItem(item.id, 'description', value)}
                placeholder="Item description"
              />
            </FormField>

            <View style={styles.row}>
              <FormField label="Quantity" required style={styles.halfField}>
                <NumberInput
                  value={item.quantity.toString()}
                  onChangeValue={(value) => updateLineItem(item.id, 'quantity', parseFloat(value) || 0)}
                  placeholder="1"
                  decimals={0}
                  min={0}
                />
              </FormField>

              <FormField label="Unit Price" required style={styles.halfField}>
                <NumberInput
                  value={item.unit_price.toString()}
                  onChangeValue={(value) => updateLineItem(item.id, 'unit_price', parseFloat(value) || 0)}
                  placeholder="0.00"
                  decimals={2}
                  min={0}
                />
              </FormField>
            </View>

            <View style={styles.row}>
              <FormField label="Tax Rate %" style={styles.halfField}>
                <NumberInput
                  value={item.tax_rate.toString()}
                  onChangeValue={(value) => updateLineItem(item.id, 'tax_rate', parseFloat(value) || 0)}
                  placeholder="0"
                  decimals={2}
                  min={0}
                  max={100}
                />
              </FormField>

              <View style={styles.halfField}>
                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={[styles.amountValue, { color: colors.text }]}>
                  {formatCurrency(item.amount, formData.currency)}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Totals Summary */}
        <Card style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(totals.subtotal, formData.currency)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Tax</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(totals.tax, formData.currency)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
              {formatCurrency(totals.total, formData.currency)}
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={updateInvoice.isPending ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          variant="primary"
          disabled={updateInvoice.isPending}
          style={styles.button}
        />
      </View>
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
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  lineItemCard: {
    marginBottom: 16,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  totalsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  grandTotalRow: {
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
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
  },
});
