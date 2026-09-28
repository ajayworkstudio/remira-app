"use client";

/**
 * CalendarService — web-compatible calendar integration.
 *
 * A browser cannot reach EventKit, so V1 hands events to Apple Calendar via .ics:
 *  • iPhone/iPad (signed in): navigate to a server route that responds with
 *    text/calendar — Safari then shows its native "Add to Calendar" sheet.
 *  • Desktop / demo mode: generate the file client-side and download it.
 * A future native (SwiftUI) wrapper can replace `addToAppleCalendar` with EventKit.
 */
import { createCalendarEventPayload, generateICS, icsFilename, type IcsOptions } from "@/lib/calendar/ics";
import { isIOS } from "@/lib/notifications/notification-service";
import { UserFacingError } from "@/lib/utils/errors";
import type { Reminder } from "@/types/reminder";

export { createCalendarEventPayload, generateICS };

export function downloadICS(filename: string, ics: string): void {
  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch {
    throw new UserFacingError("Calendar file could not be generated.");
  }
}

export function addToAppleCalendar(reminder: Reminder, opts: IcsOptions & { serverBacked: boolean }): void {
  if (opts.serverBacked && isIOS()) {
    // Same-origin navigation to text/calendar → iOS native "Add to Calendar" sheet.
    // Full navigation (not client routing): an API response the OS must handle.
    window.location.assign(new URL(`/api/calendar/reminders/${encodeURIComponent(reminder.id)}`, window.location.origin).href);
    return;
  }
  let ics: string;
  try {
    ics = generateICS([createCalendarEventPayload(reminder, { ...opts, appUrl: window.location.origin })]);
  } catch {
    throw new UserFacingError("Calendar file could not be generated.");
  }
  downloadICS(icsFilename(reminder.title), ics);
}

export function exportAllToICS(reminders: Reminder[], opts: IcsOptions & { serverBacked: boolean }): void {
  if (opts.serverBacked && isIOS()) {
    window.location.assign(new URL("/api/calendar/export", window.location.origin).href);
    return;
  }
  const pending = reminders.filter((r) => !r.is_completed);
  if (!pending.length) throw new UserFacingError("There are no upcoming reminders to export.");
  downloadICS(
    "remira-reminders.ics",
    generateICS(pending.map((r) => createCalendarEventPayload(r, { ...opts, appUrl: window.location.origin }))),
  );
}

export const CalendarService = { generateICS, downloadICS, createCalendarEventPayload, addToAppleCalendar, exportAllToICS };
