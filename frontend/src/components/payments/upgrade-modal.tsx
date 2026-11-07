"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const [provider, setProvider] = useState<"paystack" | "stripe">(
    currencyInfo.paymentProviders.includes("paystack") ? "paystack" : "stripe"
  );
  const createSubscription = useCreateSubscription();

  const handleUpgrade = () => {
    const callbackUrl = `${window.location.origin}/dashboard/settings/billing?verify=true`;

    toast.promise(
      createSubscription.mutateAsync({
        provider,
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

  const features = [
    "Unlimited invoice extractions",
    "Payment link generation",
    "Email reminders",
    "Priority support",
    "Advanced analytics",
    "Custom branding",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-warning" />
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            Unlock all premium features and take your invoicing to the next level
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

          {/* Payment Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Payment Method</Label>
            <RadioGroup value={provider} onValueChange={(value: string) => setProvider(value as "paystack" | "stripe")}>
              {currencyInfo.paymentProviders.includes("paystack") && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="paystack" id="paystack" />
                  <Label htmlFor="paystack" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Paystack</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Credit/Debit Card, Bank Transfer
                    </div>
                  </Label>
                </div>
              )}
              {currencyInfo.paymentProviders.includes("stripe") && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Stripe</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Credit/Debit Card, Google Pay, Apple Pay
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
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
