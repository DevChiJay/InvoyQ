import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useCreateExpense } from '@/hooks/useExpenses';
import { FormField, Input, TextArea, NumberInput, Select, DatePicker, Button, SelectOption } from '@/components/ui';
import { validateForm, hasErrors, sanitizeFormData, getFieldError } from '@/utils/formHelpers';
import { showError } from '@/utils/alerts';
import { z } from 'zod';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1, 'Currency is required'),
  expense_date: z.date({ required_error: 'Date is required' }),
});

const categoryOptions: SelectOption[] = [
  { label: 'Food & Dining', value: 'food-dining', icon: 'restaurant' },
  { label: 'Transportation', value: 'transportation', icon: 'car' },
  { label: 'Office Supplies', value: 'office-supplies', icon: 'briefcase' },
  { label: 'Utilities', value: 'utilities', icon: 'flash' },
  { label: 'Rent', value: 'rent', icon: 'home' },
  { label: 'Salaries', value: 'salaries', icon: 'people' },
  { label: 'Marketing', value: 'marketing', icon: 'megaphone' },
  { label: 'Other', value: 'other', icon: 'ellipsis-horizontal' },
];

const currencyOptions: SelectOption[] = [
  { label: 'NGN - Nigerian Naira', value: 'NGN' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
];

export default function CreateExpenseScreen() {
  const { colors } = useTheme();
  const createExpense = useCreateExpense();

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    currency: 'NGN',
    expense_date: new Date(),
    vendor: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async () => {
    const validationErrors = validateForm(expenseSchema, formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const apiData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount || '0'),
        currency: formData.currency,
        expense_date: formData.expense_date.toISOString().split('T')[0],
        vendor: formData.vendor || undefined,
      };

      await createExpense.mutateAsync(apiData);
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to create expense');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'New Expense',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <FormField label="Category" required error={getFieldError(errors, 'category')}>
          <Select
            value={formData.category}
            onChange={(value) => handleChange('category', value)}
            options={categoryOptions}
            placeholder="Select category"
            error={!!errors.category}
          />
        </FormField>

        <FormField label="Amount" required error={getFieldError(errors, 'amount')}>
          <NumberInput
            value={formData.amount}
            onChangeValue={(value) => handleChange('amount', value)}
            placeholder="0.00"
            error={!!errors.amount}
            decimals={2}
            min={0}
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

        <FormField label="Date" required error={getFieldError(errors, 'expense_date')}>
          <DatePicker
            value={formData.expense_date}
            onChange={(value) => handleChange('expense_date', value)}
            mode="date"
            error={!!errors.expense_date}
          />
        </FormField>

        <FormField label="Description" required error={getFieldError(errors, 'description')}>
          <TextArea
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Enter expense description"
            error={!!errors.description}
            numberOfLines={4}
          />
        </FormField>

        <FormField label="Vendor (Optional)" error={getFieldError(errors, 'vendor')}>
          <Input
            value={formData.vendor}
            onChangeText={(value) => handleChange('vendor', value)}
            placeholder="Enter vendor name"
            error={!!errors.vendor}
          />
        </FormField>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={createExpense.isPending ? 'Saving...' : 'Save Expense'}
          onPress={handleSubmit}
          variant="primary"
          disabled={createExpense.isPending}
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
  headerButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
});
