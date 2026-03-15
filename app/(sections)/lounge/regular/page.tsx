import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function RegularPage() {
  const heroPath = (await getSectionHeroByRoute("lounge", "regular")) ?? "/carab.jpg";

  return (
    <section className="bg-gradient-to-r from-blue-900/15 via-black to-black ">
      <Hero path={heroPath} title="Where Class Meets Comfort" lounge="Regular" />
      <Menu />
    </section>
  );
}