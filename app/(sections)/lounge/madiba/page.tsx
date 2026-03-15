import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function MadibaPage() {
  const heroPath = (await getSectionHeroByRoute("lounge", "madiba")) ?? "/carab2.webp";

  return (
    <section className="bg-gradient-to-r from-neutral-900 via-black to-zinc-800 ">
      <Hero path={heroPath} title="Elegant Nights, Endless Memories." lounge="Madiba" />
      <Menu />
    </section>
  );
}