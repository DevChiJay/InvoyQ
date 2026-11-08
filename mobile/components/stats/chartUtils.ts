/** Money arrives as decimal strings ("0.00"); anything unparseable counts as 0 so charts never get NaN. */
export function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === "number" ? value : parseFloat(value ?? "");
  return Number.isFinite(n) ? n : 0;
}

/** 1200 -> "1.2K", 3400000 -> "3.4M". Used for axis labels, where space is tight. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1e9) return `${sign}${trim(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}${trim(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}${trim(abs / 1e3)}K`;
  return `${sign}${Math.round(abs)}`;
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function monthShort(month: number): string {
  return MONTHS_SHORT[month - 1] ?? "";
}

/**
 * Percent change from `previous` to `current`.
 * Returns null when there's no meaningful baseline (previous is 0 but current isn't).
 */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
