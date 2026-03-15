import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { menuCategories, menuItems, menuSections } from "@/lib/db/schema";
import { resolveSectionFromRoute, type SectionKey } from "@/lib/menus/sections";
import { toPublicImageUrl } from "@/lib/r2";

export type MenuItemDto = {
  id: string;
  name: string;
  price: string;
  imageKey: string | null;
  imageUrl: string;
  sortOrder: number;
};

export type MenuCategoryDto = {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemDto[];
};

export type SectionMenuDto = {
  id: string;
  key: SectionKey;
  title: string;
  heroImageKey: string | null;
  heroImageUrl: string;
  categories: MenuCategoryDto[];
};

export async function getSectionByKey(sectionKey: SectionKey) {
  return db.query.menuSections.findFirst({
    where: eq(menuSections.key, sectionKey),
  });
}

export async function getSectionMenuByKey(sectionKey: SectionKey): Promise<SectionMenuDto | null> {
  const section = await getSectionByKey(sectionKey);
  if (!section) return null;

  const categories = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.sectionId, section.id))
    .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.createdAt));

  if (!categories.length) {
    return {
      id: section.id,
      key: section.key as SectionKey,
      title: section.title,
      heroImageKey: section.heroImageKey,
      heroImageUrl: toPublicImageUrl(section.heroImageKey),
      categories: [],
    };
  }

  const categoryIds = categories.map((category) => category.id);
  const items = await db
    .select()
    .from(menuItems)
    .where(inArray(menuItems.categoryId, categoryIds))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.createdAt));

  const itemsByCategory = new Map<string, MenuItemDto[]>();
  for (const item of items) {
    const existing = itemsByCategory.get(item.categoryId) ?? [];
    existing.push({
      id: item.id,
      name: item.name,
      price: item.price,
      imageKey: item.imageKey,
      imageUrl: toPublicImageUrl(item.imageKey),
      sortOrder: item.sortOrder,
    });
    itemsByCategory.set(item.categoryId, existing);
  }

  return {
    id: section.id,
    key: section.key as SectionKey,
    title: section.title,
    heroImageKey: section.heroImageKey,
    heroImageUrl: toPublicImageUrl(section.heroImageKey),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      items: itemsByCategory.get(category.id) ?? [],
    })),
  };
}

export async function getSectionMenuByRoute(group: string, slug: string): Promise<SectionMenuDto | null> {
  const sectionKey = resolveSectionFromRoute(group, slug);
  if (!sectionKey) return null;
  return getSectionMenuByKey(sectionKey);
}

export async function getSectionHeroByRoute(group: string, slug: string): Promise<string | null> {
  const sectionKey = resolveSectionFromRoute(group, slug);
  if (!sectionKey) return null;
  const section = await getSectionByKey(sectionKey);
  if (!section) return null;
  return toPublicImageUrl(section.heroImageKey) || null;
}

export async function updateSectionTimestamp(sectionId: string) {
  await db
    .update(menuSections)
    .set({ updatedAt: new Date() })
    .where(eq(menuSections.id, sectionId));
}

export async function getSectionIdByCategoryId(categoryId: string): Promise<string | null> {
  const row = await db
    .select({
      sectionId: menuCategories.sectionId,
    })
    .from(menuCategories)
    .where(eq(menuCategories.id, categoryId))
    .limit(1);

  return row[0]?.sectionId ?? null;
}

export async function getItemAndSection(itemId: string): Promise<{ imageKey: string | null; sectionId: string } | null> {
  const rows = await db
    .select({
      imageKey: menuItems.imageKey,
      sectionId: menuCategories.sectionId,
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
    .where(eq(menuItems.id, itemId))
    .limit(1);

  return rows[0] ?? null;
}

export async function ensureSectionByRoute(group: string, slug: string) {
  const sectionKey = resolveSectionFromRoute(group, slug);
  if (!sectionKey) return null;
  const section = await db.query.menuSections.findFirst({
    where: and(eq(menuSections.group, group as "club" | "lounge"), eq(menuSections.key, sectionKey)),
  });
  return section ?? null;
}
