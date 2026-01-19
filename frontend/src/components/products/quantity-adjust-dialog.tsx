'use client';

import { useState } from 'react';
import { Product } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Loader2 } from 'lucide-react';

interface QuantityAdjustDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjust: (adjustment: number) => Promise<void>;
}

export function QuantityAdjustDialog({
  product,
  open,
  onOpenChange,
  onAdjust,
}: QuantityAdjustDialogProps) {
  const [adjustment, setAdjustment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const adj = parseInt(adjustment, 10);
    
    if (isNaN(adj) || adj === 0) {
      setError('Adjustment must be a non-zero number');
      return;
    }

    // Check if reducing would go below zero
    if (adj < 0 && product.quantity_available + adj < 0) {
      setError(`Cannot reduce by ${Math.abs(adj)}. Only ${product.quantity_available} available.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdjust(adj);
      setAdjustment('');
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || 'Failed to adjust quantity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdjust = (value: number) => {
    const current = parseInt(adjustment, 10) || 0;
    setAdjustment((current + value).toString());
    setError(null);
  };

  const newQuantity = product.quantity_available + (parseInt(adjustment, 10) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Quantity</DialogTitle>
          <DialogDescription>
            Adjust the available quantity for {product.name} (SKU: {product.sku})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Quantity */}
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Current Quantity:</span>
            <span className="text-lg font-bold">{product.quantity_available}</span>
          </div>

          {/* Adjustment Input */}
          <div className="space-y-2">
            <Label htmlFor="adjustment">Adjustment Amount</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(-10)}
              >
                <Minus className="h-4 w-4" />
                <span className="ml-1">10</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="adjustment"
                type="number"
                placeholder="0"
                value={adjustment}
                onChange={(e) => {
                  setAdjustment(e.target.value);
                  setError(null);
                }}
                className="font-mono text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuickAdjust(10)}
              >
                <Plus className="h-4 w-4" />
                <span className="ml-1">10</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a positive number to add stock, or negative to reduce
            </p>
          </div>

          {/* New Quantity Preview */}
          {adjustment && !isNaN(parseInt(adjustment, 10)) && (
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">New Quantity:</span>
              <span className={`text-lg font-bold ${newQuantity < 0 ? 'text-destructive' : ''}`}>
                {newQuantity}
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setAdjustment('');
              setError(null);
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !adjustment || parseInt(adjustment, 10) === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adjust Quantity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
