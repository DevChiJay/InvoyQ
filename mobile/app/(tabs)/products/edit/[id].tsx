import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { FormField, Input, TextArea, NumberInput, Select, Button, SelectOption } from '@/components/ui';
import { validateForm, hasErrors, sanitizeFormData, getFieldError } from '@/utils/formHelpers';
import { showError } from '@/utils/alerts';
import { z } from 'zod';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit_price: z.string().min(1, 'Unit price is required'),
  tax_rate: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  is_active: z.boolean().optional(),
});

const currencyOptions: SelectOption[] = [
  { label: 'NGN - Nigerian Naira', value: 'NGN' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
];

export default function EditProductScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    tax_rate: '',
    currency: 'NGN',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        unit_price: product.unit_price || '',
        tax_rate: product.tax_rate || '',
        currency: product.currency || 'NGN',
        is_active: product.is_active,
      });
    }
  }, [product]);

  const handleChange = (field: string, value: string | boolean) => {
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
    const validationErrors = validateForm(productSchema, formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      const sanitized = sanitizeFormData(formData);
      const apiData = {
        sku: sanitized.sku,
        name: sanitized.name,
        description: sanitized.description || undefined,
        unit_price: parseFloat(sanitized.unit_price || '0'),
        tax_rate: sanitized.tax_rate ? parseFloat(sanitized.tax_rate) : undefined,
        currency: sanitized.currency,
        is_active: formData.is_active,
      };

      await updateProduct.mutateAsync({ id, data: apiData });
      router.back();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to update product');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Product',
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
        <FormField label="SKU" required error={getFieldError(errors, 'sku')}>
          <Input
            value={formData.sku}
            onChangeText={(value) => handleChange('sku', value)}
            placeholder="e.g. PROD-001"
            error={!!errors.sku}
            autoCapitalize="characters"
          />
        </FormField>

        <FormField label="Product Name" required error={getFieldError(errors, 'name')}>
          <Input
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter product name"
            error={!!errors.name}
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Description" error={getFieldError(errors, 'description')}>
          <TextArea
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Enter product description"
            error={!!errors.description}
            numberOfLines={3}
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

        <FormField label="Unit Price" required error={getFieldError(errors, 'unit_price')}>
          <NumberInput
            value={formData.unit_price}
            onChangeValue={(value) => handleChange('unit_price', value)}
            placeholder="0.00"
            error={!!errors.unit_price}
            decimals={2}
            min={0}
          />
        </FormField>

        <FormField label="Tax Rate (%)" error={getFieldError(errors, 'tax_rate')}>
          <NumberInput
            value={formData.tax_rate}
            onChangeValue={(value) => handleChange('tax_rate', value)}
            placeholder="0"
            error={!!errors.tax_rate}
            decimals={2}
            min={0}
            max={100}
          />
        </FormField>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Quantity adjustments should be done from the product detail screen
          </Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={[styles.label, { color: colors.text }]}>Active</Text>
            <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
              Product is available for sale
            </Text>
          </View>
          <Switch
            value={formData.is_active}
            onValueChange={(value) => handleChange('is_active', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={updateProduct.isPending ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          variant="primary"
          disabled={updateProduct.isPending}
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
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchHint: {
    fontSize: 12,
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
