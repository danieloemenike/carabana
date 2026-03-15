import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getUploadUrl,
  isAllowedImageContentType,
  makeSectionImageKey,
} from "@/lib/r2";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validations/image-upload";
import { normalizeSectionKey } from "@/lib/menus/sections";

const uploadUrlBodySchema = z.object({
  sectionKey: z.string().min(1),
  filename: z.string().min(1, "filename is required"),
  contentType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    message: "Only image types (jpeg, png, webp, avif, gif) are allowed",
  }),
  fileSize: z
    .number()
    .max(MAX_IMAGE_SIZE_BYTES, `Image must be under ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`)
    .optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = uploadUrlBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    return NextResponse.json({ error: first?.message ?? "Invalid request" }, { status: 400 });
  }

  const { sectionKey: rawSectionKey, contentType } = parsed.data;
  const sectionKey = normalizeSectionKey(rawSectionKey);

  if (!sectionKey) {
    return NextResponse.json({ error: "Invalid section key" }, { status: 400 });
  }

  if (!isAllowedImageContentType(contentType)) {
    return NextResponse.json(
      { error: "Only image types (jpeg, png, webp, avif, gif) are allowed" },
      { status: 400 }
    );
  }

  try {
    const key = makeSectionImageKey(sectionKey, contentType);
    const result = await getUploadUrl(key, contentType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
