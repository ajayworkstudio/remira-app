import type { Category, CategoryInput } from "@/types/category";
import type { Note, NoteInput } from "@/types/note";
import type { Profile } from "@/types/profile";
import type { Reminder, ReminderInput } from "@/types/reminder";
import type { CalendarEvent } from "@/types/calendar";

export interface Snapshot {
  userId: string;
  email: string | null;
  profile: Profile | null;
  categories: Category[];
  reminders: Reminder[];
  notes: Note[];
  calendarEvents: CalendarEvent[];
}

/**
 * Storage abstraction. The Supabase implementation is the real backend;
 * the demo implementation keeps data on-device when Supabase isn't configured.
 * A future native iOS app talks to the same Supabase tables directly.
 */
export interface Repository {
  readonly mode: "supabase" | "demo";
  load(): Promise<Snapshot>;

  createReminder(input: ReminderInput): Promise<Reminder>;
  updateReminder(id: string, patch: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;

  createNote(input: NoteInput): Promise<Note>;
  updateNote(id: string, patch: Partial<NoteInput>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  updateProfile(patch: Partial<Pick<Profile, "full_name" | "avatar_url" | "preferences">>): Promise<Profile>;
  uploadAvatar(file: File): Promise<string>;
  signOut(): Promise<void>;
}
