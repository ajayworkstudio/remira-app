"use client";

import type { Repository, Snapshot } from "@/lib/data/repository";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { UserFacingError } from "@/lib/utils/errors";
import { addDays, combineDateTime, localTimezone, todayISO } from "@/lib/utils/date";
import type { Category } from "@/types/category";
import type { Note } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Reminder } from "@/types/reminder";

/**
 * On-device demo backend, used ONLY when Supabase env vars are absent.
 * Data lives in this browser's localStorage and is never shared.
 */
const KEY = "remira-demo-v1";
const DEMO_USER = "00000000-0000-4000-8000-000000000000";

interface DemoDB {
  profile: Profile;
  categories: Category[];
  reminders: Reminder[];
  notes: Note[];
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

function computeNotifyAt(r: Pick<Reminder, "reminder_date" | "reminder_time" | "notification_minutes_before">) {
  const d = combineDateTime(r.reminder_date, r.reminder_time);
  return new Date(d.getTime() - r.notification_minutes_before * 60_000).toISOString();
}

function seed(): DemoDB {
  const now = new Date().toISOString();
  const tz = localTimezone();
  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    id: uuid(), user_id: DEMO_USER, name: c.name, icon: c.icon, color: c.color, created_at: now, updated_at: now,
  }));
  const cat = (name: string) => categories.find((c) => c.name === name)?.id ?? null;
  const today = todayISO();
  const mk = (p: Partial<Reminder> & Pick<Reminder, "title" | "reminder_date" | "reminder_time">): Reminder => {
    const r: Reminder = {
      id: uuid(), user_id: DEMO_USER, description: null, timezone: tz, category_id: null, priority: "medium",
      repeat_type: "none", repeat_config: {}, notification_enabled: true, notification_minutes_before: 15,
      notification_sent_at: null, is_completed: false, completed_at: null, created_at: now, updated_at: now, ...p,
    };
    return { ...r, notify_at: computeNotifyAt(r) };
  };
  return {
    profile: {
      id: DEMO_USER, full_name: "Fajar", email: "demo@remira.app", avatar_url: null,
      preferences: { default_notification_minutes: 15, ics_event_duration: 30, ics_include_alarm: true },
      created_at: now, updated_at: now,
    },
    categories,
    reminders: [
      mk({ title: "Anatomy Lecture", description: "Upper limb — brachial plexus", reminder_date: today, reminder_time: "09:00:00", category_id: cat("Anatomy"), is_completed: true, completed_at: now }),
      mk({ title: "Clinical Practice", description: "Ward round, bring stethoscope", reminder_date: today, reminder_time: "13:00:00", category_id: cat("Clinical"), notification_minutes_before: 30 }),
      mk({ title: "Review Pharmacology", description: "Review chapter 4 and 5", reminder_date: today, reminder_time: "20:00:00", category_id: cat("Pharmacology"), priority: "high" }),
      mk({ title: "Anatomy Review", description: "Lower limb flashcards", reminder_date: addDays(today, 1), reminder_time: "09:00:00", category_id: cat("Anatomy") }),
      mk({ title: "Journal Club", reminder_date: addDays(today, 3), reminder_time: "16:00:00", category_id: cat("Research"), priority: "low", repeat_type: "weekly" }),
      mk({ title: "Cardiology Block Exam", description: "ECG interpretation + heart failure", reminder_date: addDays(today, 5), reminder_time: "08:00:00", category_id: cat("Exam"), priority: "high", notification_minutes_before: 60 }),
    ],
    notes: [
      { id: uuid(), user_id: DEMO_USER, title: "Heart Failure Overview", content: "# Key points\n- HFrEF vs HFpEF\n- NYHA classes I–IV\n\nSummary notes from lecture 7.", category_id: cat("Cardiology"), tags: ["cardio"], created_at: now, updated_at: now },
      { id: uuid(), user_id: DEMO_USER, title: "Beta Blockers", content: "# Classes\n- Cardioselective (β1): metoprolol, atenolol, bisoprolol\n- Non-selective: propranolol\n\n**Study tip:** link each drug to its mechanism before memorising side effects.", category_id: cat("Pharmacology"), tags: ["pharm", "cardio"], created_at: now, updated_at: new Date(Date.now() - 86_400_000).toISOString() },
      { id: uuid(), user_id: DEMO_USER, title: "Brachial Plexus Mnemonic", content: "Roots, Trunks, Divisions, Cords, Branches.", category_id: cat("Anatomy"), tags: ["anatomy", "mnemonic"], created_at: now, updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    ],
  };
}

