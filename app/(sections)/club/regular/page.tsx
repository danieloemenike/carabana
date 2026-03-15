import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function RegularPage() {
  const heroPath = (await getSectionHeroByRoute("club", "regular")) ?? "/clubb1.jpg";

  return (
    <section className="bg-gradient-to-r from-orange-800/10 via-black to-zinc-800/15 ">
      <Hero path={heroPath} title="A Classy Affair, Every Night" />
      <Menu />
    </section>
  );
}