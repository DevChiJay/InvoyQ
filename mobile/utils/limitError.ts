import type { LimitReached } from "@/types/usage";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Read the structured `limit_reached` 403 the backend sends when a Free plan
 * allowance is used up: `{ detail: { code: "limit_reached", resource, limit, used, resets_at, message } }`.
 *
 * Other 403s (unverified email, admin routes) carry a string `detail`, so those return null.
 */
export function parseLimitError(error: unknown): LimitReached | null {
  if (!isRecord(error)) return null;
  const response = error.response;
  if (!isRecord(response) || response.status !== 403) return null;
  const data = response.data;
  if (!isRecord(data)) return null;
  const detail = data.detail;
  if (!isRecord(detail) || detail.code !== "limit_reached") return null;

  const resource = detail.resource === "extractions" ? "extractions" : "invoices";
  return {
    resource,
    limit: typeof detail.limit === "number" ? detail.limit : 0,
    used: typeof detail.used === "number" ? detail.used : 0,
    resetsAt: typeof detail.resets_at === "string" ? detail.resets_at : "",
    message:
      typeof detail.message === "string" && detail.message
        ? detail.message
        : "You've reached your plan limit for this month.",
  };
}
