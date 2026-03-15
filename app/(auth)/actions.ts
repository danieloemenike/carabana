"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getStaffOnlyMessage, isStaffEmailAllowed } from "@/lib/auth/staff-access";

export async function signInAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: error.message };
  }

  const { data: session } = await auth.getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? email;
  const isStaffUser = role === "admin" || isStaffEmailAllowed(sessionEmail);

  if (!isStaffUser) {
    await auth.signOut();
    return { error: getStaffOnlyMessage() };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Name, email, password, and password confirmation are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!isStaffEmailAllowed(email)) {
    return { error: getStaffOnlyMessage() };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/sign-in");
}
