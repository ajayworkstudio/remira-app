import type { Reminder } from "@/types/reminder";
import type { CalendarEvent } from "@/types/calendar";
import { occurrencesBetween } from "@/lib/reminders/recurrence";
import { toISODate } from "@/lib/utils/date";

export type AgendaItem =
  | { kind: "reminder"; key: string; date: string; time: string; reminder: Reminder }
  | { kind: "external"; key: string; date: string; time: string; event: CalendarEvent };

/** Expands reminders (incl. repeats) and external events into dated agenda items. */
export function buildAgenda(reminders: Reminder[], events: CalendarEvent[], from: string, to: string): Map<string, AgendaItem[]> {
  const map = new Map<string, AgendaItem[]>();
  const push = (item: AgendaItem) => {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  };
  for (const r of reminders) {
    const dates = r.is_completed ? (r.reminder_date >= from && r.reminder_date <= to ? [r.reminder_date] : []) : occurrencesBetween(r, from, to);
    for (const date of dates) push({ kind: "reminder", key: `${r.id}:${date}`, date, time: r.reminder_time.slice(0, 5), reminder: r });
  }
  for (const e of events) {
    const start = new Date(e.start_at);
    const date = toISODate(start);
    if (date < from || date > to) continue;
    push({ kind: "external", key: e.id, date, time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`, event: e });
  }
  for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
  return map;
}
