"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { DemoNotice } from "@/components/auth/demo-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";
import { fieldErrors, sanitizeText } from "@/lib/validations";
import { friendlyAuthError } from "@/lib/utils/errors";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ ...form, full_name: sanitizeText(form.full_name), email: form.email.trim() });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
        },
      });
      if (error) throw error;
      if (data.session) {
        router.replace("/home");
        router.refresh();
      } else {
        setSentTo(parsed.data.email);
        setLoading(false);
      }
    } catch (err) {
      setErrors({ _form: friendlyAuthError(err) });
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="animate-rise text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand">
          <MailCheck className="size-8" aria-hidden />
        </div>
        <h1 className="mt-6 text-large font-bold">Check your inbox</h1>
        <p className="mt-2 text-body text-muted">
          We sent a confirmation link to <span className="font-semibold text-ink">{sentTo}</span>. Open it on this device to finish creating
          your account.
        </p>
        <Link href="/login" className="mt-8 inline-flex min-h-11 items-center font-semibold text-brand">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <h1 className="text-display font-bold text-ink">Create account</h1>
      <p className="mt-2 text-headline text-muted">Your study life, beautifully organized.</p>

      <div className="mt-8">
        {!isSupabaseConfigured ? <DemoNotice /> : null}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Full Name" error={errors.full_name}>
            {(p) => <TextInput {...p} autoComplete="name" placeholder="Fajar Maulana" value={form.full_name} onChange={set("full_name")} />}
          </Field>
          <Field label="Email" error={errors.email}>
            {(p) => <TextInput {...p} type="email" autoComplete="email" inputMode="email" placeholder="you@university.edu" value={form.email} onChange={set("email")} />}
          </Field>
          <Field label="Password" error={errors.password} hint="At least 8 characters.">
            {(p) => <PasswordInput {...p} autoComplete="new-password" value={form.password} onChange={set("password")} />}
          </Field>
          <Field label="Confirm Password" error={errors.confirm}>
            {(p) => <PasswordInput {...p} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />}
          </Field>

          {errors._form ? (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-small text-danger">
              {errors._form}
            </p>
          ) : null}

          <Button type="submit" size="lg" loading={loading} disabled={!isSupabaseConfigured} className="mt-2">
            Create Account
          </Button>
        </form>
        <p className="mt-8 text-center text-body text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
