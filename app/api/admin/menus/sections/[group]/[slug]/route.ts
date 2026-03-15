import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { menuSections } from "@/lib/db/schema";
import { getSectionMenuByRoute } from "@/lib/menus/queries";
import { resolveSectionFromRoute } from "@/lib/menus/sections";

const updateSectionSchema = z.object({
  title: z.string().min(1).optional(),
  heroImageKey: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ group: string; slug: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  const { group, slug } = await context.params;
  const section = await getSectionMenuByRoute(group, slug);
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json(section);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ group: string; slug: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: admin.status }
    );
  }

  const { group, slug } = await context.params;
  const sectionKey = resolveSectionFromRoute(group, slug);
  if (!sectionKey) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const payload = parsed.data;
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  await db
    .update(menuSections)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(and(eq(menuSections.group, group as "club" | "lounge"), eq(menuSections.key, sectionKey)));

  const updated = await getSectionMenuByRoute(group, slug);
  return NextResponse.json(updated);
}
