import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const heroPath = (await getSectionHeroByRoute("lounge", "kitchen")) ?? "/carab5.jpeg";

  return (
    <section className="bg-gradient-to-r from-red-800/10 via-black to-neutral-800 ">
      <Hero path={heroPath} title="Savor Elegance, Bite by Bite." lounge="Kitchen" />
      <Menu />
    </section>
  );
}