import Image from "next/image";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="flex min-h-screen flex-col bg-zinc-950 lg:flex-row">
      {/* Left: full-bleed image — hidden on small screens */}
      <div className="relative hidden flex-1 lg:block">
        <Image
          src="/carab1.webp"
          alt="Carabana Lounge"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" aria-hidden />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-lg font-medium tracking-wide text-white">Carabana</p>
          <p className="mt-0.5 text-sm text-white/80">Lounge & Club</p>
        </div>
      </div>

      {/* Right: form area */}
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-black px-4 py-12 lg:min-w-[45%] lg:px-16 lg:py-10">
        <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-zinc-950/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm lg:p-10">
          {children}
        </div>
      </div>
    </section>
  );
}
