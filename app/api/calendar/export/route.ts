import type { NextRequest } from "next/server";
import { icsResponse } from "@/lib/calendar/server";

/** GET → all pending reminders as a single .ics file. */
export async function GET(request: NextRequest) {
  return icsResponse({ origin: request.nextUrl.origin, filename: "remira-reminders.ics", disposition: "attachment" });
}
