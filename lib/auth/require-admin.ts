import { auth } from "@/lib/auth/server";

export type RequireAdminResult =
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof auth.getSession>>["data"]> }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { ok: false, status: 401 };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return { ok: false, status: 403 };
  }

  return { ok: true, session };
}
