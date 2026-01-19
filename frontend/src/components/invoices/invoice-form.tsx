'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import type { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceItem, Client } from '@/types/api';
import { useClients } from '@/lib/hooks/use-clients';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency';
import { formatCurrency } from '@/lib/format';

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
      : extractedData?.invoice_details?.due_date || getDefaultDueDate(),
    currency: invoice?.currency || DEFAULT_CURRENCY,
    tax: invoice?.tax ?? extractedData?.financial?.tax ?? 0,
    status: invoice?.status || 'draft' as const,
    notes: invoice?.notes || extractedData?.notes || '',
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      amount: Number(item.amount),
    })) || 
    (extractedData?.line_items && Array.isArray(extractedData.line_items) && extractedData.line_items.length > 0 
      ? extractedData.line_items.map((item: InvoiceItem) => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
          amount: Number(item.amount) || Number(item.quantity || 1) * Number(item.unit_price || 0),
        }))
      : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }])
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * formData.tax) / 100;
  const total = subtotal + taxAmount;

  // Update item amount when quantity or unit_price changes
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
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
      const submitData: InvoiceCreate = {
        client_id: formData.client_id,
        issued_date: formData.issued_date,
        due_date: formData.due_date,
        currency: formData.currency,
        items: items.filter((item) => item.description.trim()),
        subtotal: subtotal,
        tax: formData.tax,
        total: total,
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
              <CardDescription>Add products or services</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-4 pb-4 border-b last:border-0"
            >
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
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
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
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
            <Label htmlFor="tax">Tax (%)</Label>
            <Input
              id="tax"
              type="number"
              min="0"
              step="0.01"
              value={formData.tax}
              onChange={(e) => handleChange('tax', parseFloat(e.target.value) || 0)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal, formData.currency)}</span>
            </div>
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
