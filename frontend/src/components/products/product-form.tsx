'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productCreateSchema, productUpdateSchema } from '@/lib/validations';
import { Product } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({ product, onSubmit, isSubmitting }: ProductFormProps) {
  const isEdit = !!product;
  const schema = isEdit ? productUpdateSchema : productCreateSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: product?.sku || '',
      name: product?.name || '',
      description: product?.description || '',
      unit_price: product?.unit_price || '',
      tax_rate: product?.tax_rate || '0.00',
      currency: product?.currency || 'NGN',
      quantity_available: product?.quantity_available?.toString() || '',
      is_active: product?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: any) => {
    // Schema already handles quantity_available conversion via preprocess
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SKU */}
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="PROD-001"
                    {...field}
                    disabled={isEdit}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>
                  {isEdit ? 'SKU cannot be changed' : 'Unique product identifier (1-100 characters)'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Widget Pro" {...field} />
                </FormControl>
                <FormDescription>Max 255 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed product description..."
                  rows={3}
                  {...field}
                  value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                />
              </FormControl>
              <FormDescription>Max 1000 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Unit Price */}
          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price *</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="100.00"
                    {...field}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>Decimal as string</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tax Rate */}
          <FormField
            control={form.control}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="7.50"
                    {...field}
                    value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>0-100</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity_available"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Available</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                  />
                </FormControl>
                <FormDescription>Initial stock quantity</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Make this product available for invoicing
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
