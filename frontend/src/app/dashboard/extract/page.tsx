'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { AlertCircle } from 'lucide-react';
import { UploadChat } from '@/components/extraction/upload-chat';
import { useExtraction } from '@/lib/hooks/use-extraction';
import { transformExtractionResponse } from '@/lib/extraction-transformer';
import { EXTRACTION_STORAGE_KEY } from '@/components/invoices/invoice-form';
import { PageHeader } from '@/components/shared/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatErrorMessage } from '@/lib/utils';

const STEPS = ['Paste the chat', 'Review the draft', 'Save and send'];

/** Turns an extraction failure into something the person can act on. */
function describeExtractionError(error: unknown): string {
  if (!isAxiosError(error)) return 'Something went wrong. Please try again.';
  if (!error.response) return "Couldn't reach InvoyQ. Check your connection and try again.";
  const { status, data } = error.response;
  if (status === 429) return "You've reached the extraction limit for now. Wait a minute, then try again.";
  if (status === 400) return formatErrorMessage(data?.detail, 'Add some text or a screenshot first.');
  return "We couldn't find invoice details in that. Paste the text of the chat, or try a clearer screenshot.";
}

export default function ExtractPage() {
  const router = useRouter();
  const extraction = useExtraction();
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (formData: FormData) => {
    setError(null);
    try {
      const response = await extraction.mutateAsync(formData);
      const transformed = transformExtractionResponse(response.data);
      sessionStorage.setItem(EXTRACTION_STORAGE_KEY, JSON.stringify(transformed.parsed));
      router.push('/dashboard/invoices/new?from=extraction');
    } catch (err) {
      setError(describeExtractionError(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Turn a chat into an invoice"
        description="Paste a conversation or add a screenshot. You'll check every detail before anything is saved."
      />

      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Steps">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                i === 0
                  ? 'flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground'
                  : 'flex size-6 items-center justify-center rounded-full border text-xs font-semibold'
              }
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className={i === 0 ? 'font-medium text-foreground' : undefined}>{step}</span>
          </li>
        ))}
      </ol>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Extraction didn&apos;t work</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p>
              You can also{' '}
              <Link href="/dashboard/invoices/new" className="font-medium underline underline-offset-4">
                enter the invoice manually
              </Link>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}

      <UploadChat onExtract={handleExtract} isLoading={extraction.isPending} />
    </div>
  );
}
