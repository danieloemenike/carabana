import { z } from "zod";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

const imageUploadSchema = z.object({
  type: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Use JPEG, PNG, WebP, AVIF, or GIF.",
  }),
  size: z.number().max(MAX_IMAGE_SIZE_BYTES, {
    message: `Image must be under ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`,
  }),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;

export function validateImageFile(
  file: File
): { success: true; data: ImageUploadInput } | { success: false; error: string } {
  const result = imageUploadSchema.safeParse({
    type: file.type as ImageUploadInput["type"],
    size: file.size,
  });

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstIssue = result.error.issues?.[0];
  return {
    success: false,
    error: firstIssue?.message ?? "Invalid image.",
  };
}
