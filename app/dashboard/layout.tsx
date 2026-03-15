import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { signOutAction } from "@/app/(auth)/actions";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center bg-black p-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900">
              <Shield className="h-4 w-4 text-zinc-300" />
            </div>
            <h1 className="text-xl font-semibold">No permission</h1>
          </div>
          <p className="mt-3 text-sm text-zinc-300">Your account is not an admin.</p>
          <p className="mt-3 text-sm text-red-400">Please contact the Super-admin for access.</p>
          <form action={signOutAction} className="mt-6">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-black text-white">
        <AppSidebar />
        <SidebarInset className="bg-gradient-to-b from-zinc-950 via-black to-black">
          <header className="sticky top-0 z-20 border-b border-zinc-800/90 bg-black/80 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-sm text-zinc-200">Dashboard online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/" className="text-sm text-zinc-300 transition hover:text-white">
                  View site
                </Link>
                <form action={signOutAction}>
                  <Button type="submit" variant="outline">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl p-4 md:p-6">
            <div className="rounded-2xl bg-zinc-950/50 p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] md:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
