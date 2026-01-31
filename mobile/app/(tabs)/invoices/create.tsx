import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select, SelectOption } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { NumberInput } from '@/components/ui/NumberInput';
import { formatCurrency } from '@/utils/formatters';

// Validation schema
const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  issued_date: z.date({ required_error: 'Issue date is required' }),
  due_date: z.date({ required_error: 'Due date is required' }),
  currency: z.string().min(1, 'Currency is required'),
});

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  tax_rate: z.number().min(0).max(100).optional(),
  currency: z.string().optional(),
  quantity_available: z.number().min(0).optional(),
});

const currencyOptions: SelectOption[] = [
  { label: 'NGN - Nigerian Naira', value: 'NGN' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
];

const statusOptions: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface ProductItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

interface CustomItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

type LineItem = ProductItem | CustomItem;

function isProductItem(item: LineItem): item is ProductItem {
  return 'product_id' in item;
}

export default function CreateInvoiceScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const createInvoice = useCreateInvoice();
  const createClient = useCreateClient();
  const createProduct = useCreateProduct();
  const { data: clientsData } = useClients();
  const { data: productsData } = useProducts();

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    issued_date: new Date(),
    due_date: new Date(), // Today
    currency: 'NGN',
    discount: 0,
    status: 'paid',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);

  // New client form
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // New product form
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    tax_rate: '0',
    quantity_available: '0',
  });
  const [productErrors, setProductErrors] = useState<Record<string, string>>({});

  // Custom item form
  const [customItem, setCustomItem] = useState({
    description: '',
    quantity: '1',
    unit_price: '0',
    tax_rate: '0',
  });
  const [customItemErrors, setCustomItemErrors] = useState<Record<string, string>>({});

  const clients = clientsData || [];
  const products = productsData?.pages?.flatMap((page) => page.items) || [];

  const clientOptions: SelectOption[] = [
    { label: '+ Create New Client', value: '__create_new__' },
    ...clients.map((client) => ({
      label: client.name,
      value: client.id,
    })),
  ];

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

  const handleClientSelect = (value: string) => {
    if (value === '__create_new__') {
      setShowCreateClientModal(true);
    } else {
      handleChange('client_id', value);
    }
  };

  const handleCreateClient = async () => {
    try {
      const validated = clientSchema.parse(newClient);
      
      // Remove empty email field to avoid backend validation error
      const clientData: any = { ...validated };
      if (!clientData.email || clientData.email.trim() === '') {
        delete clientData.email;
      }
      
      const result = await createClient.mutateAsync(clientData);
      
      // Set the newly created client as selected
      handleChange('client_id', result.id);
      
      // Reset and close modal
      setNewClient({ name: '', email: '', phone: '', address: '' });
      setClientErrors({});
      setShowCreateClientModal(false);
      
      Alert.alert('Success', 'Client created successfully!');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setClientErrors(fieldErrors);
      } else {
        Alert.alert('Error', error.message || 'Failed to create client');
      }
    }
  };

  const handleCreateProduct = async () => {
    try {
      const validated = productSchema.parse({
        sku: newProduct.sku,
        name: newProduct.name,
        description: newProduct.description || undefined,
        unit_price: parseFloat(newProduct.unit_price) || 0,
        tax_rate: parseFloat(newProduct.tax_rate) || 0,
        currency: formData.currency,
        quantity_available: parseFloat(newProduct.quantity_available) || 0,
      });
      
      const result = await createProduct.mutateAsync(validated as any);
      
      // Add the newly created product to line items
      const newItem: ProductItem = {
        id: Date.now().toString(),
        product_id: result.id,
        name: result.name,
        quantity: 1,
        unit_price: parseFloat(result.unit_price),
        tax_rate: parseFloat(result.tax_rate || '0'),
        amount: parseFloat(result.unit_price),
      };
      setLineItems((prev) => [...prev, newItem]);
      
      // Reset and close modal
      setNewProduct({ sku: '', name: '', description: '', unit_price: '', tax_rate: '0', quantity_available: '0' });
      setProductErrors({});
      setShowCreateProductModal(false);
      setShowProductModal(false);
      
      Alert.alert('Success', 'Product created and added successfully!');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setProductErrors(fieldErrors);
      } else {
        Alert.alert('Error', error.message || 'Failed to create product');
      }
    }
  };

  const addProductItem = (productId: string) => {
    if (productId === '__create_new__') {
      setShowProductModal(false);
      setShowCreateProductModal(true);
      return;
    }
    
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newItem: ProductItem = {
      id: Date.now().toString(),
      product_id: product.id,
      name: product.name,
      quantity: 1,
      unit_price: parseFloat(product.unit_price),
      tax_rate: parseFloat(product.tax_rate || '0'),
      amount: parseFloat(product.unit_price),
    };

    setLineItems((prev) => [...prev, newItem]);
    setShowProductModal(false);
  };

  const handleAddCustomItem = () => {
    // Validate custom item
    if (!customItem.description.trim()) {
      setCustomItemErrors({ description: 'Description is required' });
      return;
    }

    const quantity = parseFloat(customItem.quantity) || 0;
    const unitPrice = parseFloat(customItem.unit_price) || 0;
    const taxRate = parseFloat(customItem.tax_rate) || 0;

    if (quantity <= 0) {
      setCustomItemErrors({ quantity: 'Quantity must be greater than 0' });
      return;
    }

    const amount = quantity * unitPrice;

    const newItem: CustomItem = {
      id: Date.now().toString(),
      description: customItem.description,
      quantity,
      unit_price: unitPrice,
      tax_rate: taxRate,
      amount,
    };

    setLineItems((prev) => [...prev, newItem]);
    
    // Reset form and close modal
    setCustomItem({ description: '', quantity: '1', unit_price: '0', tax_rate: '0' });
    setCustomItemErrors({});
    setShowCustomItemModal(false);
  };

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value };
        
        // Recalculate amount
        const quantity = typeof updated.quantity === 'number' ? updated.quantity : parseFloat(updated.quantity as any) || 0;
        const unitPrice = typeof updated.unit_price === 'number' ? updated.unit_price : parseFloat(updated.unit_price as any) || 0;
        updated.amount = quantity * unitPrice;

        return updated;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * formData.discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.amount;
      const itemAfterDiscount = itemSubtotal - (itemSubtotal * formData.discount) / 100;
      const taxAmount = (itemAfterDiscount * item.tax_rate) / 100;
      return sum + taxAmount;
    }, 0);
    const total = subtotalAfterDiscount + tax;

    return { subtotal, discountAmount, subtotalAfterDiscount, tax, total };
  };

  const handleSubmit = async () => {
    if (createInvoice.isPending) return;

    try {
      // Validate basic form
      const validated = invoiceSchema.parse(formData);

      // Check if we have line items
      if (lineItems.length === 0) {
        Alert.alert('Error', 'Please add at least one item to the invoice');
        return;
      }

      // Separate product items from custom items
      const productItems: Array<{ product_id: string; quantity: number }> = [];
      const customItems: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
        amount: number;
      }> = [];

      lineItems.forEach((item) => {
        if (isProductItem(item)) {
          // This is a product from catalog - add to product_items for backend quantity update
          productItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
          });
        } else {
          // This is a custom item - add to items array
          customItems.push({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount,
          });
        }
      });

      const totals = calculateTotals();

      const payload: any = {
        client_id: validated.client_id,
        issued_date: validated.issued_date.toISOString().split('T')[0],
        due_date: validated.due_date.toISOString().split('T')[0],
        currency: validated.currency,
        discount: formData.discount,
        subtotal: totals.subtotal.toString(),
        tax: totals.tax.toString(),
        total: totals.total.toString(),
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes;
      }

      // Send product_items for catalog products (backend will update quantities)
      if (productItems.length > 0) {
        payload.product_items = productItems;
      }

      // Send items for custom line items
      if (customItems.length > 0) {
        payload.items = customItems;
      }

      await createInvoice.mutateAsync(payload as any);

      Alert.alert('Success', 'Invoice created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Error', error.message || 'Failed to create invoice');
      }
    }
  };

  const totals = calculateTotals();

  const selectedClient = clients.find((c) => c.id === formData.client_id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Client Selection */}
          <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Client Information</Text>
          
          <FormField label="Client" error={errors.client_id} required>
            <Select
              value={formData.client_id}
              onChange={handleClientSelect}
              options={clientOptions}
              placeholder="Select a client"
              error={!!errors.client_id}
            />
          </FormField>

          {selectedClient && (
            <View style={[styles.clientPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.clientName, { color: colors.text }]}>{selectedClient.name}</Text>
              {selectedClient.email && (
                <Text style={[styles.clientDetail, { color: colors.textSecondary }]}>{selectedClient.email}</Text>
              )}
              {selectedClient.phone && (
                <Text style={[styles.clientDetail, { color: colors.textSecondary }]}>{selectedClient.phone}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Invoice Details */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice Details</Text>

          <FormField label="Issue Date" error={errors.issued_date} required>
            <DatePicker
              value={formData.issued_date}
              onChange={(date) => handleChange('issued_date', date)}
              mode="date"
              error={!!errors.issued_date}
            />
          </FormField>

          <FormField label="Due Date" error={errors.due_date} required>
            <DatePicker
              value={formData.due_date}
              onChange={(date) => handleChange('due_date', date)}
              mode="date"
              error={!!errors.due_date}
            />
          </FormField>

          <FormField label="Currency" error={errors.currency} required>
            <Select
              value={formData.currency}
              onChange={(value) => handleChange('currency', value)}
              options={currencyOptions}
              placeholder="Select currency"
              error={!!errors.currency}
            />
          </FormField>

          <FormField label="Status" required>
            <Select
              value={formData.status}
              onChange={(value) => handleChange('status', value)}
              options={statusOptions}
              placeholder="Select status"
            />
          </FormField>

          <FormField label="Notes">
            <TextArea
              value={formData.notes}
              onChangeText={(value) => handleChange('notes', value)}
              placeholder="Additional notes or payment instructions..."
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Discount (%)">
            <NumberInput
              value={formData.discount.toString()}
              onChangeValue={(value) => handleChange('discount', parseFloat(value) || 0)}
              placeholder="0"
              min={0}
              max={100}
              decimalPlaces={2}
            />
          </FormField>
        </Card>

        {/* Line Items */}
        <Card style={styles.section}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
            <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
              {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View style={styles.addButtonsRow}>
            <Button
              title="Add Product"
              onPress={() => setShowProductModal(true)}
              variant="outline"
              style={styles.addButton}
              icon={<Ionicons name="cube-outline" size={18} color={colors.primary} />}
            />
            <Button
              title="Add Custom"
              onPress={() => setShowCustomItemModal(true)}
              variant="outline"
              style={styles.addButton}
              icon={<Ionicons name="add-outline" size={18} color={colors.primary} />}
            />
          </View>

          {lineItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items added</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Add products or custom items to your invoice
              </Text>
            </View>
          ) : (
            <>
              {lineItems.map((item, index) => (
                <Card key={item.id} style={[styles.lineItemCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.lineItemHeader}>
                    <View style={styles.itemBadge}>
                      <Ionicons
                        name={isProductItem(item) ? 'cube' : 'document-text'}
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={[styles.itemType, { color: colors.primary }]}>
                        {isProductItem(item) ? 'Product' : 'Custom'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {isProductItem(item) ? item.name : item.description}
                  </Text>

                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <FormField label="Quantity">
                        <NumberInput
                          value={item.quantity.toString()}
                          onChangeValue={(value) => updateLineItem(item.id, 'quantity', value)}
                          placeholder="0"
                          decimals={2}
                        />
                      </FormField>
                    </View>
                    <View style={styles.halfField}>
                      <FormField label="Unit Price">
                        <NumberInput
                          value={item.unit_price.toString()}
                          onChangeValue={(value) => updateLineItem(item.id, 'unit_price', value)}
                          placeholder="0.00"
                          decimals={2}
                        />
                      </FormField>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <FormField label="Tax Rate (%)">
                        <NumberInput
                          value={item.tax_rate.toString()}
                          onChangeValue={(value) => updateLineItem(item.id, 'tax_rate', value)}
                          placeholder="0"
                          decimals={2}
                        />
                      </FormField>
                    </View>
                    <View style={styles.halfField}>
                      <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
                      <Text style={[styles.amountValue, { color: colors.text }]}>
                        {formatCurrency(item.amount, formData.currency)}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </Card>

        {/* Totals */}
        {lineItems.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatCurrency(totals.subtotal, formData.currency)}
              </Text>
            </View>

            {formData.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Discount ({formData.discount}%)</Text>
                <Text style={[styles.totalValue, { color: colors.error }]}>
                  -{formatCurrency(totals.discountAmount, formData.currency)}
                </Text>
              </View>
            )}

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
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Cancel" onPress={() => router.back()} variant="outline" style={styles.button} />
        <Button
          title="Create Invoice"
          onPress={handleSubmit}
          loading={createInvoice.isPending}
          style={styles.button}
        />
      </View>

      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                { id: '__create_new__', name: '+ Create New Product', sku: '', unit_price: '0', tax_rate: '0', quantity_available: 0, is_active: true, description: null, user_id: '', currency: '', created_at: '', updated_at: '' },
                ...products,
              ]}
              keyExtractor={(item) => item.id}
              style={styles.productList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.productItem,
                    { borderBottomColor: colors.border },
                    item.id === '__create_new__' && { backgroundColor: colors.primaryLight + '15' },
                  ]}
                  onPress={() => addProductItem(item.id)}
                >
                  {item.id === '__create_new__' ? (
                    <View style={styles.productInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="add-circle" size={20} color={colors.primary} />
                        <Text style={[styles.productName, { color: colors.primary, fontWeight: '600' }]}>
                          {item.name}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                        {formatCurrency(parseFloat(item.unit_price), formData.currency)} • Tax: {item.tax_rate}%
                      </Text>
                      {item.sku && (
                        <Text style={[styles.productSku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>
                      )}
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  </>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Create Product Modal */}
      <Modal visible={showCreateProductModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Product</Text>
              <TouchableOpacity onPress={() => setShowCreateProductModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <FormField label="SKU" error={productErrors.sku} required>
                <Input
                  value={newProduct.sku}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, sku: value }))}
                  placeholder="PROD-01234"
                  error={!!productErrors.sku}
                />
              </FormField>

              <FormField label="Name" error={productErrors.name} required>
                <Input
                  value={newProduct.name}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, name: value }))}
                  placeholder="Product name"
                  error={!!productErrors.name}
                />
              </FormField>

              <FormField label="Description">
                <TextArea
                  value={newProduct.description}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, description: value }))}
                  placeholder="Product description"
                  numberOfLines={3}
                />
              </FormField>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FormField label="Unit Price" error={productErrors.unit_price} required>
                    <NumberInput
                      value={newProduct.unit_price}
                      onChangeValue={(value) => setNewProduct((prev) => ({ ...prev, unit_price: value }))}
                      placeholder="0.00"
                      decimals={2}
                      error={!!productErrors.unit_price}
                    />
                  </FormField>
                </View>
                <View style={styles.halfField}>
                  <FormField label="Tax Rate (%)" error={productErrors.tax_rate}>
                    <NumberInput
                      value={newProduct.tax_rate}
                      onChangeValue={(value) => setNewProduct((prev) => ({ ...prev, tax_rate: value }))}
                      placeholder="0"
                      decimals={2}
                      error={!!productErrors.tax_rate}
                    />
                  </FormField>
                </View>
              </View>

              <FormField label="Quantity Available">
                <NumberInput
                  value={newProduct.quantity_available}
                  onChangeValue={(value) => setNewProduct((prev) => ({ ...prev, quantity_available: value }))}
                  placeholder="0"
                  decimals={0}
                />
              </FormField>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowCreateProductModal(false);
                  setShowProductModal(true);
                }}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Create Product"
                onPress={handleCreateProduct}
                loading={createProduct.isPending}
                style={styles.button}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Item Modal */}
      <Modal visible={showCustomItemModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Item</Text>
              <TouchableOpacity onPress={() => setShowCustomItemModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <FormField label="Description" error={customItemErrors.description} required>
                <Input
                  value={customItem.description}
                  onChangeText={(value) => setCustomItem((prev) => ({ ...prev, description: value }))}
                  placeholder="Item description"
                  error={!!customItemErrors.description}
                />
              </FormField>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FormField label="Quantity" error={customItemErrors.quantity} required>
                    <NumberInput
                      value={customItem.quantity}
                      onChangeValue={(value) => setCustomItem((prev) => ({ ...prev, quantity: value }))}
                      placeholder="1"
                      decimals={2}
                      error={!!customItemErrors.quantity}
                    />
                  </FormField>
                </View>
                <View style={styles.halfField}>
                  <FormField label="Unit Price" required>
                    <NumberInput
                      value={customItem.unit_price}
                      onChangeValue={(value) => setCustomItem((prev) => ({ ...prev, unit_price: value }))}
                      placeholder="0.00"
                      decimals={2}
                    />
                  </FormField>
                </View>
              </View>

              <FormField label="Tax Rate (%)">
                <NumberInput
                  value={customItem.tax_rate}
                  onChangeValue={(value) => setCustomItem((prev) => ({ ...prev, tax_rate: value }))}
                  placeholder="0"
                  decimals={2}
                />
              </FormField>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button title="Cancel" onPress={() => setShowCustomItemModal(false)} variant="outline" style={styles.button} />
              <Button title="Add Item" onPress={handleAddCustomItem} style={styles.button} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Client Modal */}
      <Modal visible={showCreateClientModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Client</Text>
              <TouchableOpacity onPress={() => setShowCreateClientModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <FormField label="Name" error={clientErrors.name} required>
                <Input
                  value={newClient.name}
                  onChangeText={(value) => setNewClient((prev) => ({ ...prev, name: value }))}
                  placeholder="Client name"
                  error={!!clientErrors.name}
                />
              </FormField>

              <FormField label="Email" error={clientErrors.email}>
                <Input
                  value={newClient.email}
                  onChangeText={(value) => setNewClient((prev) => ({ ...prev, email: value }))}
                  placeholder="client@example.com"
                  keyboardType="email-address"
                  error={!!clientErrors.email}
                />
              </FormField>

              <FormField label="Phone" error={clientErrors.phone}>
                <Input
                  value={newClient.phone}
                  onChangeText={(value) => setNewClient((prev) => ({ ...prev, phone: value }))}
                  placeholder="+234 XXX XXX XXXX"
                  keyboardType="phone-pad"
                  error={!!clientErrors.phone}
                />
              </FormField>

              <FormField label="Address">
                <TextArea
                  value={newClient.address}
                  onChangeText={(value) => setNewClient((prev) => ({ ...prev, address: value }))}
                  placeholder="Client address"
                  numberOfLines={3}
                />
              </FormField>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateClientModal(false)}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Create Client"
                onPress={handleCreateClient}
                loading={createClient.isPending}
                style={styles.button}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  clientPreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    marginTop: 2,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 14,
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
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
  lineItemCard: {
    marginBottom: 12,
    padding: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  productList: {
    maxHeight: 500,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
