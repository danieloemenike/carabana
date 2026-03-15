import { NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { menuCategories, menuItems, menuSections } from "@/lib/db/schema";
import { normalizeSectionKey } from "@/lib/menus/sections";
import { toPublicImageUrl } from "@/lib/r2";

const createItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  price: z.string().min(1),
  imageKey: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawSectionKey = searchParams.get("sectionKey");
  const sectionKey = rawSectionKey ? normalizeSectionKey(rawSectionKey) : null;
  if (!sectionKey) {
    return NextResponse.json({ error: "Invalid sectionKey" }, { status: 400 });
  }

  const section = await db.query.menuSections.findFirst({
    where: eq(menuSections.key, sectionKey),
  });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const categories = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.sectionId, section.id));

  if (!categories.length) {
    return NextResponse.json([]);
  }

  const items = await db
    .select()
    .from(menuItems)
    .where(inArray(menuItems.categoryId, categories.map((category) => category.id)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.createdAt));

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      imageUrl: toPublicImageUrl(item.imageKey),
    }))
  );
}

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

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const category = await db.query.menuCategories.findFirst({
    where: eq(menuCategories.id, parsed.data.categoryId),
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(menuItems)
    .values({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      price: parsed.data.price,
      imageKey: parsed.data.imageKey ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  await db
    .update(menuSections)
    .set({ updatedAt: new Date() })
    .where(eq(menuSections.id, category.sectionId));

  return NextResponse.json(
    {
      ...created,
      imageUrl: toPublicImageUrl(created.imageKey),
    },
    { status: 201 }
  );
}
