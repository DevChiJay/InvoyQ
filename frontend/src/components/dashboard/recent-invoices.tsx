'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeDate, formatSimpleDate, formatCurrency } from '@/lib/format';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Invoice } from '@/types/api';

interface RecentInvoicesProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function RecentInvoices({ invoices, isLoading }: RecentInvoicesProps) {
  const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your latest invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your latest invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No invoices yet. Create your first invoice to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/invoices/new">Create Invoice</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Your latest invoices</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/invoices">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/dashboard/invoices/${invoice.id}`}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{invoice.number}</p>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {`Client #${invoice.client_id}`} •{' '}
                  {formatRelativeDate(invoice.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(invoice.total ?? 0, invoice.currency ?? 'NGN')}</p>
                <p className="text-xs text-muted-foreground">
                  Due: {formatSimpleDate(invoice.due_date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
