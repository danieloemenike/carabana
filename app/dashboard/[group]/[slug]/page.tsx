import { notFound, redirect } from "next/navigation";
import { MenuEditor } from "@/components/dashboard/MenuEditor";
import { resolveSectionFromRoute } from "@/lib/menus/sections";

const TITLES: Record<string, string> = {
  "club/regular": "Club Regular Editor",
  "club/vip": "Club VIP Editor",
  "lounge/kitchen": "Lounge Kitchen Editor",
  "lounge/madiba-sky": "Madiba + Sky Editor (Shared)",
  "lounge/regular": "Lounge Regular Editor",
};

export default async function DashboardSectionEditorPage({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = await params;
  const sectionKey = resolveSectionFromRoute(group, slug);

  if (!sectionKey) {
    notFound();
  }

  if (slug === "madiba" || slug === "sky") {
    redirect("/dashboard/lounge/madiba-sky");
  }

  return (
    <MenuEditor
      group={group}
      slug={slug}
      sectionKey={sectionKey}
      title={TITLES[sectionKey] ?? "Menu Editor"}
    />
  );
}
