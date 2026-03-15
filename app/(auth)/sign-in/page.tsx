import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-zinc-400">Sign in with your Carabana account.</p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-zinc-400">
        Need an account?{" "}
        <Link href="/sign-up" className="font-medium text-white underline-offset-4 hover:text-zinc-300 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
