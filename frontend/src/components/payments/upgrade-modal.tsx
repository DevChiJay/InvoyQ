"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown, Loader2, CreditCard } from "lucide-react";
import { useCreateSubscription } from "@/lib/hooks/use-payments";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { currencyInfo, isLoading: geoLoading } = useGeolocation();
  const createSubscription = useCreateSubscription();

  const handleUpgrade = () => {
    const callbackUrl = `${window.location.origin}/dashboard/settings/billing?verify=true`;

    toast.promise(
      createSubscription.mutateAsync({
        provider: "paystack",
        currency: currencyInfo.currency,
        callback_url: callbackUrl,
      }),
      {
        loading: "Preparing payment link...",
        success: (data) => {
          // Redirect to payment page
          window.location.href = data.payment_url;
          return "Redirecting to payment...";
        },
        error: "Failed to create payment link. Please try again.",
      }
    );
  };

  const features = ["Unlimited invoices", "Unlimited AI extractions"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-warning" />
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            Remove the monthly limits on invoices and AI extractions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing */}
          <div className="bg-accent p-4 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {currencyInfo.symbol}{currencyInfo.price.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">{currencyInfo.period}</div>
            </div>
          </div>

          {/* Features List */}
          <div>
            <h4 className="text-sm font-semibold mb-3">What you&apos;ll get:</h4>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment method */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <CreditCard className="h-4 w-4 shrink-0" />
            <div>
              <div className="text-sm font-medium">Pay with Paystack</div>
              <div className="text-xs text-muted-foreground">
                Credit/Debit Card, Bank Transfer
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createSubscription.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1"
              disabled={createSubscription.isPending}
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
