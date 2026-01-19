'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExpenseStore } from '@/stores/expense-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { formatDateToYYYYMMDD } from '@/lib/utils';
import { Plus, Receipt, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ExpenseList() {
  const router = useRouter();
  const {
    expenses,
    total,
    hasMore,
    isLoading,
    error,
    filters,
    categories,
    fetchExpenses,
    fetchCategories,
    deleteExpense,
    setFilters,
    clearError,
  } = useExpenseStore();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value, skip: 0 });
    fetchExpenses({ [key]: value, skip: 0 });
  };

  const handlePeriodFilter = (period: 'week' | 'month' | 'year' | 'all') => {
    if (period === 'all') {
      setFilters({ period: undefined, reference_date: undefined, date_from: undefined, date_to: undefined, skip: 0 });
      fetchExpenses({ period: undefined, reference_date: undefined, date_from: undefined, date_to: undefined, skip: 0 });
    } else {
      const today = formatDateToYYYYMMDD(new Date());
      setFilters({ period, reference_date: today, skip: 0 });
      fetchExpenses({ period, reference_date: today, skip: 0 });
    }
  };

  const handleSort = (field: string) => {
    const newOrder = filters.sort_by === field && filters.sort_order === -1 ? 1 : -1;
    setFilters({ sort_by: field as any, sort_order: newOrder });
    fetchExpenses({ sort_by: field as any, sort_order: newOrder });
  };

  const handleLoadMore = () => {
    const newSkip = (filters.skip || 0) + (filters.limit || 20);
    fetchExpenses({ skip: newSkip });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success('Expense deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your business expenses
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/expenses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            handleFilterChange('category', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select
          value={filters.period || 'all'}
          onValueChange={(value) => handlePeriodFilter(value as any)}
        >
          <SelectTrigger>
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          placeholder="From date"
          value={filters.date_from || ''}
          onChange={(e) => handleFilterChange('date_from', e.target.value)}
        />

        {/* Date To */}
        <Input
          type="date"
          placeholder="To date"
          value={filters.date_to || ''}
          onChange={(e) => handleFilterChange('date_to', e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('expense_date')}
              >
                Date {filters.sort_by === 'expense_date' && (filters.sort_order === -1 ? '↓' : '↑')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('category')}
              >
                Category {filters.sort_by === 'category' && (filters.sort_order === -1 ? '↓' : '↑')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('amount')}
              >
                Amount {filters.sort_by === 'amount' && (filters.sort_order === -1 ? '↓' : '↑')}
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No expenses found</p>
                  <Button
                    variant="link"
                    onClick={() => router.push('/dashboard/expenses/new')}
                    className="mt-2"
                  >
                    Record your first expense
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                >
                  <TableCell>{expense.expense_date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell>{expense.vendor || '-'}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount)} {expense.currency}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {expense.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {expense.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{expense.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Total count */}
      <p className="text-sm text-muted-foreground text-center">
        Showing {expenses.length} of {total} expenses
      </p>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Expense"
        description="This will permanently delete this expense. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
