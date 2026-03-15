import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function SkyPage() {
  const heroPath = (await getSectionHeroByRoute("lounge", "sky")) ?? "/carab4.jpeg";

  return (
    <section className="bg-gradient-to-r to-black via-black from-sky-900/20 ">
      <Hero path={heroPath} title="Where Luxury Feels Like Home" lounge="Sky" />
      <Menu />
    </section>
  );
}