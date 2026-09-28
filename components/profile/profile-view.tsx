"use client";

import { useRef, useState } from "react";
import { BellRing, Camera, Info, LogOut, Palette, Pencil, SlidersHorizontal, Tags } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/profile/avatar";
import { SettingsGroup, SettingsRow } from "@/components/profile/settings-list";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useReminders } from "@/hooks/use-reminders";
import { useNotes } from "@/hooks/use-notes";
import { useSignOut } from "@/hooks/use-sign-out";
import { profileSchema } from "@/lib/validations/auth";
import { sanitizeText } from "@/lib/validations";
import { friendlyError } from "@/lib/utils/errors";

export function ProfileView() {
  const { profile, email, name, loading, update, uploadAvatar } = useProfile();
  const { reminders } = useReminders();
  const { notes } = useNotes();
  const { signOut, busy } = useSignOut();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await update({ avatar_url: url });
      toast.success("Photo updated");
    } catch (err) {
      toast.error(friendlyError(err, "Unable to upload photo."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveName() {
    const parsed = profileSchema.safeParse({ full_name: sanitizeText(draft) });
    if (!parsed.success) return setNameError(parsed.error.issues[0].message);
    setSaving(true);
    try {
      await update(parsed.data);
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      setNameError(friendlyError(err, "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  }

  const done = reminders.filter((r) => r.is_completed).length;

  return (
    <>
      <PageHeader title="Profile" />
      <section className="mb-7 flex flex-col items-center rounded-[var(--radius-card)] bg-surface px-5 py-7 text-center shadow-card">
        {loading ? (
          <>
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="mt-4 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-52" />
          </>
        ) : (
          <>
            <div className="relative">
              <Avatar name={profile?.full_name ?? name} url={profile?.avatar_url} size="lg" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change photo"
                className="absolute -bottom-1 -right-1 grid size-11 place-items-center rounded-full border-4 border-surface bg-brand text-on-brand disabled:opacity-60"
              >
                <Camera className="size-4" aria-hidden />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => onPhoto(e.target.files?.[0])} />
            </div>
            <div className="mt-4 flex items-center gap-1">
              <h2 className="text-title font-bold text-ink">{profile?.full_name || name}</h2>
              <button type="button" aria-label="Edit name" onClick={() => { setDraft(profile?.full_name ?? ""); setNameError(undefined); setEditing(true); }} className="grid size-11 place-items-center rounded-full text-muted hover:text-brand">
                <Pencil className="size-4" aria-hidden />
              </button>
            </div>
            <p className="-mt-1.5 text-body text-muted">{email}</p>
            <dl className="mt-6 grid w-full max-w-sm grid-cols-3 divide-x divide-line rounded-2xl bg-surface-2 py-3">
              {[["Reminders", reminders.length], ["Completed", done], ["Notes", notes.length]].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 text-caption text-muted">{label}</dt>
                  <dd className="text-title font-bold tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>

      <div className="flex flex-col gap-6">
        <SettingsGroup title="Settings">
          <SettingsRow icon={<SlidersHorizontal className="size-4.5" aria-hidden />} label="Preferences" detail="Defaults for new reminders & calendar" href="/settings#preferences" />
          <SettingsRow icon={<BellRing className="size-4.5" aria-hidden />} label="Notifications" href="/settings#notifications" />
          <SettingsRow icon={<Palette className="size-4.5" aria-hidden />} label="Appearance" detail="System, light or dark" href="/settings#appearance" />
          <SettingsRow icon={<Tags className="size-4.5" aria-hidden />} label="Categories" detail="Create, edit and delete" href="/settings#categories" />
          <SettingsRow icon={<Info className="size-4.5" aria-hidden />} label="About Remira" href="/settings#about" />
        </SettingsGroup>
        <SettingsGroup>
          <SettingsRow icon={<LogOut className="size-4.5" aria-hidden />} label={busy ? "Signing out…" : "Log out"} onClick={signOut} danger trailing={null} />
        </SettingsGroup>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit name">
        <div className="flex flex-col gap-4 pb-2 pt-2">
          <Field label="Full name" error={nameError}>
            {(p) => <TextInput {...p} value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="name" maxLength={80} autoFocus />}
          </Field>
          <Button size="lg" onClick={saveName} loading={saving}>Save</Button>
        </div>
      </Sheet>
    </>
  );
}
