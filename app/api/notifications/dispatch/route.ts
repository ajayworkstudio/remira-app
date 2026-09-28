import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured, serverEnv } from "@/lib/env.server";
import { sendPush, type StoredSubscription } from "@/lib/notifications/push-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DueReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  reminder_time: string;
  notification_minutes_before: number;
}

function authorized(request: NextRequest): boolean {
  const secret = serverEnv.cronSecret;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Notification job. Call every minute from a scheduler (Supabase pg_cron, cron-job.org,
 * Vercel Cron on Pro, …) with `Authorization: Bearer $CRON_SECRET`.
 *  1. atomically claims due reminders (claim_due_reminder_notifications)
 *  2. loads the owners' push subscriptions
 *  3. sends Web Push
 *  4. prunes expired subscriptions
 */
async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured) return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });

  const admin = createAdminClient();
  const { data: due, error } = await admin.rpc("claim_due_reminder_notifications", { max_rows: 200 });
  if (error) {
    console.error("[dispatch] claim failed", error.message);
    return NextResponse.json({ error: "claim failed" }, { status: 500 });
  }
  const reminders = (due ?? []) as DueReminder[];
  if (!reminders.length) return NextResponse.json({ claimed: 0, sent: 0 });

  const userIds = [...new Set(reminders.map((r) => r.user_id))];
  const { data: subs } = await admin.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth").in("user_id", userIds);
  const byUser = new Map<string, StoredSubscription[]>();
  for (const s of (subs ?? []) as StoredSubscription[]) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);

  let sent = 0;
  const expired: string[] = [];
  for (const r of reminders) {
    const targets = byUser.get(r.user_id);
    if (!targets?.length) continue;
    const time = r.reminder_time.slice(0, 5);
    const result = await sendPush(targets, {
      title: r.title,
      body: r.notification_minutes_before > 0 ? `Starts at ${time}${r.description ? ` · ${r.description.slice(0, 80)}` : ""}` : r.description?.slice(0, 120) || `It's ${time} — time for this.`,
      url: `/reminders/${r.id}`,
      tag: `reminder-${r.id}`,
    });
    sent += result.sent;
    expired.push(...result.expired);
  }
  if (expired.length) await admin.from("push_subscriptions").delete().in("id", [...new Set(expired)]);

  return NextResponse.json({ claimed: reminders.length, sent, pruned: expired.length });
}

export const GET = handle;
export const POST = handle;
