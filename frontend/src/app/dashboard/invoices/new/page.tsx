'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import type { InvoiceCreate, InvoiceUpdate } from '@/types/api';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client') || undefined;

  const createInvoice = useCreateInvoice();

  const handleSubmit = (data: InvoiceCreate | InvoiceUpdate) => {
    createInvoice.mutate(data as InvoiceCreate, {
      onSuccess: (response) => {
        router.push(`/dashboard/invoices/${response.data.id}`);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Invoice</h2>
        <p className="text-muted-foreground">
          Fill in the details to create a new invoice
        </p>
      </div>

      <InvoiceForm
        onSubmit={handleSubmit}
        isLoading={createInvoice.isPending}
        preselectedClientId={preselectedClientId}
      />
    </div>
  );
}
