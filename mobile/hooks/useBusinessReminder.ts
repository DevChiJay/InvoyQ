import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/config";
import { useAuth } from "./useAuth";

/**
 * Hook to manage business profile reminder logic
 *
 * Shows a reminder to add business details if:
 * - User hasn't dismissed the reminder
 * - User doesn't have a company name set
 *
 * @returns {Object} - shouldShowReminder: boolean, dismissReminder: function
 */
export function useBusinessReminder() {
  const { user } = useAuth();
  const [shouldShowReminder, setShouldShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkReminderStatus();
  }, [user]);

  const checkReminderStatus = async () => {
    try {
      setIsLoading(true);

      // Check if user has dismissed the reminder
      const dismissed = await AsyncStorage.getItem(
        STORAGE_KEYS.BUSINESS_REMINDER_DISMISSED,
      );

      if (dismissed === "true") {
        setShouldShowReminder(false);
        return;
      }

      // Check if user has business details (company_name is enough)
      const hasBusinessDetails =
        user?.company_name && user.company_name.trim() !== "";

      if (hasBusinessDetails) {
        setShouldShowReminder(false);
        return;
      }

      // Show reminder if not dismissed and no business details
      setShouldShowReminder(true);
    } catch (error) {
      console.error("Error checking reminder status:", error);
      setShouldShowReminder(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissReminder = async () => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BUSINESS_REMINDER_DISMISSED,
        "true",
      );
      setShouldShowReminder(false);
    } catch (error) {
      console.error("Error dismissing reminder:", error);
    }
  };

  const resetReminder = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.BUSINESS_REMINDER_DISMISSED);
      await checkReminderStatus();
    } catch (error) {
      console.error("Error resetting reminder:", error);
    }
  };

  return {
    shouldShowReminder,
    isLoading,
    dismissReminder,
    resetReminder,
    checkReminderStatus,
  };
}
