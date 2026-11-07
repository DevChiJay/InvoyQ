"use client";

import { ReactNode, useState } from "react";
import { useSubscriptionStatus } from "@/lib/hooks/use-payments";
import { UpgradeModal } from "@/components/payments/upgrade-modal";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isProActive } from "@/lib/plan";

interface ProFeatureGateProps {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

export function ProFeatureGate({
  children,
  feature,
  fallback,
  showUpgradeButton = true,
}: ProFeatureGateProps) {
  const { data: subscription, isLoading } = useSubscriptionStatus();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  const isPro = isProActive(subscription);

  if (isPro) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    toast.info(`Upgrade to Pro to unlock ${feature}`);
    setIsUpgradeModalOpen(true);
  };

  if (fallback) {
    return (
      <>
        {fallback}
        <UpgradeModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-3 p-4">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <Crown className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Pro Feature</h3>
              <p className="text-sm text-muted-foreground">{feature} requires a Pro subscription</p>
            </div>
            {showUpgradeButton && (
              <Button onClick={handleUpgradeClick} size="sm">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>
      <UpgradeModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </>
  );
}

// Hook for programmatic pro feature checks
export function useProFeature() {
  const { data: subscription } = useSubscriptionStatus();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isPro = isProActive(subscription);

  const requirePro = (feature: string, callback: () => void) => {
    if (isPro) {
      callback();
    } else {
      toast.info(`Upgrade to Pro to unlock ${feature}`);
      setIsUpgradeModalOpen(true);
    }
  };

  return {
    isPro,
    requirePro,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
  };
}
