"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/utils/errors";
import { z } from "zod";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = z.email().safeParse(email.trim());
    if (!parsed.success) return setError("Please enter a valid email.");
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await createClient().auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-rise">
      <Link href="/login" className="-ml-2 mb-6 inline-flex min-h-11 items-center gap-1.5 px-2 text-small font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand">
            <MailCheck className="size-8" aria-hidden />
          </div>
          <h1 className="mt-6 text-large font-bold">Check your email</h1>
          <p className="mt-2 text-body text-muted">If an account exists for {email.trim()}, you&apos;ll receive a link to reset your password.</p>
        </div>
      ) : (
        <>
          <h1 className="text-large font-bold">Forgot password?</h1>
          <p className="mt-2 text-body text-muted">Enter your email and we&apos;ll send you a reset link.</p>
          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <Field label="Email" error={error ?? undefined}>
              {(p) => <TextInput {...p} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Button type="submit" size="lg" loading={loading} disabled={!isSupabaseConfigured}>
              Send reset link
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
