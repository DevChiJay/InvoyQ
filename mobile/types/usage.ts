export type UsageResource = "invoices" | "extractions";

export type UsageCounter = {
  used: number;
  /** null means unlimited */
  limit: number | null;
};

export type Usage = {
  plan: "free" | "pro";
  period: string;
  resets_at: string;
  invoices: UsageCounter;
  extractions: UsageCounter;
  payments_enabled: boolean;
};

/** Parsed body of an HTTP 403 `limit_reached` response. */
export type LimitReached = {
  resource: UsageResource;
  limit: number;
  used: number;
  resetsAt: string;
  message: string;
};
