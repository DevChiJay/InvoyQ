"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (file: File) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "avatar" | "logo";
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
  type = "avatar",
  label,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (type === "logo") {
      validTypes.push("image/svg+xml");
    }
    
    if (!validTypes.includes(file.type)) {
      alert(`Invalid file type. Please upload: ${validTypes.join(", ")}`);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call onChange with file
    onChange(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        {type === "avatar" ? (
          <Avatar className="h-24 w-24">
            <AvatarImage src={preview} alt="Avatar preview" />
            <AvatarFallback className="text-2xl">
              <Upload className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Logo preview" className="object-contain h-full w-full" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={type === "logo" ? "image/*" : "image/jpeg,image/png,image/jpg,image/webp"}
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {type === "avatar" ? "Photo" : "Logo"}
              </>
            )}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {type === "logo" 
              ? "PNG, JPG, WebP or SVG (max 5MB)"
              : "PNG, JPG or WebP (max 5MB)"}
          </p>
        </div>
      </div>
    </div>
  );
}
