import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SectionKey } from "@/lib/menus/sections";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export function isAllowedImageContentType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

export function isR2Key(imageKey: string): boolean {
  return !!imageKey && !imageKey.startsWith("/");
}

function imageExtensionFromType(contentType: string): string {
  return (contentType.split("/")[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
}

export function makeSectionImageKey(sectionKey: SectionKey, contentType: string): string {
  const ext = imageExtensionFromType(contentType);
  const uuid = crypto.randomUUID();
  return `${sectionKey}/${uuid}.${ext}`;
}

export interface UploadUrlResult {
  uploadUrl: string;
  imageKey: string;
  publicUrl: string;
}

export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<UploadUrlResult> {
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is not set");
  }
  if (!isAllowedImageContentType(contentType)) {
    throw new Error(`Disallowed content type: ${contentType}`);
  }

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  } as PutObjectCommandInput);

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const resolvedPublicUrl = publicUrl ? `${publicUrl.replace(/\/$/, "")}/${key}` : "";

  return { uploadUrl, imageKey: key, publicUrl: resolvedPublicUrl };
}

export async function deleteObject(key: string): Promise<void> {
  if (!isR2Key(key) || !bucketName) {
    return;
  }

  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export function toPublicImageUrl(imageKey: string | null): string {
  if (!imageKey) return "";
  if (!isR2Key(imageKey)) return imageKey;
  if (!publicUrl) return imageKey;
  return `${publicUrl.replace(/\/$/, "")}/${imageKey}`;
}
