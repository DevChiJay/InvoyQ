import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { FormField, Input, TextArea, NumberInput, Select, DatePicker, Button, SelectOption, Card } from '@/components/ui';
import { validateForm, hasErrors, getFieldError } from '@/utils/formHelpers';
import { showError } from '@/utils/alerts';
import { formatCurrency } from '@/utils/formatters';
import { z } from 'zod';

const stepOneSchema = z.object({
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

export default function CreateInvoiceScreen() {
  const { colors } = useTheme();
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients();
  const { data: productsData } = useProducts();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    client_id: '',
    issued_date: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    currency: 'NGN',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clients = clientsData?.items || [];
  const products = productsData?.items || [];

  const clientOptions: SelectOption[] = clients.map((client) => ({
    label: client.name,
    value: client.id,
  }));

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

  const handleNextStep = () => {
    if (currentStep === 1) {
      const validationErrors = validateForm(stepOneSchema, formData);
      if (hasErrors(validationErrors)) {
        setErrors(validationErrors);
        return;
      }
    }

    if (currentStep === 2 && lineItems.length === 0) {
      showError('Please add at least one item');
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const addProductItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newItem: LineItem = {
      id: Date.now().toString(),
      product_id: product.id,
      description: product.name,
      quantity: 1,
      unit_price: parseFloat(product.unit_price),
      tax_rate: parseFloat(product.tax_rate || '0'),
      amount: parseFloat(product.unit_price),
    };

    setLineItems((prev) => [...prev, newItem]);
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

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
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

      await createInvoice.mutateAsync(apiData);
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const totals = calculateTotals();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'New Invoice',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Step Indicator */}
      <View style={[styles.stepIndicator, { borderBottomColor: colors.border }]}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: currentStep >= step ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.stepNumber, { color: currentStep >= step ? '#FFFFFF' : colors.textSecondary }]}>
                {step}
              </Text>
            </View>
            <Text style={[styles.stepLabel, { color: currentStep === step ? colors.text : colors.textSecondary }]}>
              {step === 1 ? 'Details' : step === 2 ? 'Items' : 'Review'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Invoice Details */}
        {currentStep === 1 && (
          <>
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
          </>
        )}

        {/* Step 2: Line Items */}
        {currentStep === 2 && (
          <>
            <View style={styles.itemsActions}>
              <Button
                title="Add from Products"
                onPress={() => {
                  if (products.length === 0) {
                    showError('No products available');
                    return;
                  }
                  // For simplicity, adding first product. In real app, show product selector modal
                  if (products[0]) addProductItem(products[0].id);
                }}
                variant="outline"
                icon="cube-outline"
                style={styles.actionButton}
              />
              <Button
                title="Add Manual Item"
                onPress={addManualItem}
                variant="outline"
                icon="add-outline"
                style={styles.actionButton}
              />
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

            {lineItems.length === 0 && (
              <View style={styles.emptyItems}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items added</Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Add items from products or create manual entries
                </Text>
              </View>
            )}
          </>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <>
            <Card style={styles.reviewCard}>
              <Text style={[styles.reviewTitle, { color: colors.text }]}>Invoice Summary</Text>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Client</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {clients.find((c) => c.id === formData.client_id)?.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Issue Date</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.issued_date.toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Due Date</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {formData.due_date.toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>Currency</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{formData.currency}</Text>
              </View>
            </Card>

            <Card style={styles.reviewCard}>
              <Text style={[styles.reviewTitle, { color: colors.text }]}>Items ({lineItems.length})</Text>

              {lineItems.map((item, index) => (
                <View key={item.id} style={styles.reviewItem}>
                  <Text style={[styles.reviewItemName, { color: colors.text }]}>
                    {index + 1}. {item.description}
                  </Text>
                  <Text style={[styles.reviewItemDetails, { color: colors.textSecondary }]}>
                    {item.quantity} × {formatCurrency(item.unit_price, formData.currency)}
                    {item.tax_rate > 0 && ` (+${item.tax_rate}% tax)`}
                  </Text>
                  <Text style={[styles.reviewItemAmount, { color: colors.text }]}>
                    {formatCurrency(item.amount, formData.currency)}
                  </Text>
                </View>
              ))}
            </Card>

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
          </>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {currentStep > 1 && (
          <Button
            title="Back"
            onPress={handlePreviousStep}
            variant="outline"
            style={styles.button}
          />
        )}
        {currentStep < 3 ? (
          <Button
            title="Next"
            onPress={handleNextStep}
            variant="primary"
            style={[styles.button, currentStep === 1 && styles.fullButton]}
          />
        ) : (
          <Button
            title={createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            onPress={handleSubmit}
            variant="primary"
            disabled={createInvoice.isPending}
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemsActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
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
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 14,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  reviewItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  reviewItemDetails: {
    fontSize: 12,
    marginBottom: 4,
  },
  reviewItemAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalsCard: {
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
  fullButton: {
    flex: 1,
  },
});
