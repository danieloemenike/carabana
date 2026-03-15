import Link from "next/link";
import { Sparkles, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    href: "/lounge/regular",
    title: "Lounge",
    description: "Relaxed ambience, curated cocktails, and premium dishes.",
  },
  {
    href: "/club/regular",
    title: "Club",
    description: "High-energy nights, bottle service, and the full party mood.",
  },
  {
    href: "/dashboard",
    title: "Admin Dashboard",
    description: "Manage menu sections, images, and updates in one place.",
  },
];

const highlights = [
  {
    title: "Premium Experience",
    body: "From signature drinks to chef specials, every detail is crafted for unforgettable nights.",
    icon: Sparkles,
  },
  {
    title: "Curated Menus",
    body: "Explore dedicated Club and Lounge menu sections designed for different moods.",
    icon: UtensilsCrossed,
  },
  {
    title: "Secure Access",
    body: "Account access is protected with authentication and role-based permissions.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  const { data: session } = await auth.getSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute right-[-80px] top-[120px] h-[300px] w-[300px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-orange-500/15 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 md:px-10 md:py-24">
        <header className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.22em] text-zinc-300">
            Carabana
          </p>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              A refined nightlife and dining destination.
            </h1>
            <p className="max-w-2xl text-base text-zinc-300 md:text-lg">
              Discover vibrant Club and Lounge experiences, browse menus, and manage content from a central dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Go to dashboard
                </Link>
                <Link
                  href="/lounge/regular"
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Browse lounge menu
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-white/10 bg-zinc-950/70 p-5 transition hover:border-white/25 hover:bg-zinc-900/80"
            >
              <h2 className="text-xl font-semibold">{link.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{link.description}</p>
              <span className="mt-5 inline-block text-sm text-zinc-100 group-hover:translate-x-1 group-hover:transform">
                Explore now
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5">
              <item.icon className="h-5 w-5 text-zinc-200" />
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
