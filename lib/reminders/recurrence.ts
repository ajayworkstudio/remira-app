import type { Reminder } from "@/types/reminder";
import { addDays, diffDays, parseISODate, toISODate } from "@/lib/utils/date";

type RecurrenceSource = Pick<Reminder, "reminder_date" | "repeat_type" | "repeat_config">;

function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  return addDays(iso, -d.getDay());
}

/** Whether a (possibly repeating) reminder has an occurrence on the given date. */
export function occursOn(r: RecurrenceSource, iso: string): boolean {
  const start = r.reminder_date;
  const diff = diffDays(start, iso);
  if (diff < 0) return false;
  const cfg = r.repeat_config ?? {};
  if (cfg.until && iso > cfg.until) return false;
  const interval = Math.max(1, cfg.interval ?? 1);
  const target = parseISODate(iso);

  switch (r.repeat_type) {
    case "none":
      return diff === 0;
    case "daily":
      return diff % interval === 0;
    case "weekly":
    case "custom": {
      const weekdays = cfg.weekdays?.length ? cfg.weekdays : null;
      if (r.repeat_type === "custom" && !weekdays) return diff % interval === 0; // every N days
      const days = weekdays ?? [parseISODate(start).getDay()];
      if (!days.includes(target.getDay())) return false;
      const weeks = Math.floor(diffDays(startOfWeek(start), startOfWeek(iso)) / 7);
      return weeks % interval === 0;
    }
    case "monthly": {
      const s = parseISODate(start);
      const months = (target.getFullYear() - s.getFullYear()) * 12 + (target.getMonth() - s.getMonth());
      if (months < 0 || months % interval !== 0) return false;
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      return target.getDate() === Math.min(s.getDate(), lastDay);
    }
    default:
      return diff === 0;
  }
}

/** All occurrence dates within [fromISO, toISO] inclusive. */
export function occurrencesBetween(r: RecurrenceSource, fromISO: string, toISO: string): string[] {
  if (r.repeat_type === "none") {
    return r.reminder_date >= fromISO && r.reminder_date <= toISO ? [r.reminder_date] : [];
  }
  const out: string[] = [];
  let cursor = fromISO > r.reminder_date ? fromISO : r.reminder_date;
  let guard = 0;
  while (cursor <= toISO && guard++ < 800) {
    if (occursOn(r, cursor)) out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Next occurrence strictly after `afterISO`, or null when the series has ended. */
export function nextOccurrence(r: RecurrenceSource, afterISO: string): string | null {
  if (r.repeat_type === "none") return null;
  let cursor = addDays(afterISO < r.reminder_date ? addDays(r.reminder_date, -1) : afterISO, 1);
  const limit = 366 * Math.max(1, r.repeat_config?.interval ?? 1) + 31;
  for (let i = 0; i < limit; i++) {
    if (r.repeat_config?.until && cursor > r.repeat_config.until) return null;
    if (occursOn(r, cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

export function repeatSummary(r: RecurrenceSource): string {
  const cfg = r.repeat_config ?? {};
  const n = Math.max(1, cfg.interval ?? 1);
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  switch (r.repeat_type) {
    case "none":
      return "Does not repeat";
    case "daily":
      return n === 1 ? "Every day" : `Every ${n} days`;
    case "weekly":
      return n === 1 ? `Every week on ${names[parseISODate(r.reminder_date).getDay()]}` : `Every ${n} weeks`;
    case "monthly":
      return n === 1 ? `Every month on day ${parseISODate(r.reminder_date).getDate()}` : `Every ${n} months`;
    case "custom": {
      if (cfg.weekdays?.length) {
        const list = [...cfg.weekdays].sort().map((d) => names[d]).join(", ");
        return n === 1 ? `Every ${list}` : `Every ${n} weeks on ${list}`;
      }
      return `Every ${n} days`;
    }
  }
}

export { toISODate };
