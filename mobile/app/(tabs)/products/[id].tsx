import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useProduct, useDeleteProduct, useAdjustProductQuantity } from '@/hooks/useProducts';
import { Card, Button, Badge, NumberInput, FormField } from '@/components/ui';
import { confirmDelete, showError, showSuccess } from '@/utils/alerts';
import { formatCurrency } from '@/utils/formatters';

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const adjustQuantity = useAdjustProductQuantity();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState('');

  const handleDelete = () => {
    if (!product) return;
    confirmDelete(product.name, async () => {
      try {
        await deleteProduct.mutateAsync(id);
        router.back();
      } catch (error: any) {
        showError(error.response?.data?.detail || 'Failed to delete product');
      }
    });
  };

  const handleEdit = () => {
    router.push(`/products/edit/${id}`);
  };

  const handleAdjustQuantity = async (delta: number) => {
    try {
      await adjustQuantity.mutateAsync({ id, adjustment: delta });
      setShowAdjustModal(false);
      setAdjustmentValue('');
      showSuccess('Quantity adjusted successfully');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to adjust quantity');
    }
  };

  const getStockBadge = () => {
    if (!product) return null;
    const qty = product.quantity_available;
    
    if (qty === 0) {
      return <Badge variant="error" label="Out of Stock" />;
    } else if (qty <= 10) {
      return <Badge variant="warning" label="Low Stock" />;
    } else {
      return <Badge variant="success" label="In Stock" />;
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
          title: 'Product Details',
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }} showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.sku, { color: colors.textSecondary }]}>SKU: {product.sku}</Text>
            </View>
            {!product.is_active && <Badge variant="default" label="Inactive" />}
          </View>
          
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {formatCurrency(parseFloat(product.unit_price), product.currency)}
            </Text>
            {getStockBadge()}
          </View>
        </Card>

        {/* Description Card */}
        {product.description && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description}
            </Text>
          </Card>
        )}

        {/* Stock Management Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Stock Management</Text>
          
          <View style={styles.stockRow}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>
              Current Stock
            </Text>
            <Text style={[styles.stockValue, { color: colors.text }]}>
              {product.quantity_available} units
            </Text>
          </View>

          <View style={styles.quickActions}>
            <Button
              title="+10"
              onPress={() => handleAdjustQuantity(10)}
              variant="outline"
              style={styles.quickButton}
            />
            <Button
              title="-10"
              onPress={() => handleAdjustQuantity(-10)}
              variant="outline"
              style={styles.quickButton}
              disabled={product.quantity_available < 10}
            />
            <Button
              title="Custom"
              onPress={() => setShowAdjustModal(true)}
              variant="primary"
              style={styles.quickButton}
            />
          </View>
        </Card>

        {/* Details Card */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Currency</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{product.currency}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tax Rate</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {parseFloat(product.tax_rate).toFixed(2)}%
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Quantity Adjustment Modal */}
      <Modal
        visible={showAdjustModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adjust Quantity</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <FormField label="Adjustment Amount">
                <NumberInput
                  value={adjustmentValue}
                  onChangeValue={setAdjustmentValue}
                  placeholder="Enter amount (use - for decrease)"
                  decimals={0}
                />
              </FormField>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Positive numbers add stock, negative numbers remove stock
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowAdjustModal(false)}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Apply"
                onPress={() => handleAdjustQuantity(parseInt(adjustmentValue || '0'))}
                variant="primary"
                style={styles.button}
                disabled={!adjustmentValue || adjustQuantity.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  sku: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockLabel: {
    fontSize: 16,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
