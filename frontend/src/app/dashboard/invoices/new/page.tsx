'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { InvoiceForm, EXTRACTION_STORAGE_KEY } from '@/components/invoices/invoice-form';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { UsageNotice } from '@/components/shared/usage-meter';
import type { InvoiceCreate, InvoiceUpdate } from '@/types/api';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client') || undefined;
  const fromExtraction = searchParams.get('from') === 'extraction';

  const createInvoice = useCreateInvoice();

  const handleSubmit = (data: InvoiceCreate | InvoiceUpdate) => {
    createInvoice.mutate(data as InvoiceCreate, {
      onSuccess: (response) => {
        sessionStorage.removeItem(EXTRACTION_STORAGE_KEY);
        router.push(`/dashboard/invoices/${response.data.id}`);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={fromExtraction ? 'Review your invoice' : 'Create New Invoice'}
        description={
          fromExtraction
            ? 'The AI drafted this from your chat. Check each detail, then save.'
            : 'Fill in the details to create a new invoice'
        }
        back={
          fromExtraction ? (
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/dashboard/extract">
                <ArrowLeft className="h-4 w-4" />
                Back to extraction
              </Link>
            </Button>
          ) : undefined
        }
      />

      <UsageNotice resource="invoices" />

      <InvoiceForm
        onSubmit={handleSubmit}
        isLoading={createInvoice.isPending}
        preselectedClientId={preselectedClientId}
        fromExtraction={fromExtraction}
      />
    </div>
  );
}
