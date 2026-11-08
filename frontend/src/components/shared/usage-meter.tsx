"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUsage } from "@/lib/hooks/use-usage";
import { BILLING_HREF } from "@/constants/plans";
import { formatResetDate, type UsageResource } from "@/lib/plan";
import { cn } from "@/lib/utils";
import type { UsageCounter } from "@/types/api";

function Row({ label, counter }: { label: string; counter: UsageCounter }) {
  if (counter.limit === null) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{counter.used} this month</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((counter.used / counter.limit) * 100));
  const atLimit = counter.used >= counter.limit;
  const nearLimit = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium tabular-nums", atLimit && "text-destructive-strong")}>
          {counter.used} / {counter.limit}
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`${label}: ${counter.used} of ${counter.limit} used this month`}
        className="h-1.5 bg-muted"
        indicatorClassName={atLimit ? "bg-destructive" : nearLimit ? "bg-warning" : "bg-primary"}
      />
    </div>
  );
}

/** Sidebar block: what the Free plan has left this month, or a Pro badge. */
export function UsageMeter({ className }: { className?: string }) {
  const { data: usage, isLoading } = useUsage();

  if (isLoading) {
    return <div className={cn("h-24 animate-pulse rounded-lg bg-muted", className)} aria-hidden="true" />;
  }
  if (!usage) return null;

  if (usage.plan === "pro") {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm", className)}>
        <Crown className="size-4 text-accent-foreground" aria-hidden="true" />
        <span className="font-medium text-accent-foreground">Pro plan</span>
        <Badge variant="success" className="ml-auto">
          Unlimited
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-lg border bg-card p-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Free plan</p>
        <Link
          href={BILLING_HREF}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
        >
          Upgrade
        </Link>
      </div>
      <Row label="Invoices" counter={usage.invoices} />
      <Row label="AI extractions" counter={usage.extractions} />
      <p className="text-xs text-muted-foreground">Resets {formatResetDate(usage.resets_at)}</p>
    </div>
  );
}

const NOUN: Record<UsageResource, { one: string; many: string }> = {
  invoices: { one: "invoice", many: "invoices" },
  extractions: { one: "AI extraction", many: "AI extractions" },
};

/**
 * Inline heads-up for one resource. Shows nothing until 80% of the Free allowance is used,
 * then a warning, then a blocking message once the limit is reached.
 */
export function UsageNotice({ resource, className }: { resource: UsageResource; className?: string }) {
  const { data: usage } = useUsage();
  const counter = usage?.[resource];
  if (!usage || !counter || counter.limit === null) return null;

  const left = Math.max(0, counter.limit - counter.used);
  const atLimit = left === 0;
  if (!atLimit && counter.used / counter.limit < 0.8) return null;

  const noun = left === 1 ? NOUN[resource].one : NOUN[resource].many;
  return (
    <div
      role={atLimit ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        atLimit ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10",
        className,
      )}
    >
      <p>
        {atLimit ? (
          <>
            You&apos;ve used all {counter.limit} {NOUN[resource].many} on the Free plan this month. They reset on{" "}
            {formatResetDate(usage.resets_at)}.
          </>
        ) : (
          <>
            {left} {noun} left on the Free plan this month.
          </>
        )}
      </p>
      <Link href={BILLING_HREF} className="font-medium underline underline-offset-4">
        See upgrade options
      </Link>
    </div>
  );
}
