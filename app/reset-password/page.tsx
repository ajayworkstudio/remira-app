"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validations/auth";
import { friendlyAuthError } from "@/lib/utils/errors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (password !== confirm) return setError("Passwords don't match.");
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) throw err;
      toast.success("Password updated");
      router.replace("/home");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(3rem,calc(var(--safe-top)+2rem))]">
      <Wordmark className="mb-10" />
      <h1 className="text-large font-bold">Set a new password</h1>
      <p className="mt-2 text-body text-muted">Choose a password you haven&apos;t used before.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label="New password" hint="At least 8 characters.">
          {(p) => <PasswordInput {...p} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Confirm new password" error={error ?? undefined}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <Button type="submit" size="lg" loading={loading}>
          Update password
        </Button>
      </form>
    </main>
  );
}
