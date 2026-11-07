'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaymentHistory } from '@/lib/hooks/use-payments';
import { formatCurrency, formatSimpleDate } from '@/lib/format';
import { CreditCard, Loader2, Receipt } from 'lucide-react';
import type { Payment } from '@/types/api';

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePaymentHistory(50, 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
    };

    const colors: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-700 border-green-200',
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      failed: 'bg-red-500/10 text-red-700 border-red-200',
      cancelled: 'bg-gray-500/10 text-gray-700 border-gray-200',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getProviderIcon = () => {
    return <CreditCard className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">
          View all your subscription payments and transactions
        </p>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle>Transaction History</CardTitle>
          </div>
          <CardDescription>
            A complete record of all your payments and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Reference
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment: Payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="font-medium">{formatSimpleDate(payment.created_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {payment.description || 'Payment'}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {payment.payment_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getProviderIcon()}
                          <span className="text-sm capitalize">{payment.provider}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {payment.provider_ref || 'N/A'}
                        </code>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.currency}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="font-semibold text-lg mb-2">No Payment History</h3>
              <p className="text-sm text-muted-foreground">
                You haven&apos;t made any payments yet. Your transaction history will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile View - Card Layout */}
      {payments && payments.length > 0 && (
        <div className="lg:hidden space-y-4">
          {payments.map((payment: Payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{payment.description || 'Payment'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSimpleDate(payment.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">
                      {formatCurrency(payment.amount)} {payment.currency}
                    </p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="text-muted-foreground">Provider</p>
                    <p className="capitalize">{payment.provider}</p>
                  </div>
                </div>
                {payment.provider_ref && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Reference</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                      {payment.provider_ref}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
