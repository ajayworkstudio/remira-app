/**
 * Standards-compliant iCalendar (RFC 5545) generation. Pure & isomorphic:
 * used by the browser (download) and by route handlers (iOS "Add to Calendar").
 *
 * Times are emitted in UTC (…Z), converted from the reminder's own IANA timezone,
 * so events land at the right moment in Apple Calendar regardless of device zone.
 */
import type { Reminder } from "@/types/reminder";

export interface CalendarEventPayload {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  /** UTC instant */
  start: Date;
  /** UTC instant */
  end: Date;
  rrule?: string | null;
  /** minutes before start; null = no alarm */
  alarmMinutesBefore?: number | null;
  url?: string | null;
}

export interface IcsOptions {
  durationMinutes?: number;
  includeAlarm?: boolean;
  appUrl?: string;
}

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// ------------------------------------------------------------------ time zones

/** Offset (ms) of `tz` from UTC at instant `utcMs`. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

function safeTz(tz: string | null | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Converts a wall-clock date/time in `tz` into a UTC Date (DST-aware). */
export function zonedToUtc(dateISO: string, time: string, tz: string): Date {
  const zone = safeTz(tz);
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0);
  let utc = guess - tzOffsetMs(guess, zone);
  utc = guess - tzOffsetMs(utc, zone); // second pass settles DST boundaries
  return new Date(utc);
}

// ------------------------------------------------------------------ formatting

const pad = (n: number) => String(n).padStart(2, "0");

export function formatUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** RFC 5545 §3.3.11 TEXT escaping. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** RFC 5545 §3.1 line folding at 75 octets, never splitting a UTF-8 sequence. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

// ------------------------------------------------------------------ recurrence

/** Builds an RRULE for a reminder, shifting BYDAY/BYMONTHDAY when UTC date ≠ local date. */
export function reminderRRule(r: Pick<Reminder, "repeat_type" | "repeat_config" | "reminder_date">, startUtc: Date): string | null {
  if (r.repeat_type === "none") return null;
  const cfg = r.repeat_config ?? {};
  const interval = Math.max(1, cfg.interval ?? 1);
  const [y, m, d] = r.reminder_date.split("-").map(Number);
  const localDay = Date.UTC(y, m - 1, d);
  const utcDay = Date.UTC(startUtc.getUTCFullYear(), startUtc.getUTCMonth(), startUtc.getUTCDate());
  const shift = Math.round((utcDay - localDay) / 86_400_000); // -1, 0 or +1

  const parts: string[] = [];
  const weekdays = cfg.weekdays?.length ? cfg.weekdays : null;
  switch (r.repeat_type) {
    case "daily":
      parts.push("FREQ=DAILY");
      break;
    case "weekly":
    case "custom":
      if (r.repeat_type === "custom" && !weekdays) {
        parts.push("FREQ=DAILY");
      } else {
        parts.push("FREQ=WEEKLY");
        const days = weekdays ?? [new Date(localDay).getUTCDay()];
        parts.push(`BYDAY=${days.map((wd) => WEEKDAYS[(((wd + shift) % 7) + 7) % 7]).join(",")}`);
      }
      break;
    case "monthly": {
      parts.push("FREQ=MONTHLY");
      let md = d + shift;
      if (md < 1) md = -1; // 1st local → last day of previous month in UTC
      parts.push(`BYMONTHDAY=${Math.min(md, 31)}`);
      break;
    }
  }
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  if (cfg.until) parts.push(`UNTIL=${cfg.until.replace(/-/g, "")}T235959Z`);
  return parts.join(";");
}

// ------------------------------------------------------------------ public API

export function createCalendarEventPayload(r: Reminder, opts: IcsOptions = {}): CalendarEventPayload {
  const start = zonedToUtc(r.reminder_date, r.reminder_time, r.timezone || "UTC");
  const duration = Math.max(5, Math.min(24 * 60, opts.durationMinutes ?? 30));
  return {
    uid: `${r.id}@remira.app`,
    title: r.title,
    description: r.description,
    start,
    end: new Date(start.getTime() + duration * 60_000),
    rrule: reminderRRule(r, start),
    alarmMinutesBefore: opts.includeAlarm !== false && r.notification_enabled ? r.notification_minutes_before : null,
    url: opts.appUrl ? `${opts.appUrl.replace(/\/$/, "")}/reminders/${r.id}` : null,
  };
}

export function generateICS(events: CalendarEventPayload[], now: Date = new Date()): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Remira//Remember What Matters//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Remira",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${formatUtc(now)}`,
      `DTSTART:${formatUtc(e.start)}`,
      `DTEND:${formatUtc(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    if (e.alarmMinutesBefore !== null && e.alarmMinutesBefore !== undefined) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(e.title)}`,
        `TRIGGER:-PT${Math.max(0, e.alarmMinutesBefore)}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function icsFilename(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .toLowerCase();
  return `${slug || "remira-event"}.ics`;
}
