import { isAxiosError } from "axios";

export type UsageResource = "invoices" | "extractions";

export interface LimitReached {
  resource: UsageResource;
  limit: number;
  used: number;
  /** ISO timestamp of the next reset (the 1st of next month, UTC). */
  resetsAt: string;
  /** Plain-English explanation written by the server. */
  message: string;
}

/** Pro means `is_pro` and a subscription that hasn't run out. No end date means it never lapses. */
export function isProActive(
  subscription: { is_pro: boolean; subscription_end_date: string | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription?.is_pro) return false;
  if (!subscription.subscription_end_date) return true;
  // The backend stores naive UTC timestamps; treat them as UTC.
  const raw = subscription.subscription_end_date;
  const end = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}Z`);
  return end.getTime() > now.getTime();
}

/** Reads the server's `limit_reached` error (HTTP 403) out of a failed request, or returns null. */
export function parseLimitError(error: unknown): LimitReached | null {
  if (!isAxiosError(error) || error.response?.status !== 403) return null;
  const detail = error.response.data?.detail;
  if (!detail || typeof detail !== "object" || detail.code !== "limit_reached") return null;
  return {
    resource: detail.resource,
    limit: Number(detail.limit),
    used: Number(detail.used),
    resetsAt: String(detail.resets_at),
    message: String(detail.message),
  };
}

/** "1 Dec" */
export function formatResetDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
