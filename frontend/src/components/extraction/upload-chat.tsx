'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SAMPLE_INVOICE_TEXT } from '@/lib/extraction-transformer';
import { cn } from '@/lib/utils';

interface UploadChatProps {
  onExtract: (formData: FormData) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadChat({ onExtract, isLoading }: UploadChatProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');

  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateAndSetFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please add an image file (PNG or JPG).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`The image must be smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }
    setSelectedFile(file);
  }, []);

  const removeFile = () => setSelectedFile(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  // Pasting a screenshot straight into the text box attaches it.
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
    if (file) {
      e.preventDefault();
      validateAndSetFile(file);
    }
  };

  const handleExtract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !textInput.trim()) return;
    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    if (textInput.trim()) formData.append('text', textInput.trim());
    onExtract(formData);
  };

  const canExtract = Boolean(selectedFile) || textInput.trim().length > 0;

  return (
    <form onSubmit={handleExtract}>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Label htmlFor="chat-text" className="text-base">
                Paste the conversation
              </Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setTextInput(SAMPLE_INVOICE_TEXT)}
                disabled={isLoading}
              >
                Try an example
              </Button>
            </div>
            <Textarea
              id="chat-text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onPaste={handlePaste}
              placeholder={'e.g. "Hi Ada, thanks for the order. 2 logo concepts at ₦25,000 each, delivery ₦5,000. Payment due by Friday."'}
              className="min-h-56 text-base sm:text-sm"
              disabled={isLoading}
              autoFocus
              aria-describedby="chat-text-hint"
            />
            <p id="chat-text-hint" className="text-xs text-muted-foreground">
              WhatsApp, email or SMS text works. Include the client&apos;s name, what you did, and the amounts.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium" id="screenshot-label">
              Or add a screenshot <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            {selectedFile ? (
              <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-3">
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt="Selected screenshot"
                    width={64}
                    height={64}
                    unoptimized
                    className="size-16 rounded-md border object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isLoading}
                  aria-label="Remove screenshot"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="screenshot"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 text-sm transition-colors',
                  'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                  dragActive ? 'border-primary bg-accent' : 'hover:border-primary/50 hover:bg-muted/50',
                )}
              >
                <ImagePlus className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  <span className="font-medium">Choose an image</span>
                  <span className="text-muted-foreground"> or drag it here. You can also paste it into the box above. PNG or JPG, up to 10MB.</span>
                </span>
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-labelledby="screenshot-label"
                  disabled={isLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndSetFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!canExtract || isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isLoading ? 'Reading your chat…' : 'Extract invoice details'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
