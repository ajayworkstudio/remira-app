import type { Reminder } from "@/types/reminder";
import { addDays } from "@/lib/utils/date";

export interface ReminderGroups {
  overdue: Reminder[];
  today: Reminder[];
  tomorrow: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
}

export function groupReminders(list: Reminder[], today: string): ReminderGroups {
  const tomorrow = addDays(today, 1);
  const g: ReminderGroups = { overdue: [], today: [], tomorrow: [], upcoming: [], completed: [] };
  for (const r of list) {
    if (r.is_completed) g.completed.push(r);
    else if (r.reminder_date < today) g.overdue.push(r);
    else if (r.reminder_date === today) g.today.push(r);
    else if (r.reminder_date === tomorrow) g.tomorrow.push(r);
    else g.upcoming.push(r);
  }
  g.completed.sort((a, b) => (b.completed_at ?? b.updated_at).localeCompare(a.completed_at ?? a.updated_at));
  return g;
}

export function matchesReminderQuery(r: Reminder, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return r.title.toLowerCase().includes(needle) || (r.description ?? "").toLowerCase().includes(needle);
}
