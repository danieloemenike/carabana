import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { menuItems } from "@/lib/db/schema";
import { getItemAndSection, updateSectionTimestamp } from "@/lib/menus/queries";
import { deleteObject, isR2Key, toPublicImageUrl } from "@/lib/r2";

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.string().min(1).optional(),
  imageKey: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  categoryId: z.string().uuid().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  const { id } = await context.params;
  const current = await getItemAndSection(id);
  if (!current) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  const [updated] = await db
    .update(menuItems)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(menuItems.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const nextImageKey = parsed.data.imageKey;
  if (
    typeof nextImageKey === "string" &&
    current.imageKey &&
    current.imageKey !== nextImageKey &&
    isR2Key(current.imageKey)
  ) {
    await deleteObject(current.imageKey);
  }

  await updateSectionTimestamp(current.sectionId);

  return NextResponse.json({
    ...updated,
    imageUrl: toPublicImageUrl(updated.imageKey),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  const { id } = await context.params;
  const current = await getItemAndSection(id);
  if (!current) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await db.delete(menuItems).where(eq(menuItems.id, id));
  await updateSectionTimestamp(current.sectionId);

  if (current.imageKey && isR2Key(current.imageKey)) {
    await deleteObject(current.imageKey);
  }

  return NextResponse.json({ ok: true });
}
