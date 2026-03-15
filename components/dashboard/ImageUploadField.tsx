"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  validateImageFile,
} from "@/lib/validations/image-upload";

type ImageUploadFieldProps = {
  sectionKey: string;
  value: string | null;
  onChange: (imageKey: string | null) => void;
  disabled?: boolean;
};

export function ImageUploadField({
  sectionKey,
  value,
  onChange,
  disabled,
}: Readonly<ImageUploadFieldProps>) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadMeta = await fetch("/api/admin/menus/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionKey,
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadMeta.ok) {
        const payload = await uploadMeta.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, imageKey } = await uploadMeta.json();

      const putResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putResult.ok) {
        throw new Error("Upload failed");
      }

      onChange(imageKey);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const imageUrl = resolveImageUrl(value);
  let uploadLabel = "Upload image";
  if (value) {
    uploadLabel = "Replace image";
  }
  if (uploading) {
    uploadLabel = "Uploading...";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploadLabel}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="space-y-1">
          <Image
            src={imageUrl}
            alt="Uploaded preview"
            width={180}
            height={110}
            className="h-24 w-40 rounded-md border border-zinc-700 bg-white object-cover"
          />
          <p className="max-w-[220px] truncate text-xs text-zinc-500">{value}</p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        disabled={disabled || uploading}
        onChange={handleFileSelect}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}

function resolveImageUrl(imageKey: string | null): string {
  if (!imageKey) return "";
  if (imageKey.startsWith("/")) return imageKey;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}
