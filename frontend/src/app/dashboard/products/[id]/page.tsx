'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProductStore } from '@/stores/product-store';
import { ProductForm } from '@/components/products/product-form';
import { QuantityAdjustDialog } from '@/components/products/quantity-adjust-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { currentProduct, isLoading, fetchProductById, updateProduct, adjustQuantity } =
    useProductStore();

  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }
  }, [id, fetchProductById]);

  const handleUpdate = async (data: any) => {
    try {
      await updateProduct(id, data);
      toast.success('Product updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update product:', error);
    }
  };

  const handleAdjustQuantity = async (adjustment: number) => {
    try {
      await adjustQuantity(id, adjustment);
      toast.success(`Quantity adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`);
    } catch (error: any) {
      throw error; // Re-throw to let dialog handle it
    }
  };

  if (isLoading && !currentProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => router.push('/dashboard/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
          <p className="text-muted-foreground font-mono">{currentProduct.sku}</p>
        </div>
        <Badge variant={currentProduct.is_active ? 'default' : 'secondary'}>
          {currentProduct.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Product Info Card */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Product Information</CardTitle>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Unit Price</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(currentProduct.unit_price)} {currentProduct.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Rate</p>
                <p className="text-lg font-semibold">{currentProduct.tax_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity Available</p>
                <p className="text-lg font-semibold">{currentProduct.quantity_available}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-lg font-semibold">{currentProduct.currency}</p>
              </div>
            </div>

            {currentProduct.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{currentProduct.description}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex gap-2">
              <Button onClick={() => setShowAdjustDialog(true)} className="flex-1">
                <TrendingUp className="mr-2 h-4 w-4" />
                Adjust Quantity
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Edit Product</CardTitle>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ProductForm
              product={currentProduct}
              onSubmit={handleUpdate}
              isSubmitting={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Quantity Adjust Dialog */}
      <QuantityAdjustDialog
        product={currentProduct}
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        onAdjust={handleAdjustQuantity}
      />
    </div>
  );
}