function read(): DemoDB {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch {
    /* storage unavailable (private mode) — fall through to fresh seed */
  }
  const db = seed();
  write(db);
  return db;
}

function write(db: DemoDB) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore: demo data will just not persist */
  }
}

function mutate<T>(fn: (db: DemoDB) => T): T {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

const stamp = () => new Date().toISOString();

export function createDemoRepository(): Repository {
  return {
    mode: "demo",

    async load(): Promise<Snapshot> {
      const db = read();
      return {
        userId: DEMO_USER, email: db.profile.email, profile: db.profile,
        categories: db.categories, reminders: db.reminders, notes: db.notes, calendarEvents: [],
      };
    },

    async createReminder(input) {
      return mutate((db) => {
        const now = stamp();
        const r: Reminder = {
          id: uuid(), user_id: DEMO_USER, description: null, category_id: null, repeat_config: {},
          timezone: localTimezone(), notification_sent_at: null, is_completed: false, completed_at: null,
          created_at: now, updated_at: now, ...input,
        } as Reminder;
        r.notify_at = computeNotifyAt(r);
        db.reminders.push(r);
        return r;
      });
    },
    async updateReminder(id, patch) {
      return mutate((db) => {
        const i = db.reminders.findIndex((r) => r.id === id);
        if (i < 0) throw new UserFacingError("Reminder not found.");
        const prev = db.reminders[i];
        const next: Reminder = { ...prev, ...patch, id, user_id: DEMO_USER, updated_at: stamp() };
        if (next.is_completed && !prev.is_completed) next.completed_at = stamp();
        if (!next.is_completed) next.completed_at = null;
        next.notify_at = computeNotifyAt(next);
        db.reminders[i] = next;
        return next;
      });
    },
    async deleteReminder(id) {
      mutate((db) => void (db.reminders = db.reminders.filter((r) => r.id !== id)));
    },

    async createNote(input) {
      return mutate((db) => {
        const now = stamp();
        const n: Note = { id: uuid(), user_id: DEMO_USER, content: null, category_id: null, tags: [], created_at: now, updated_at: now, ...input } as Note;
        db.notes.unshift(n);
        return n;
      });
    },
    async updateNote(id, patch) {
      return mutate((db) => {
        const i = db.notes.findIndex((n) => n.id === id);
        if (i < 0) throw new UserFacingError("Note not found.");
        db.notes[i] = { ...db.notes[i], ...patch, updated_at: stamp() } as Note;
        return db.notes[i];
      });
    },
    async deleteNote(id) {
      mutate((db) => void (db.notes = db.notes.filter((n) => n.id !== id)));
    },

    async createCategory(input) {
      return mutate((db) => {
        if (db.categories.some((c) => c.name.toLowerCase() === input.name.trim().toLowerCase())) {
          throw new UserFacingError("That name is already in use.");
        }
        const now = stamp();
        const c: Category = { id: uuid(), user_id: DEMO_USER, icon: null, color: null, created_at: now, updated_at: now, ...input };
        db.categories.push(c);
        return c;
      });
    },
    async updateCategory(id, patch) {
      return mutate((db) => {
        const i = db.categories.findIndex((c) => c.id === id);
        if (i < 0) throw new UserFacingError("Category not found.");
        db.categories[i] = { ...db.categories[i], ...patch, updated_at: stamp() } as Category;
        return db.categories[i];
      });
    },
    async deleteCategory(id) {
      mutate((db) => {
        db.categories = db.categories.filter((c) => c.id !== id);
        db.reminders = db.reminders.map((r) => (r.category_id === id ? { ...r, category_id: null } : r));
        db.notes = db.notes.map((n) => (n.category_id === id ? { ...n, category_id: null } : n));
      });
    },

    async updateProfile(patch) {
      return mutate((db) => {
        db.profile = { ...db.profile, ...patch, updated_at: stamp() };
        return db.profile;
      });
    },
    async uploadAvatar(file) {
      if (file.size > 512 * 1024) throw new UserFacingError("In demo mode, photos must be under 512 KB.");
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new UserFacingError("Unable to read that image."));
        reader.readAsDataURL(file);
      });
    },
    async signOut() {
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    },
  };
}
