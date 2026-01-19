'use client';

import { useEffect } from 'react';
import { useExpenseStore } from '@/stores/expense-store';
import { formatCurrency, parseDecimal } from '@/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExpenseSummaryProps {
  filters?: {
    category?: string;
    date_from?: string;
    date_to?: string;
    period?: 'week' | 'month' | 'year';
    reference_date?: string;
  };
}

export function ExpenseSummary({ filters }: ExpenseSummaryProps) {
  const {
    summaries,
    grandTotal,
    periodStart,
    periodEnd,
    isLoading,
    fetchSummary,
  } = useExpenseStore();

  useEffect(() => {
    fetchSummary(filters);
  }, [filters, fetchSummary]);

  const getPeriodText = () => {
    if (periodStart && periodEnd) {
      return `${periodStart} to ${periodEnd}`;
    }
    if (filters?.period) {
      return `This ${filters.period}`;
    }
    if (filters?.date_from || filters?.date_to) {
      return `${filters.date_from || 'Start'} to ${filters.date_to || 'End'}`;
    }
    return 'All time';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading summary...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grand Total Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total Expenses
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {getPeriodText()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {formatCurrency(grandTotal)} NGN
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {summaries.length} {summaries.length === 1 ? 'category' : 'categories'}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown by Category</CardTitle>
            <CardDescription>Expense distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((summary) => {
                  const percentage = parseDecimal(grandTotal) > 0
                    ? ((parseDecimal(summary.total_amount) / parseDecimal(grandTotal)) * 100).toFixed(1)
                    : '0';

                  return (
                    <TableRow key={summary.category}>
                      <TableCell>
                        <Badge variant="outline">
                          {summary.category.charAt(0).toUpperCase() + summary.category.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{summary.count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(summary.total_amount)} {summary.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Data */}
      {summaries.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No expenses found for the selected period
          </CardContent>
        </Card>
      )}
    </div>
  );
}
