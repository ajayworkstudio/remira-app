"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Repository, Snapshot } from "@/lib/data/repository";
import { createSupabaseRepository } from "@/lib/data/supabase-repository";
import { createDemoRepository } from "@/lib/data/demo-repository";
import { isSupabaseConfigured } from "@/lib/env";
import { friendlyError } from "@/lib/utils/errors";
import { nextOccurrence } from "@/lib/reminders/recurrence";
import { localTimezone } from "@/lib/utils/date";
import type { Category, CategoryInput } from "@/types/category";
import type { Note, NoteInput } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Reminder, ReminderInput } from "@/types/reminder";

type Status = "loading" | "ready" | "error";

export interface CompleteResult {
  /** Set when a repeating reminder rolled forward instead of completing */
  advancedTo: string | null;
}

interface DataContextValue {
  mode: Repository["mode"];
  status: Status;
  error: string | null;
  data: Snapshot | null;
  reload: () => Promise<void>;

  createReminder: (input: ReminderInput) => Promise<Reminder>;
  updateReminder: (id: string, patch: Partial<Reminder>) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<CompleteResult>;
  duplicateReminder: (id: string) => Promise<Reminder>;

  createNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, patch: Partial<NoteInput>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;

  createCategory: (input: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<CategoryInput>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  updateProfile: (patch: Partial<Pick<Profile, "full_name" | "avatar_url" | "preferences">>) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<string>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const sortReminders = (list: Reminder[]) =>
  [...list].sort((a, b) =>
    a.reminder_date === b.reminder_date
      ? a.reminder_time.localeCompare(b.reminder_time)
      : a.reminder_date.localeCompare(b.reminder_date),
  );
const sortNotes = (list: Note[]) => [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

export function DataProvider({ children }: { children: ReactNode }) {
  const [repo] = useState<Repository>(() => (isSupabaseConfigured ? createSupabaseRepository() : createDemoRepository()));

  const [data, setData] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((snap: Snapshot) => {
    setData({ ...snap, reminders: sortReminders(snap.reminders), notes: sortNotes(snap.notes) });
    setStatus("ready");
    setError(null);
  }, []);
  const fail = useCallback((err: unknown) => {
    setError(friendlyError(err, "Unable to load your data."));
    setStatus("error");
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      apply(await repo.load());
    } catch (err) {
      fail(err);
    }
  }, [repo, apply, fail]);

  useEffect(() => {
    let alive = true;
    repo.load().then(
      (snap) => alive && apply(snap),
      (err) => alive && fail(err),
    );
    return () => {
      alive = false;
    };
  }, [repo, apply, fail]);

  const patch = useCallback((fn: (d: Snapshot) => Snapshot) => setData((d) => (d ? fn(d) : d)), []);

  const value = useMemo<DataContextValue>(() => {
    const replaceReminder = (r: Reminder) =>
      patch((d) => ({ ...d, reminders: sortReminders(d.reminders.map((x) => (x.id === r.id ? r : x))) }));

    return {
      mode: repo.mode,
      status,
      error,
      data,
      reload: load,

      async createReminder(input) {
        const r = await repo.createReminder({ timezone: localTimezone(), ...input });
        patch((d) => ({ ...d, reminders: sortReminders([...d.reminders, r]) }));
        return r;
      },
      async updateReminder(id, changes) {
        const r = await repo.updateReminder(id, { timezone: localTimezone(), ...changes });
        replaceReminder(r);
        return r;
      },
      async deleteReminder(id) {
        await repo.deleteReminder(id);
        patch((d) => ({ ...d, reminders: d.reminders.filter((r) => r.id !== id) }));
      },
      async toggleReminder(id) {
        const current = data?.reminders.find((r) => r.id === id);
        if (!current) return { advancedTo: null };
        // Repeating reminder: completing it rolls it forward to the next occurrence.
        if (!current.is_completed && current.repeat_type !== "none") {
          const next = nextOccurrence(current, current.reminder_date);
          if (next) {
            const optimistic = { ...current, reminder_date: next };
            replaceReminder(optimistic);
            try {
              replaceReminder(await repo.updateReminder(id, { reminder_date: next }));
            } catch (err) {
              replaceReminder(current);
              throw err;
            }
            return { advancedTo: next };
          }
        }
        const optimistic = { ...current, is_completed: !current.is_completed };
        replaceReminder(optimistic);
        try {
          replaceReminder(await repo.updateReminder(id, { is_completed: !current.is_completed }));
        } catch (err) {
          replaceReminder(current);
          throw err;
        }
        return { advancedTo: null };
      },
      async duplicateReminder(id) {
        const src = data?.reminders.find((r) => r.id === id);
        if (!src) throw new Error("not found");
        const r = await repo.createReminder({
          title: `${src.title} (copy)`.slice(0, 120),
          description: src.description,
          reminder_date: src.reminder_date,
          reminder_time: src.reminder_time,
          timezone: localTimezone(),
          category_id: src.category_id,
          priority: src.priority,
          repeat_type: src.repeat_type,
          repeat_config: src.repeat_config,
          notification_enabled: src.notification_enabled,
          notification_minutes_before: src.notification_minutes_before,
        });
        patch((d) => ({ ...d, reminders: sortReminders([...d.reminders, r]) }));
        return r;
      },

      async createNote(input) {
        const n = await repo.createNote(input);
        patch((d) => ({ ...d, notes: sortNotes([n, ...d.notes]) }));
        return n;
      },
      async updateNote(id, changes) {
        const n = await repo.updateNote(id, changes);
        patch((d) => ({ ...d, notes: sortNotes(d.notes.map((x) => (x.id === id ? n : x))) }));
        return n;
      },
      async deleteNote(id) {
        await repo.deleteNote(id);
        patch((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
      },

      async createCategory(input) {
        const c = await repo.createCategory(input);
        patch((d) => ({ ...d, categories: [...d.categories, c] }));
        return c;
      },
      async updateCategory(id, changes) {
        const c = await repo.updateCategory(id, changes);
        patch((d) => ({ ...d, categories: d.categories.map((x) => (x.id === id ? c : x)) }));
        return c;
      },
      async deleteCategory(id) {
        await repo.deleteCategory(id);
        patch((d) => ({
          ...d,
          categories: d.categories.filter((c) => c.id !== id),
          reminders: d.reminders.map((r) => (r.category_id === id ? { ...r, category_id: null } : r)),
          notes: d.notes.map((n) => (n.category_id === id ? { ...n, category_id: null } : n)),
        }));
      },

      async updateProfile(changes) {
        const p = await repo.updateProfile(changes);
        patch((d) => ({ ...d, profile: p }));
        return p;
      },
      uploadAvatar: (file) => repo.uploadAvatar(file),
      async signOut() {
        await repo.signOut();
        setData(null);
      },
    };
  }, [repo, status, error, data, load, patch]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
