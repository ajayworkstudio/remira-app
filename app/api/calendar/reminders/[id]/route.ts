import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { icsResponse } from "@/lib/calendar/server";

/** GET → one reminder as .ics, served inline so iOS Safari offers "Add to Calendar". */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return icsResponse({ origin: request.nextUrl.origin, reminderId: id, filename: "remira-reminder.ics", disposition: "inline" });
}
