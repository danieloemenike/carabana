import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { menuCategories, menuItems, menuSections } from "../lib/db/schema";
import { regularMenu as clubRegularMenu } from "../menuData";
import { vipMenu } from "../club-vip-menu";
import { kitchenMenu } from "../kitchen-menu";
import { Madiba_Sky_Menu } from "../madiba-and-sky-menu";
import { regularMenu as loungeRegularMenu } from "../lounge-regular-menu";

type LegacyCategory = {
  category: string;
  drinks?: Array<{ name: string; price: string; image?: string }>;
  food?: Array<{ name: string; price: string; image?: string }>;
};

const sources: Array<{
  key: string;
  group: "club" | "lounge";
  slug: string;
  title: string;
  categories: LegacyCategory[];
}> = [
  {
    key: "club/regular",
    group: "club",
    slug: "regular",
    title: "Regular Club Menu",
    categories: clubRegularMenu as LegacyCategory[],
  },
  {
    key: "club/vip",
    group: "club",
    slug: "vip",
    title: "VIP Club Menu",
    categories: vipMenu as LegacyCategory[],
  },
  {
    key: "lounge/kitchen",
    group: "lounge",
    slug: "kitchen",
    title: "Kitchen Menu",
    categories: kitchenMenu as LegacyCategory[],
  },
  {
    key: "lounge/madiba-sky",
    group: "lounge",
    slug: "madiba-sky",
    title: "Madiba + Sky Menu",
    categories: Madiba_Sky_Menu as LegacyCategory[],
  },
  {
    key: "lounge/regular",
    group: "lounge",
    slug: "regular",
    title: "Regular Lounge Menu",
    categories: loungeRegularMenu as LegacyCategory[],
  },
];

async function upsertSection(source: (typeof sources)[number]) {
  const existing = await db.query.menuSections.findFirst({
    where: eq(menuSections.key, source.key),
  });

  const section =
    existing ??
    (
      await db
        .insert(menuSections)
        .values({
          key: source.key,
          group: source.group,
          slug: source.slug,
          title: source.title,
        })
        .returning()
    )[0];

  if (existing) {
    await db
      .update(menuSections)
      .set({
        title: source.title,
        group: source.group,
        slug: source.slug,
        updatedAt: new Date(),
      })
      .where(eq(menuSections.id, section.id));
  }

  await db.delete(menuCategories).where(eq(menuCategories.sectionId, section.id));

  for (let categoryIndex = 0; categoryIndex < source.categories.length; categoryIndex += 1) {
    const categorySource = source.categories[categoryIndex];

    const [category] = await db
      .insert(menuCategories)
      .values({
        sectionId: section.id,
        name: categorySource.category,
        sortOrder: categoryIndex,
      })
      .returning();

    const items = (categorySource.drinks ?? categorySource.food ?? []).filter((item) => item?.name && item?.price);

    if (!items.length) {
      continue;
    }

    await db.insert(menuItems).values(
      items.map((item, itemIndex) => ({
        categoryId: category.id,
        name: item.name,
        price: item.price,
        imageKey: item.image ?? null,
        sortOrder: itemIndex,
      }))
    );
  }
}

async function main() {
  for (const source of sources) {
    // eslint-disable-next-line no-console
    console.log(`Seeding ${source.key}...`);
    await upsertSection(source);
  }
  // eslint-disable-next-line no-console
  console.log("Done.");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
