"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { signUpAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required."),
    email: z.email({ message: "Enter a valid email address." }),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function SubmitButton({ disabled }: Readonly<{ disabled: boolean }>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating account...</span>
        </>
      ) : (
        "Create account"
      )}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, null);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationResult = signUpSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });
  const isFormValid = validationResult.success;
  const hasStartedTyping = Boolean(name || email || password || confirmPassword);
  const clientError = !isFormValid && hasStartedTyping ? validationResult.error.issues[0]?.message : null;

  useEffect(() => {
    if (!state?.success) {
      return;
    }

    toast.success("Account created successfully. Please sign in.");
    router.push("/sign-in");
  }, [router, state?.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-white">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-white">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-white">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={8}
            className={`${inputClass} pr-10`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-10 w-10 text-zinc-300"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm text-white">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={8}
            className={`${inputClass} pr-10`}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-10 w-10 text-zinc-300"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-zinc-500">Use a valid email and at least 8 password characters.</p>

      {clientError ? <p className="text-sm text-red-300">{clientError}</p> : null}
      {state?.error ? <p className="text-sm text-red-300">{state.error}</p> : null}

      <SubmitButton disabled={!isFormValid} />
    </form>
  );
}
