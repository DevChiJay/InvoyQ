import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useInvoiceStats } from "@/hooks/useInvoices";
import { settingsStorage } from "@/services/storage/settingsStorage";
import type { ReferralAnswer } from "@/types/auth";

/**
 * One-time welcome after sign-up. Shown when this account hasn't seen it on this device and
 * has no invoices yet (so existing users updating the app don't get it).
 */
export function useWelcome() {
  const { user, updateProfile } = useAuth();
  const { data: statsData } = useInvoiceStats();
  const [visible, setVisible] = useState(false);

  const userId = user?.id;
  const invoiceCount = statsData?.stats?.total_count;

  useEffect(() => {
    // Wait for both; a failed/offline stats fetch leaves invoiceCount undefined and skips it.
    if (!userId || invoiceCount === undefined || invoiceCount > 0) return;
    let cancelled = false;
    settingsStorage.hasSeenWelcome(userId).then((seen) => {
      if (!cancelled && !seen) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, invoiceCount]);

  const finish = (answer: ReferralAnswer, createInvoice: boolean) => {
    setVisible(false);
    if (userId) void settingsStorage.markWelcomeSeen(userId);
    if (answer.referral_source) updateProfile(answer);
    if (createInvoice) {
      // Let the modal start closing before navigating
      setTimeout(() => router.push("/(tabs)/invoices/create"), 100);
    }
  };

  const fullName = user?.full_name?.trim();
  return {
    visible,
    firstName: fullName ? fullName.split(/\s+/)[0] : null,
    askReferral: !!user && !user.referral_source,
    onCreateInvoice: (answer: ReferralAnswer) => finish(answer, true),
    onDismiss: (answer: ReferralAnswer) => finish(answer, false),
  };
}
