import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { menuCategories, menuSections } from "@/lib/db/schema";
import { normalizeSectionKey } from "@/lib/menus/sections";

const createCategorySchema = z.object({
  sectionKey: z.string().min(1),
  name: z.string().min(1),
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
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.sectionId, section.id))
    .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.createdAt));

  return NextResponse.json(categories);
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const sectionKey = normalizeSectionKey(parsed.data.sectionKey);
  if (!sectionKey) {
    return NextResponse.json({ error: "Invalid sectionKey" }, { status: 400 });
  }

  const section = await db.query.menuSections.findFirst({
    where: eq(menuSections.key, sectionKey),
  });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(menuCategories)
    .values({
      sectionId: section.id,
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  await db
    .update(menuSections)
    .set({ updatedAt: new Date() })
    .where(eq(menuSections.id, section.id));

  return NextResponse.json(created, { status: 201 });
}
