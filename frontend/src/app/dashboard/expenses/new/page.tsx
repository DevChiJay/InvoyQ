'use client';

import { useRouter } from 'next/navigation';
import { useExpenseStore } from '@/stores/expense-store';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewExpensePage() {
  const router = useRouter();
  const { createExpense, categories, isLoading } = useExpenseStore();

  const handleSubmit = async (data: any) => {
    try {
      await createExpense(data);
      toast.success('Expense recorded successfully');
      router.push('/dashboard/expenses');
    } catch (error: any) {
      console.error('Failed to create expense:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">New Expense</h1>
          <p className="text-muted-foreground">
            Record a new business expense
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            categories={categories}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
