import type { BackendExtractionResponse, ExtractionResponse, ExtractedData } from '@/types/api';

type LineItem = NonNullable<ExtractedData['line_items']>[number];

// Matches a trailing price in a job line, e.g. "Logo Design - $1,500.00", "Delivery: ₦7,500" or
// "Hosting NGN 20000". A dash, colon or currency marker must precede the number, so "Banner x2"
// is not read as a price of 2.
const TRAILING_PRICE =
  /(?:\s*[:–—-]\s*(?:[A-Z]{3}\s*|[$₦€£]\s*)?|\s*(?:[A-Z]{3}\s*|[$₦€£]\s*))(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:[A-Z]{3})?\s*$/;

function splitJobPrice(job: string): { description: string; price: number | null } {
  const match = job.match(TRAILING_PRICE);
  if (!match || match.index === undefined || match.index === 0) {
    return { description: job.trim(), price: null };
  }
  const price = parseFloat(`${match[1].replace(/,/g, '')}.${match[2] ?? '0'}`);
  return { description: job.slice(0, match.index).trim(), price };
}

/** Returns YYYY-MM-DD for values a date input can show, otherwise undefined. */
function toDateInputValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const time = Date.parse(value);
  if (Number.isNaN(time)) return undefined;
  // Date.parse reads "February 15, 2024" as local midnight; use local parts so the day doesn't shift.
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Builds line items without ever multiplying the extracted total.
 * - Each job line that carries its own price keeps it.
 * - If no line has a price, the total goes on a single line (the first job).
 * - Lines whose price could not be determined are listed in `needs_review`.
 */
function buildLineItems(jobs: string[], total: number): { items: LineItem[]; needsReview: string[] } {
  if (jobs.length === 0) {
    return total > 0
      ? { items: [{ description: 'Services', quantity: 1, unit_price: total, amount: total }], needsReview: [] }
      : { items: [], needsReview: [] };
  }

  const split = jobs.map(splitJobPrice);
  const anyPriced = split.some((s) => s.price !== null);
  const needsReview: string[] = [];

  const items = split.map((s, i) => {
    let price = s.price;
    if (!anyPriced) price = i === 0 ? total : 0;
    if (price === null || (!anyPriced && jobs.length > 1)) needsReview.push(s.description);
    const unit = price ?? 0;
    return { description: s.description, quantity: 1, unit_price: unit, amount: unit };
  });

  return { items, needsReview };
}

/**
 * Transforms the backend extraction response to frontend display format
 */
export function transformExtractionResponse(backendResponse: BackendExtractionResponse): ExtractionResponse {
  const { extraction_id, parsed } = backendResponse;
  const total = parsed.amount || 0;
  const { items, needsReview } = buildLineItems(parsed.jobs ?? [], total);
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const transformedData: ExtractedData = {
    client: {
      name: parsed.client_name || undefined,
      email: parsed.client_email || undefined,
      address: parsed.client_address || undefined,
    },
    invoice_details: {
      due_date: toDateInputValue(parsed.deadlines?.[0]),
      currency: parsed.currency?.toUpperCase() || undefined,
    },
    line_items: items,
    financial: {
      subtotal,
      tax: 0,
      total: subtotal || total,
    },
    notes: parsed.payment_terms || undefined,
    confidence: parsed.confidence,
    needs_review: needsReview.length ? needsReview : undefined,
  };

  return {
    extraction_id,
    parsed: transformedData,
  };
}

/**
 * Creates a sample invoice text for demo purposes
 */
export const SAMPLE_INVOICE_TEXT = `INVOICE

From: Acme Design Studio
123 Creative Ave, Design City, CA 90210
Email: contact@acmedesign.com
Phone: (555) 123-4567

Bill To: TechCorp Solutions
Contact: billing@techcorp.com
Address: 456 Innovation Blvd, San Francisco, CA 94105

Invoice Date: January 15, 2024
Due Date: February 15, 2024

SERVICES PROVIDED:
1. Website Redesign - $5,000.00
2. Logo Design - $1,500.00
3. Brand Guidelines - $1,000.00

TOTAL AMOUNT: $7,500.00

Payment Terms: Net 30 days
Please remit payment via bank transfer or check.

Thank you for your business!`;
