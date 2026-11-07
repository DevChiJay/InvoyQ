'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Pencil, Plus, Receipt, SearchX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenseStore } from '@/stores/expense-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { PageHeader } from '@/components/shared/page-header';
import { SortableHead } from '@/components/shared/sortable-head';
import { formatDate } from '@/lib/format';
import { formatDateToYYYYMMDD } from '@/lib/utils';

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function ExpenseList() {
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

  const sortDirection = (field: string) =>
    filters.sort_by === field ? (filters.sort_order === -1 ? 'desc' : 'asc') : null;
  const hasActiveFilter = Boolean(filters.category || filters.period || filters.date_from || filters.date_to);
  const initialLoading = isLoading && expenses.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage your business expenses"
        actions={
          <Button asChild>
            <Link href="/dashboard/expenses/new">
              <Plus className="h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {capitalise(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.period || 'all'} onValueChange={(value) => handlePeriodFilter(value as 'week' | 'month' | 'year' | 'all')}>
          <SelectTrigger className="w-full" aria-label="Filter by period">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-1">
          <Label htmlFor="expense-from" className="sr-only">From date</Label>
          <Input
            id="expense-from"
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="expense-to" className="sr-only">To date</Label>
          <Input
            id="expense-to"
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>
      </div>

      {initialLoading ? (
        <Card className="gap-0 p-4" aria-busy="true">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : expenses.length === 0 ? (
        <Card>
          {hasActiveFilter ? (
            <EmptyState
              icon={SearchX}
              title="No expenses match"
              description="Try a different category or date range."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    handlePeriodFilter('all');
                    handleFilterChange('category', undefined);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Record what the business spends so your monthly stats show real profit."
              action={
                <Button asChild>
                  <Link href="/dashboard/expenses/new">Record your first expense</Link>
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <Card className="hidden gap-0 py-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Date" direction={sortDirection('expense_date')} onSort={() => handleSort('expense_date')} />
                  <SortableHead label="Category" direction={sortDirection('category')} onSort={() => handleSort('category')} />
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <SortableHead label="Amount" align="right" direction={sortDirection('amount')} onSort={() => handleSort('amount')} />
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-24 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(expense.expense_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{capitalise(expense.category)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-medium">
                      <Link
                        href={`/dashboard/expenses/${expense.id}`}
                        className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {expense.description}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{expense.vendor || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={expense.amount} currency={expense.currency} className="font-medium" />
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-40 flex-wrap gap-1">
                        {expense.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {expense.tags.length > 2 && <Badge variant="secondary">+{expense.tags.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/dashboard/expenses/${expense.id}`} aria-label={`Edit ${expense.description}`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${expense.description}`}
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <ul className="space-y-2 md:hidden">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <Card className="flex-row items-center gap-3 p-4">
                  <Link
                    href={`/dashboard/expenses/${expense.id}`}
                    className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{expense.description}</p>
                      <Money amount={expense.amount} currency={expense.currency} className="font-semibold" />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(expense.expense_date)}{expense.vendor ? ` · ${expense.vendor}` : ''}</span>
                      <Badge variant="outline">{capitalise(expense.category)}</Badge>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${expense.description}`}
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {expenses.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {expenses.length} of {total} expenses
        </p>
      )}

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
