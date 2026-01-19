'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, Pencil, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeDate, formatSimpleDate, formatCurrency } from '@/lib/format';
import type { Invoice } from '@/types/api';

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onDelete?: (id: string, number: string) => void;
}

export function InvoiceList({ invoices, isLoading, onDelete }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
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
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first invoice to get started.
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('sent')}
          >
            Sent
          </Button>
          <Button
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('paid')}
          >
            Paid
          </Button>
          <Button
            variant={statusFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('overdue')}
          >
            Overdue
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    {invoice.number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    {invoice.client?.name || `Client #${invoice.client_id}`}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    {formatRelativeDate(invoice.issued_date)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    {formatSimpleDate(invoice.due_date)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(invoice.id, invoice.number)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.client?.name || `Client #${invoice.client_id}`}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatRelativeDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due:</span>
                  <span>{formatSimpleDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete?.(invoice.id, invoice.number)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No invoices match your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
