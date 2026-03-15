import Menu from "./_components/Menu";
import Hero from "../_components/Hero";
import { getSectionHeroByRoute } from "@/lib/menus/queries";

export const dynamic = "force-dynamic";

export default async function VipPage() {
  const heroPath = (await getSectionHeroByRoute("club", "vip")) ?? "/caraa3.jpg";

  return (
    <section className="bg-gradient-to-r from-red-800/10 via-black to-black ">
      <Hero path={heroPath} title="Your VIP Ticket to Luxury" />
      <Menu />
    </section>
  );
}