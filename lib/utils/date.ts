/**
 * Date helpers. Reminder dates are stored as local calendar dates
 * ("YYYY-MM-DD") + local times ("HH:MM[:SS]") plus an IANA timezone,
 * so everything here works on the device's local calendar.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function toHHMM(time: string): string {
  return time.slice(0, 5);
}

export function nowHHMM(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Combines a local date + time into a Date object in the device timezone. */
export function combineDateTime(dateISO: string, time: string): Date {
  const d = parseISODate(dateISO);
  const [h, m, s] = time.split(":").map(Number);
  d.setHours(h ?? 0, m ?? 0, s ?? 0, 0);
  return d;
}

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatLongDate(iso: string, locale?: string): string {
  return parseISODate(iso).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
}

export function formatShortDate(iso: string, locale?: string): string {
  return parseISODate(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function formatMonthYear(year: number, month: number, locale?: string): string {
  return new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function relativeDayLabel(iso: string, today: string): string {
  const diff = diffDays(today, iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return parseISODate(iso).toLocaleDateString(undefined, { weekday: "long" });
  return formatShortDate(iso);
}

export function relativeUpdated(timestamp: string, now: Date): string {
  const then = new Date(timestamp);
  const diff = diffDays(toISODate(then), toISODate(now));
  if (diff <= 0) return "Updated today";
  if (diff === 1) return "Updated yesterday";
  if (diff < 7) return `Updated ${diff} days ago`;
  return `Updated ${then.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

export function greetingFor(hour: number): string {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAY_NARROW = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function minutesLabel(min: number): string {
  if (min === 0) return "At time of event";
  if (min < 60) return `${min} minutes before`;
  if (min === 60) return "1 hour before";
  if (min % 1440 === 0) return `${min / 1440} day${min === 1440 ? "" : "s"} before`;
  if (min % 60 === 0) return `${min / 60} hours before`;
  return `${min} minutes before`;
}

export const NOTIFICATION_OPTIONS = [0, 5, 15, 30, 60] as const;
