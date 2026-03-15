import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Create your account</h1>
        <p className="mt-1.5 text-sm text-zinc-400">Register to access Carabana tools and menus.</p>
      </div>

      <SignUpForm />

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-white underline-offset-4 hover:text-zinc-300 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
