import type {
  ExtractedItem,
  ExtractionResponse,
  InvoicePrefill,
  PrefillItem,
} from "@/types/extraction";

// Port of frontend/src/lib/extraction-transformer.ts, kept behaviourally identical.

// Matches a trailing price in a job line, e.g. "Logo Design - $1,500.00", "Delivery: ₦7,500" or
// "Hosting NGN 20000". A dash, colon or currency marker must precede the number, so "Banner x2"
// is not read as a price of 2.
const TRAILING_PRICE =
  /(?:\s*[:–—-]\s*(?:[A-Z]{3}\s*|[$₦€£]\s*)?|\s*(?:[A-Z]{3}\s*|[$₦€£]\s*))(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:[A-Z]{3})?\s*$/;

const CURRENCY_ALIASES: Record<string, string> = {
  "₦": "NGN",
  NAIRA: "NGN",
  NAIRAS: "NGN",
  $: "USD",
  DOLLAR: "USD",
  DOLLARS: "USD",
  "£": "GBP",
  POUND: "GBP",
  POUNDS: "GBP",
  "€": "EUR",
  EURO: "EUR",
  EUROS: "EUR",
  CEDI: "GHS",
  CEDIS: "GHS",
  RAND: "ZAR",
  SHILLING: "KES",
  SHILLINGS: "KES",
};

type ItemsResult = { items: PrefillItem[]; needsReview: string[] };

function splitJobPrice(job: string): { description: string; price: number | null } {
  const match = job.match(TRAILING_PRICE);
  if (!match || match.index === undefined || match.index === 0) {
    return { description: job.trim(), price: null };
  }
  const price = parseFloat(`${match[1].replace(/,/g, "")}.${match[2] ?? "0"}`);
  return { description: job.slice(0, match.index).trim(), price };
}

/**
 * Builds line items without ever multiplying the extracted total.
 * - Each job line that carries its own price keeps it.
 * - If no line has a price, the total goes on a single line (the first job).
 * - Lines whose price could not be determined are listed in `needsReview`.
 */
function buildLineItems(jobs: string[], total: number): ItemsResult {
  if (jobs.length === 0) {
    return total > 0
      ? {
          items: [{ description: "Services", quantity: 1, unitPrice: total }],
          needsReview: [],
        }
      : { items: [], needsReview: [] };
  }

  const split = jobs.map(splitJobPrice);
  const anyPriced = split.some((s) => s.price !== null);
  const needsReview: string[] = [];

  const items = split.map((s, i): PrefillItem => {
    let price = s.price;
    if (!anyPriced) price = i === 0 ? total : 0;
    if (price === null || (!anyPriced && jobs.length > 1)) {
      needsReview.push(s.description);
    }
    return { description: s.description, quantity: 1, unitPrice: price ?? 0 };
  });

  return { items, needsReview };
}

/** Uses the extractor's per-line `items` when present; prices it couldn't read are flagged for review. */
function itemsFromExtraction(rawItems: ExtractedItem[]): ItemsResult {
  const needsReview: string[] = [];
  const items = rawItems
    .filter((item) => item.description?.trim())
    .map((item): PrefillItem => {
      const description = (item.description ?? "").trim();
      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const unit = Number(item.unit_price);
      const hasPrice = Number.isFinite(unit) && unit > 0;
      if (!hasPrice) needsReview.push(description);
      return { description, quantity, unitPrice: hasPrice ? unit : 0 };
    });
  return { items, needsReview };
}

/** Normalises "naira", "₦" or "ngn" to an ISO code; returns undefined if it can't. */
export function normaliseCurrency(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const key = value.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(key)) return key;
  return CURRENCY_ALIASES[key] ?? CURRENCY_ALIASES[value.trim()];
}

/** Parses "YYYY-MM-DD" (or any Date.parse-able string) to local noon of that day. */
function parseDueDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12);
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) return undefined;
  const d = new Date(time);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

const clean = (value: string | null | undefined): string | undefined =>
  value?.trim() || undefined;

export function transformExtraction(response: ExtractionResponse): InvoicePrefill {
  const { parsed } = response;
  const total = parsed.amount || 0;
  const { items, needsReview } = parsed.items?.length
    ? itemsFromExtraction(parsed.items)
    : buildLineItems(parsed.jobs ?? [], total);

  return {
    items,
    dueDate: parseDueDate(parsed.deadlines?.[0]),
    currency: normaliseCurrency(parsed.currency),
    notes: clean(parsed.payment_terms),
    client: {
      name: clean(parsed.client_name),
      email: clean(parsed.client_email),
      address: clean(parsed.client_address),
    },
    confidence: Math.round(parsed.confidence ?? 0),
    needsReview,
  };
}

/** Same copy and cases as the web `describeExtractionError`, minus the billing link. */
export function describeExtractionError(error: unknown): string {
  const response =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { status?: number; data?: { detail?: unknown } } })
          .response
      : undefined;

  if (!response) {
    return "Can't reach InvoyQ. Check your connection and try again.";
  }
  const detail = response.data?.detail;
  if (response.status === 403 && typeof detail === "object" && detail !== null) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (response.status === 429) {
    return "Too many requests. Wait a minute and try again.";
  }
  if (response.status === 400 && typeof detail === "string") return detail;
  return "We couldn't find invoice details in that. Try clearer text or a sharper screenshot.";
}
