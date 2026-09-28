"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { DemoNotice } from "@/components/auth/demo-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";
import { fieldErrors } from "@/lib/validations";
import { friendlyAuthError } from "@/lib/utils/errors";

export function LoginForm({ linkError = false }: { linkError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>(
    linkError ? { _form: "That link is invalid or has expired. Please try again." } : {},
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword(parsed.data);
      if (error) throw error;
      router.replace("/home");
      router.refresh();
    } catch (err) {
      setErrors({ _form: friendlyAuthError(err) });
      setLoading(false);
    }
  }

  return (
    <div className="animate-rise">
      <h1 className="text-display font-bold text-ink">Welcome back</h1>
      <p className="mt-2 text-headline text-muted">Remember What Matters.</p>

      <div className="mt-8">
        {!isSupabaseConfigured ? <DemoNotice /> : null}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Email" error={errors.email}>
            {(p) => (
              <TextInput {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
          </Field>
          <Field label="Password" error={errors.password}>
            {(p) => <PasswordInput {...p} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>

          <div className="-mt-1 flex justify-end">
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-small font-semibold text-brand">
              Forgot password?
            </Link>
          </div>

          {errors._form ? (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-small text-danger">
              {errors._form}
            </p>
          ) : null}

          <Button type="submit" size="lg" loading={loading} disabled={!isSupabaseConfigured}>
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-center text-body text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
