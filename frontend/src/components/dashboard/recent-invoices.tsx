'use client';

import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Money } from '@/components/shared/money';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, formatRelativeDate, invoiceClientName } from '@/lib/format';
import type { Invoice } from '@/types/api';

interface RecentInvoicesProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export function RecentInvoices({ invoices, isLoading }: RecentInvoicesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle as="h2" className="font-display text-lg">Recent invoices</CardTitle>
          <CardDescription>Your latest five</CardDescription>
        </div>
        {invoices.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/invoices">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Paste a chat with a client and InvoyQ will draft the invoice for you."
            action={
              <Button asChild>
                <Link href="/dashboard/extract">Extract from chat</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.number}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {invoiceClientName(invoice)} · {formatRelativeDate(invoice.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Money amount={invoice.total} currency={invoice.currency} className="font-semibold" />
                    <p className="text-xs text-muted-foreground">Due {formatDate(invoice.due_date)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
