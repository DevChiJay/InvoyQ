'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useExpenseStore } from '@/stores/expense-store';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Receipt, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { currentExpense, categories, isLoading, fetchExpenseById, updateExpense } =
    useExpenseStore();

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchExpenseById(id);
    }
  }, [id, fetchExpenseById]);

  const handleUpdate = async (data: any) => {
    try {
      await updateExpense(id, data);
      toast.success('Expense updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update expense:', error);
    }
  };

  if (isLoading && !currentExpense) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading expense...</p>
      </div>
    );
  }

  if (!currentExpense) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Expense not found</p>
        <Button onClick={() => router.push('/dashboard/expenses')}>
          Back to Expenses
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
          <h1 className="text-3xl font-bold">Expense Details</h1>
          <p className="text-muted-foreground">{currentExpense.expense_date}</p>
        </div>
        <Badge variant="outline">
          {currentExpense.category.charAt(0).toUpperCase() + currentExpense.category.slice(1)}
        </Badge>
      </div>

      {/* Expense Info Card */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Expense Information</CardTitle>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(currentExpense.amount)} {currentExpense.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-semibold">
                  {currentExpense.category.charAt(0).toUpperCase() + currentExpense.category.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-semibold">{currentExpense.expense_date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="text-lg font-semibold">{currentExpense.vendor || '-'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-sm">{currentExpense.description}</p>
            </div>

            {currentExpense.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {currentExpense.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentExpense.receipt_url && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(currentExpense.receipt_url!, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Receipt
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Edit Expense</CardTitle>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              expense={currentExpense}
              categories={categories}
              onSubmit={handleUpdate}
              isSubmitting={isLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
