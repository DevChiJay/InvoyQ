"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Calendar, CreditCard } from "lucide-react";
import { useSubscriptionStatus } from "@/lib/hooks/use-payments";
import { formatISODate } from "@/lib/format";

interface SubscriptionCardProps {
  onUpgrade: () => void;
}

export function SubscriptionCard({ onUpgrade }: SubscriptionCardProps) {
  const { data: subscription, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPro = subscription?.is_pro;
  const isActive = subscription?.subscription_status === "active";
  const daysRemaining = subscription?.days_remaining || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Crown className="h-5 w-5 text-warning" />
            ) : (
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>{isPro ? "Pro Plan" : "Free Plan"}</CardTitle>
          </div>
          {isPro && isActive && (
            <Badge variant="success">
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          {isPro
            ? "You have access to all pro features"
            : "Upgrade to unlock premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPro ? (
          <>
            {/* Pro Plan Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Started:</span>
                <span className="font-medium">
                  {subscription?.subscription_start_date
                    ? formatISODate(subscription.subscription_start_date)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Renews:</span>
                <span className="font-medium">
                  {subscription?.subscription_end_date
                    ? formatISODate(subscription.subscription_end_date)
                    : "N/A"}
                </span>
              </div>
              {daysRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">
                    {daysRemaining} days remaining
                  </span>
                </div>
              )}
              {subscription?.subscription_provider && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment via:</span>
                  <span className="font-medium capitalize">
                    {subscription.subscription_provider}
                  </span>
                </div>
              )}
            </div>

            {/* Pro Features */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Pro Features</h4>
              <ul className="space-y-2">
                {[
                  "Unlimited invoice extractions",
                  "Payment link generation",
                  "Email reminders",
                  "Priority support",
                  "Advanced analytics",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Free Plan Features */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Current Features</h4>
              <ul className="space-y-2">
                {[
                  "10 extractions per month",
                  "Basic invoice management",
                  "Client management",
                  "PDF generation",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade CTA */}
            <div className="pt-4 border-t">
              <div className="bg-accent p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock unlimited extractions, payment links, and more
                </p>
                <Button onClick={onUpgrade} className="w-full">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now - $29.99/month
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
