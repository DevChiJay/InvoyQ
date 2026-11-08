"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Crown, Calendar, CreditCard, Mail } from "lucide-react";
import { useSubscriptionStatus } from "@/lib/hooks/use-payments";
import { useUsage } from "@/lib/hooks/use-usage";
import { formatISODate } from "@/lib/format";
import { formatResetDate, isProActive } from "@/lib/plan";
import { FREE_EXTRACTIONS_PER_MONTH, FREE_INVOICES_PER_MONTH, PRO_PRICE_NGN, PRO_PRICE_USD } from "@/constants/plans";
import type { UsageCounter } from "@/types/api";

interface SubscriptionCardProps {
  onUpgrade: () => void;
}

function UsageRow({ label, counter }: { label: string; counter: UsageCounter }) {
  const pct = counter.limit ? Math.min(100, Math.round((counter.used / counter.limit) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">
          {counter.used}
          {counter.limit !== null && ` of ${counter.limit}`} used
        </span>
      </div>
      {counter.limit !== null && (
        <Progress value={pct} aria-label={`${label}: ${counter.used} of ${counter.limit} used this month`} />
      )}
    </div>
  );
}

export function SubscriptionCard({ onUpgrade }: SubscriptionCardProps) {
  const { data: subscription, isLoading } = useSubscriptionStatus();
  const { data: usage } = useUsage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const isPro = isProActive(subscription);
  const daysRemaining = subscription?.days_remaining ?? null;
  const grantedByUs = subscription?.subscription_provider === "admin";
  const paymentsEnabled = usage?.payments_enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Crown className="h-5 w-5 text-warning" aria-hidden="true" />
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
            <CardTitle>{isPro ? "Pro plan" : "Free plan"}</CardTitle>
          </div>
          {isPro && <Badge variant="success">Active</Badge>}
        </div>
        <CardDescription>
          {isPro
            ? "Unlimited invoices and AI extractions."
            : `${FREE_INVOICES_PER_MONTH} invoices and ${FREE_EXTRACTIONS_PER_MONTH} AI extractions a month.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPro ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">
                {subscription?.subscription_start_date ? formatISODate(subscription.subscription_start_date) : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">{grantedByUs ? "Ends:" : "Renews:"}</span>
              <span className="font-medium">
                {subscription?.subscription_end_date ? formatISODate(subscription.subscription_end_date) : "No end date"}
              </span>
            </div>
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                <span className="text-muted-foreground">{daysRemaining} days remaining</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Plan source:</span>
              <span className="font-medium capitalize">
                {grantedByUs || !subscription?.subscription_provider ? "Added by InvoyQ" : subscription.subscription_provider}
              </span>
            </div>
          </div>
        ) : (
          <>
            {usage && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold">This month</h4>
                  <p className="text-xs text-muted-foreground">Resets on {formatResetDate(usage.resets_at)}</p>
                </div>
                <UsageRow label="Invoices" counter={usage.invoices} />
                <UsageRow label="AI extractions" counter={usage.extractions} />
              </div>
            )}

            <div className="rounded-lg bg-accent p-4">
              <h4 className="mb-2 font-semibold">Upgrade to Pro</h4>
              <p className="text-sm text-muted-foreground">
                Unlimited invoices and unlimited AI extractions.
              </p>
              <p className="mb-3 mt-1 text-sm font-medium tabular-nums">
                ${PRO_PRICE_USD}/month or ₦{PRO_PRICE_NGN.toLocaleString("en-NG")}/month
              </p>
              {paymentsEnabled ? (
                <Button onClick={onUpgrade} className="w-full">
                  <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
                  Upgrade to Pro
                </Button>
              ) : (
                <>
                  <p className="mb-3 text-sm">
                    Online payment isn&apos;t available yet. Contact us and we&apos;ll upgrade your account.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/contact">
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Contact us to upgrade
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
