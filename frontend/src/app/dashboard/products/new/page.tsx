'use client';

import { useRouter } from 'next/navigation';
import { useProductStore } from '@/stores/product-store';
import { ProductForm } from '@/components/products/product-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const { createProduct, isLoading } = useProductStore();

  const handleSubmit = async (data: any) => {
    try {
      await createProduct(data);
      toast.success('Product created successfully');
      router.push('/dashboard/products');
    } catch (error: any) {
      // Error already handled by store, just prevent navigation
      console.error('Failed to create product:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={handleSubmit} isSubmitting={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
