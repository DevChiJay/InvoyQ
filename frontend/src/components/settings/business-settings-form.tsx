"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatErrorMessage } from "@/lib/utils";

interface BusinessFormData {
  company_name: string;
  company_address: string;
  tax_id: string;
  website: string;
}

export function BusinessSettingsForm() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<BusinessFormData>({
    defaultValues: {
      company_name: "",
      company_address: "",
      tax_id: "",
      website: "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        company_name: user.company_name || "",
        company_address: user.company_address || "",
        tax_id: user.tax_id || "",
        website: user.website || "",
      });
    }
  }, [user, reset]);

  const updateBusinessMutation = useMutation({
    mutationFn: usersAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Business details updated successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(err.response?.data?.detail, "Failed to update business details");
      toast.error(message);
    },
  });

  const handleLogoChange = async (file: File) => {
    setUploadingLogo(true);
    
    try {
      await usersAPI.uploadLogo(file);
      toast.success("Company logo uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(err.response?.data?.detail, "Failed to upload logo");
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = (data: BusinessFormData) => {
    updateBusinessMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ImageUpload
        value={user?.company_logo_url ?? undefined}
        onChange={handleLogoChange}
        type="logo"
        label="Company Logo"
        disabled={uploadingLogo}
      />

      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          {...register("company_name")}
          placeholder="Acme Inc."
        />
        {errors.company_name && (
          <p className="text-sm text-destructive">{errors.company_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_address">Company Address</Label>
        <Textarea
          id="company_address"
          {...register("company_address")}
          placeholder="123 Business St, Suite 100&#10;City, State 12345&#10;Country"
          rows={3}
        />
        {errors.company_address && (
          <p className="text-sm text-destructive">{errors.company_address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
        <Input
          id="tax_id"
          {...register("tax_id")}
          placeholder="123456789"
        />
        <p className="text-xs text-muted-foreground">
          This will appear on your invoices
        </p>
        {errors.tax_id && (
          <p className="text-sm text-destructive">{errors.tax_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          {...register("website")}
          placeholder="https://example.com"
        />
        {errors.website && (
          <p className="text-sm text-destructive">{errors.website.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={!isDirty || updateBusinessMutation.isPending}
        >
          {updateBusinessMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
