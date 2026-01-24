"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./image-upload";
import { usersAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatErrorMessage } from "@/lib/utils";

interface ProfileFormData {
  full_name: string;
  email: string;
  phone: string;
}

export function ProfileSettingsForm() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: usersAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(err.response?.data?.detail, "Failed to update profile");
      toast.error(message);
    },
  });

  const handleAvatarChange = async (file: File) => {
    setAvatarFile(file);
    setUploadingAvatar(true);
    
    try {
      const response = await usersAPI.uploadAvatar(file);
      toast.success("Avatar uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: unknown } } };
      const message = formatErrorMessage(err.response?.data?.detail, "Failed to upload avatar");
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      full_name: data.full_name,
      phone: data.phone,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ImageUpload
        value={user?.avatar_url ?? undefined}
        onChange={handleAvatarChange}
        type="avatar"
        label="Profile Picture"
        disabled={uploadingAvatar}
      />

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          {...register("full_name", { required: "Name is required" })}
          placeholder="John Doe"
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          disabled
          className="bg-muted cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={!isDirty || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
