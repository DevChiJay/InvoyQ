'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoice, useUpdateInvoice } from '@/lib/hooks/use-invoices';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { InvoiceUpdate, InvoiceCreate } from '@/types/api';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(invoiceId);
  const updateInvoice = useUpdateInvoice(invoiceId);

  const handleSubmit = (data: InvoiceCreate | InvoiceUpdate) => {
    updateInvoice.mutate(data as InvoiceUpdate, {
      onSuccess: () => {
        router.push(`/dashboard/invoices/${invoiceId}`);
      },
    });
  };

  if (invoiceLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        <div className="text-center py-12">
          <h3 className="font-semibold text-lg mb-2">Invoice not found</h3>
          <p className="text-sm text-muted-foreground">
            The invoice you&apos;re trying to edit doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/dashboard/invoices/${invoiceId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoice
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Invoice</h2>
        <p className="text-muted-foreground">Update invoice {invoice.number}</p>
      </div>

      <InvoiceForm
        invoice={invoice}
        onSubmit={handleSubmit}
        isLoading={updateInvoice.isPending}
        isEdit
      />
    </div>
  );
}
