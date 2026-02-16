"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { BusinessSettingsForm } from "@/components/settings/business-settings-form";
import { SecuritySettingsForm } from "@/components/settings/security-settings-form";
import { User, Building2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const prompt = searchParams.get("prompt");

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // Show password setup prompt for new OAuth users
    if (
      prompt === "set-password" &&
      !localStorage.getItem("password_prompt_seen")
    ) {
      setTimeout(() => {
        toast.info(
          "Set a password to login with email and password on mobile",
          {
            description: "You can skip this for now and set it later.",
            duration: 10000,
            action: {
              label: "Skip",
              onClick: () => {
                localStorage.setItem("password_prompt_seen", "true");
              },
            },
          },
        );
      }, 500);
    }
  }, [prompt]);

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and business information
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Details
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Manage your company information that appears on invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Update your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
