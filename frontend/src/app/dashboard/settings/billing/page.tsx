"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionCard } from "@/components/payments/subscription-card";
import { UpgradeModal } from "@/components/payments/upgrade-modal";
import { useVerifyPayment } from "@/lib/hooks/use-payments";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const verifyPayment = useVerifyPayment();

  // Handle payment verification on return from payment gateway
  useEffect(() => {
    const shouldVerify = searchParams.get("verify");
    const reference = searchParams.get("reference");
    const provider = searchParams.get("provider") as "paystack" | null;

    if (shouldVerify === "true" && reference && provider) {
      toast.promise(
        verifyPayment.mutateAsync({ reference, provider }),
        {
          loading: "Verifying payment...",
          success: (data) => {
            // Remove query params
            router.replace("/dashboard/settings/billing");
            return data.message || "Subscription activated successfully!";
          },
          error: "Payment verification failed. Please contact support.",
        }
      );
    }
  }, [searchParams, verifyPayment, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Back to settings">
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="mx-auto max-w-2xl">
        <SubscriptionCard onUpgrade={() => setIsUpgradeModalOpen(true)} />
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
