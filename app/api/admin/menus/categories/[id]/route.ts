import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { menuCategories } from "@/lib/db/schema";
import { getSectionIdByCategoryId, updateSectionTimestamp } from "@/lib/menus/queries";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  const [updated] = await db
    .update(menuCategories)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(menuCategories.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const sectionId = await getSectionIdByCategoryId(id);
  if (sectionId) {
    await updateSectionTimestamp(sectionId);
  }

  return NextResponse.json(updated);
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
  const sectionId = await getSectionIdByCategoryId(id);

  const [deleted] = await db
    .delete(menuCategories)
    .where(eq(menuCategories.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (sectionId) {
    await updateSectionTimestamp(sectionId);
  }

  return NextResponse.json({ ok: true });
}
