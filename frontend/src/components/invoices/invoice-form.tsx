'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, UserPlus, Package, AlertCircle } from 'lucide-react';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import type { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItem, Client, ProductItemReference } from '@/types/api';
import { useClients } from '@/lib/hooks/use-clients';
import { useProductStore } from '@/stores/product-store';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Local type for form state (using numbers for easier calculations)
interface InvoiceItemForm {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: InvoiceCreate | InvoiceUpdate) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  preselectedClientId?: string;
}

// Calculate default due date (30 days from now)
const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

export function InvoiceForm({
  invoice,
  onSubmit,
  isLoading,
  isEdit,
  preselectedClientId,
}: InvoiceFormProps) {
  const { data: clients } = useClients();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  
  // Fetch active products
  const { products, isLoading: productsLoading, fetchProducts } = useProductStore();
  
  useEffect(() => {
    fetchProducts({ is_active: true });
  }, [fetchProducts]);
  
  const activeProducts = products.filter(p => p.is_active);

  // Load extraction data from session storage
  const extractedData = useMemo(() => {
    if (invoice || isEdit) return null;
    
    const extractedDataStr = sessionStorage.getItem('extractedData');
    if (!extractedDataStr) return null;

    try {
      const data = JSON.parse(extractedDataStr);
      // Clear after reading
      sessionStorage.removeItem('extractedData');
      return data;
    } catch (error) {
      console.error('Failed to parse extracted data:', error);
      return null;
    }
  }, [invoice, isEdit]);

  // Try to match client by name or email if extraction data exists
  const matchedClient = useMemo(() => {
    if (!extractedData?.client || !clients) return null;
    
    const clientName = extractedData.client.name?.toLowerCase();
    const clientEmail = extractedData.client.email?.toLowerCase();
    
    return clients.find(
      (c) => 
        (clientName && c.name.toLowerCase() === clientName) ||
        (clientEmail && c.email?.toLowerCase() === clientEmail)
    );
  }, [extractedData, clients]);

  const [formData, setFormData] = useState({
    client_id: invoice?.client_id || matchedClient?.id || preselectedClientId || '',
    issued_date: invoice?.issued_date
      ? new Date(invoice.issued_date).toISOString().split('T')[0]
      : extractedData?.invoice_details?.issued_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date
      ? new Date(invoice.due_date).toISOString().split('T')[0]
      : extractedData?.invoice_details?.due_date || new Date().toISOString().split('T')[0],
    currency: invoice?.currency || DEFAULT_CURRENCY,
    discount: invoice?.discount ? parseFloat(invoice.discount) : 0,
    tax: invoice?.tax ?? extractedData?.financial?.tax ?? 0,
    status: invoice?.status || 'paid' as const,
    notes: invoice?.notes || extractedData?.notes || '',
  });

  const [items, setItems] = useState<InvoiceItemForm[]>(
    invoice?.items.map(item => ({
      product_id: item.product_id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      tax_rate: Number(item.tax_rate),
      amount: Number(item.amount),
    })) || 
    (extractedData?.line_items && Array.isArray(extractedData.line_items) && extractedData.line_items.length > 0 
      ? extractedData.line_items.map((item: InvoiceItem) => ({
          product_id: item.product_id || null,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          amount: Number(item.amount) || Number(item.quantity || 1) * Number(item.unit_price || 0),
        }))
      : [{ product_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }])
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // Auto-calculate weighted average tax rate from items
  const calculatedTax = useMemo(() => {
    if (items.length > 0 && items.some(item => item.tax_rate > 0)) {
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      if (totalAmount > 0) {
        const weightedTax = items.reduce((sum, item) => {
          return sum + (item.amount * item.tax_rate);
        }, 0) / totalAmount;
        return Math.round(weightedTax * 100) / 100;
      }
    }
    return formData.tax;
  }, [items, formData.tax]);
  
  // Update tax when calculated tax changes
  useEffect(() => {
    if (calculatedTax !== formData.tax && items.some(item => item.tax_rate > 0)) {
      handleChange('tax', calculatedTax);
    }
  }, [calculatedTax]);

  const discountAmount = (subtotal * formData.discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * formData.tax) / 100;
  const total = subtotalAfterDiscount + taxAmount;

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    if (!productId || productId === 'none') {
      // Clear product selection - reset to custom item
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: null,
      };
      setItems(newItems);
      return;
    }
    
    const product = activeProducts.find(p => p.id === productId);
    if (!product) return;

    const newItems = [...items];
    const quantity = newItems[index].quantity || 1;
    const unitPrice = parseFloat(product.unit_price);
    
    newItems[index] = {
      product_id: product.id,
      description: product.name,
      quantity,
      unit_price: unitPrice,
      tax_rate: parseFloat(product.tax_rate || '0'),
      amount: quantity * unitPrice,
    };
    
    setItems(newItems);
  };

  // Update item amount when quantity or unit_price changes
  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number | null) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product_id: null, description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Get unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    activeProducts.forEach(product => {
      if (product.category && product.category.trim()) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [activeProducts]);

  // Add products by category
  const handleAddCategory = (category: string) => {
    const productsInCategory = activeProducts.filter(
      p => p.category === category
    );
    
    const newItems = productsInCategory.map(product => {
      const unitPrice = parseFloat(product.unit_price);
      const quantity = 1;
      
      return {
        product_id: product.id,
        description: product.name,
        quantity,
        unit_price: unitPrice,
        tax_rate: parseFloat(product.tax_rate || '0'),
        amount: quantity * unitPrice,
      };
    });
    
    setItems([...items, ...newItems]);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }

    if (!formData.issued_date) {
      newErrors.issued_date = 'Issued date is required';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    if (items.length === 0 || items.every((item) => !item.description)) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      // Separate product items (from catalog) and custom items (manual entries)
      const productItems: ProductItemReference[] = [];
      const customItems: InvoiceItem[] = [];
      
      items
        .filter((item) => item.description.trim())
        .forEach(item => {
          if (item.product_id) {
            // This is a product from catalog - add to product_items for inventory tracking
            productItems.push({
              product_id: item.product_id,
              quantity: item.quantity.toString(),
            });
          } else {
            // This is a custom item - add to items array
            customItems.push({
              product_id: null,
              description: item.description,
              quantity: item.quantity.toString(),
              unit_price: item.unit_price.toFixed(2),
              tax_rate: item.tax_rate.toFixed(2),
              amount: item.amount.toFixed(2),
            });
          }
        });

      const submitData: InvoiceCreate = {
        client_id: formData.client_id,
        issued_date: formData.issued_date,
        due_date: formData.due_date,
        currency: formData.currency,
        items: customItems.length > 0 ? customItems : undefined,
        product_items: productItems.length > 0 ? productItems : undefined,
        subtotal: subtotal.toFixed(2),
        discount: formData.discount.toString(),
        tax: formData.tax.toString(),
        total: total.toFixed(2),
        status: formData.status,
        notes: formData.notes || undefined,
      };

      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleClientCreated = (client: Client) => {
    // Auto-select the newly created client
    handleChange('client_id', client.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Form Modal */}
      <ClientFormModal
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientCreated={handleClientCreated}
      />

      {/* Client & Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Select client and set invoice dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="client_id">
                Client <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsClientModalOpen(true)}
                disabled={isLoading}
                className="gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Add New Client
              </Button>
            </div>
            <select
              id="client_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.client_id}
              onChange={(e) => handleChange('client_id', e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select a client</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_date">
                Issued Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issued_date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => handleChange('issued_date', e.target.value)}
                disabled={isLoading}
              />
              {errors.issued_date && (
                <p className="text-sm text-destructive">{errors.issued_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                disabled={isLoading}
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange('currency', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sent">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Sent</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paid">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Paid</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="overdue">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Overdue</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Select from your products or add custom items</CardDescription>
            </div>
            <div className="flex gap-2">
              {activeProducts.length === 0 && (
                <Link href="/dashboard/products/new">
                  <Button type="button" variant="outline" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    Add Products
                  </Button>
                </Link>
              )}
              {categories.length > 0 && (
                <Select onValueChange={handleAddCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Add Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeProducts.length === 0 && items.length === 1 && !items[0].description && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No products available. You can{' '}
                <Link href="/dashboard/products/new" className="font-medium underline">
                  add products
                </Link>{' '}
                to your catalog for faster invoicing, or add custom line items below.
              </AlertDescription>
            </Alert>
          )}
          
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-4 pb-4 border-b last:border-0"
            >
              {/* Product Selection Row */}
              {activeProducts.length > 0 && (
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`item-product-${index}`}>Select Product (Optional)</Label>
                    <Select
                      value={item.product_id || 'none'}
                      onValueChange={(value) => handleProductSelect(index, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id={`item-product-${index}`}>
                        <SelectValue placeholder="Choose a product or add custom item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Custom item (no product)</SelectItem>
                        {activeProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-muted-foreground text-sm">
                                {formatCurrency(parseFloat(product.unit_price), product.currency)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Item Details Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`item-description-${index}`}>Description</Label>
                  <Input
                    id={`item-description-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Product or service description"
                    disabled={isLoading}
                  />
                </div>
                <div className="w-full md:w-24 space-y-2">
                  <Label htmlFor={`item-quantity-${index}`}>Qty</Label>
                  <Input
                    id={`item-quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateItem(index, 'quantity', 1);
                      } else {
                        updateItem(index, 'quantity', parseInt(value) || 1);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={isLoading}
                  />
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <Label htmlFor={`item-price-${index}`}>Unit Price</Label>
                  <Input
                    id={`item-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        updateItem(index, 'unit_price', 0);
                      } else {
                        updateItem(index, 'unit_price', parseFloat(value) || 0);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    disabled={isLoading}
                  />
                </div>
                <div className="w-full md:w-32 space-y-2">
                  <Label>Amount</Label>
                  <Input
                    value={Number(item.amount).toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1 || isLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {errors.items && (
            <p className="text-sm text-destructive">{errors.items}</p>
          )}
        </CardContent>
      </Card>

      {/* Totals & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleChange('discount', 0);
                } else {
                  handleChange('discount', parseFloat(value) || 0);
                }
              }}
              onFocus={(e) => e.target.select()}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">Tax (%) - Auto-calculated from items</Label>
            <Input
              id="tax"
              type="number"
              min="0"
              step="0.01"
              value={formData.tax}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  handleChange('tax', 0);
                } else {
                  handleChange('tax', parseFloat(value) || 0);
                }
              }}
              onFocus={(e) => e.target.select()}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal, formData.currency)}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount ({formData.discount}%):</span>
                <span className="text-destructive">-{formatCurrency(discountAmount, formData.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({formData.tax}%):</span>
              <span>{formatCurrency(taxAmount, formData.currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total, formData.currency)}</span>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes or payment instructions"
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Invoice' : 'Create Invoice'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
