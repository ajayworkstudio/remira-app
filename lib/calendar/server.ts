import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEventPayload, generateICS } from "@/lib/calendar/ics";
import type { Reminder } from "@/types/reminder";
import type { ProfilePreferences } from "@/types/profile";

interface IcsRequest {
  origin: string;
  /** One reminder by id, or all pending reminders when omitted */
  reminderId?: string;
  filename: string;
  disposition: "inline" | "attachment";
}

/** Builds an ICS response from the signed-in user's reminders (RLS-scoped). */
export async function icsResponse({ origin, reminderId, filename, disposition }: IcsRequest) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  let query = supabase.from("reminders").select("*");
  query = reminderId ? query.eq("id", reminderId) : query.eq("is_completed", false).limit(1000);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Calendar file could not be generated." }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Nothing to export." }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
  const prefs = (profile?.preferences ?? {}) as ProfilePreferences;

  const ics = generateICS(
    (data as Reminder[]).map((r) =>
      createCalendarEventPayload(r, {
        durationMinutes: prefs.ics_event_duration ?? 30,
        includeAlarm: prefs.ics_include_alarm ?? true,
        appUrl: origin,
      }),
    ),
  );
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
