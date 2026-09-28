export type Priority = "low" | "medium" | "high";
export type RepeatType = "none" | "daily" | "weekly" | "monthly" | "custom";

/** Extensible repeat configuration stored as JSONB. */
export interface RepeatConfig {
  /** 0 = Sunday … 6 = Saturday (used by weekly/custom) */
  weekdays?: number[];
  /** Repeat every N units (days for daily/custom, weeks for weekly, months for monthly) */
  interval?: number;
  /** Optional last date (YYYY-MM-DD) */
  until?: string | null;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  /** YYYY-MM-DD, in the user's local timezone */
  reminder_date: string;
  /** HH:MM or HH:MM:SS, in the user's local timezone */
  reminder_time: string;
  /** IANA timezone the date/time were entered in */
  timezone: string;
  category_id: string | null;
  priority: Priority;
  repeat_type: RepeatType;
  repeat_config: RepeatConfig;
  notification_enabled: boolean;
  notification_minutes_before: number;
  notify_at?: string | null;
  notification_sent_at?: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderInput {
  title: string;
  description?: string | null;
  reminder_date: string;
  reminder_time: string;
  timezone?: string;
  category_id?: string | null;
  priority: Priority;
  repeat_type: RepeatType;
  repeat_config?: RepeatConfig;
  notification_enabled: boolean;
  notification_minutes_before: number;
}
