"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export function SecuritySettingsForm() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is OAuth user without password
  const isOAuthUser = user?.oauth_provider !== null && !user?.has_password;
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validateForm = (): boolean => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    // Only validate current password for users with existing passwords
    if (!isOAuthUser && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain at least 1 number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isOAuthUser) {
        // OAuth user setting password for first time
        await usersAPI.setPassword(formData.newPassword);
        toast.success(
          "Your password has been set successfully. You can now login with email and password.",
        );
        // Mark password prompt as seen
        localStorage.setItem("password_prompt_seen", "true");
      } else {
        // Regular user changing password
        await usersAPI.changePassword(
          formData.currentPassword,
          formData.newPassword,
        );
        toast.success("Your password has been updated successfully");
      }

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail ||
          `Failed to ${isOAuthUser ? "set" : "change"} password`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isOAuthUser && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => {
              setFormData({ ...formData, currentPassword: e.target.value });
              setErrors({ ...errors, currentPassword: "" });
            }}
            placeholder="Enter your current password"
            disabled={isLoading}
          />
          {errors.currentPassword && (
            <p className="text-sm text-destructive">{errors.currentPassword}</p>
          )}
        </div>
      )}

      {isOAuthUser && (
        <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You signed up with Google. Set a password to enable login with email
            and password on mobile.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={(e) => {
            setFormData({ ...formData, newPassword: e.target.value });
            setErrors({ ...errors, newPassword: "" });
          }}
          placeholder="Enter your new password"
          disabled={isLoading}
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Must be at least 6 characters with 1 number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            setErrors({ ...errors, confirmPassword: "" });
          }}
          placeholder="Confirm your new password"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isOAuthUser ? "Set Password" : "Change Password"}
      </Button>
    </form>
  );
}
