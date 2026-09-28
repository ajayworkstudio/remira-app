"use client";

import { createClient } from "@/lib/supabase/client";
import { UserFacingError, isOffline } from "@/lib/utils/errors";
import type { Repository, Snapshot } from "@/lib/data/repository";
import type { Category } from "@/types/category";
import type { Note } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Reminder } from "@/types/reminder";
import type { CalendarEvent } from "@/types/calendar";

const REMINDER_COLS =
  "id,user_id,title,description,reminder_date,reminder_time,timezone,category_id,priority,repeat_type,repeat_config,notification_enabled,notification_minutes_before,notify_at,notification_sent_at,is_completed,completed_at,created_at,updated_at";

function assertOnline() {
  if (isOffline()) {
    throw new UserFacingError("You are offline. Changes can't be saved until you're back online.");
  }
}

function check<T>(res: { data: T | null; error: { code?: string; message: string } | null }, fallback: string): T {
  if (res.error) {
    if (res.error.code === "23505") throw new UserFacingError("That name is already in use.");
    if (process.env.NODE_ENV !== "production") console.error(res.error);
    throw new UserFacingError(isOffline() ? "Please check your internet connection." : fallback);
  }
  if (res.data === null) throw new UserFacingError(fallback);
  return res.data;
}

/** Strips server-managed / identity fields so the client can never set them. */
function clean<T extends object>(patch: T): Partial<T> {
  const out = { ...patch } as Record<string, unknown>;
  for (const k of ["id", "user_id", "created_at", "updated_at", "notify_at", "notification_sent_at", "completed_at"]) {
    delete out[k];
  }
  return out as Partial<T>;
}

export function createSupabaseRepository(): Repository {
  const sb = createClient();

  return {
    mode: "supabase",

    async load(): Promise<Snapshot> {
      const { data: userData, error: userErr } = await sb.auth.getUser();
      if (userErr || !userData.user) throw new UserFacingError("Your session has expired. Please sign in again.");
      const user = userData.user;

      const [profile, categories, reminders, notes, events] = await Promise.all([
        sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        sb.from("categories").select("*").order("created_at"),
        sb.from("reminders").select(REMINDER_COLS).order("reminder_date").order("reminder_time"),
        sb.from("notes").select("*").order("updated_at", { ascending: false }),
        sb.from("calendar_events").select("*").order("start_at"),
      ]);
      if (categories.error || reminders.error || notes.error) {
        throw new UserFacingError(isOffline() ? "Please check your internet connection." : "Unable to load your data.");
      }

      let prof = (profile.data as Profile | null) ?? null;
      if (!prof) {
        // Safety net if the signup trigger didn't run (e.g. migration applied after signup).
        const created = await sb
          .from("profiles")
          .upsert({ id: user.id, email: user.email, full_name: (user.user_metadata?.full_name as string) ?? null })
          .select("*")
          .single();
        prof = (created.data as Profile | null) ?? null;
      }

      return {
        userId: user.id,
        email: user.email ?? null,
        profile: prof ? { ...prof, preferences: prof.preferences ?? {} } : null,
        categories: (categories.data ?? []) as Category[],
        reminders: ((reminders.data ?? []) as Reminder[]).map((r) => ({ ...r, repeat_config: r.repeat_config ?? {} })),
        notes: ((notes.data ?? []) as Note[]).map((n) => ({ ...n, tags: n.tags ?? [] })),
        calendarEvents: (events.error ? [] : (events.data ?? [])) as CalendarEvent[],
      };
    },

    async createReminder(input) {
      assertOnline();
      return check(await sb.from("reminders").insert(clean(input)).select(REMINDER_COLS).single(), "Unable to save reminder.") as Reminder;
    },
    async updateReminder(id, patch) {
      assertOnline();
      return check(
        await sb.from("reminders").update(clean(patch)).eq("id", id).select(REMINDER_COLS).single(),
        "Unable to update reminder.",
      ) as Reminder;
    },
    async deleteReminder(id) {
      assertOnline();
      const { error } = await sb.from("reminders").delete().eq("id", id);
      if (error) throw new UserFacingError("Unable to delete reminder.");
    },

    async createNote(input) {
      assertOnline();
      return check(await sb.from("notes").insert(clean(input)).select("*").single(), "Unable to save note.") as Note;
    },
    async updateNote(id, patch) {
      assertOnline();
      return check(await sb.from("notes").update(clean(patch)).eq("id", id).select("*").single(), "Unable to update note.") as Note;
    },
    async deleteNote(id) {
      assertOnline();
      const { error } = await sb.from("notes").delete().eq("id", id);
      if (error) throw new UserFacingError("Unable to delete note.");
    },

    async createCategory(input) {
      assertOnline();
      return check(await sb.from("categories").insert(clean(input)).select("*").single(), "Unable to create category.") as Category;
    },
    async updateCategory(id, patch) {
      assertOnline();
      return check(
        await sb.from("categories").update(clean(patch)).eq("id", id).select("*").single(),
        "Unable to update category.",
      ) as Category;
    },
    async deleteCategory(id) {
      assertOnline();
      const { error } = await sb.from("categories").delete().eq("id", id);
      if (error) throw new UserFacingError("Unable to delete category.");
    },

    async updateProfile(patch) {
      assertOnline();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new UserFacingError("Your session has expired. Please sign in again.");
      return check(
        await sb.from("profiles").update(clean(patch)).eq("id", u.user.id).select("*").single(),
        "Unable to update profile.",
      ) as Profile;
    },

    async uploadAvatar(file) {
      assertOnline();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new UserFacingError("Your session has expired. Please sign in again.");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        throw new UserFacingError("Please choose a PNG, JPG or WebP image.");
      }
      if (file.size > 2 * 1024 * 1024) throw new UserFacingError("Image must be smaller than 2 MB.");
      const ext = file.type.split("/")[1];
      const path = `${u.user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw new UserFacingError("Unable to upload photo.");
      return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    },

    async signOut() {
      await sb.auth.signOut();
    },
  };
}
