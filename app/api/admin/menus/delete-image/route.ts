import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteObject, isR2Key } from "@/lib/r2";

const deleteImageSchema = z.object({
  imageKey: z.string().min(1),
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

  const parsed = deleteImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { imageKey } = parsed.data;
  if (!isR2Key(imageKey)) {
    return NextResponse.json({ ok: true });
  }

  await deleteObject(imageKey);
  return NextResponse.json({ ok: true });
}
