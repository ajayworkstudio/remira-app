import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPushConfigured } from "@/lib/env.server";
import { sendPush, type StoredSubscription } from "@/lib/notifications/push-server";

/** Sends a test push to the signed-in user's own devices. */
export async function POST() {
  if (!isPushConfigured) return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: subs } = await supabase.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth");
  if (!subs?.length) return NextResponse.json({ error: "No devices subscribed." }, { status: 404 });
  const { sent, expired } = await sendPush(subs as StoredSubscription[], {
    title: "Remira",
    body: "Notifications are working. We'll remind you when it matters. ✅",
    url: "/home",
    tag: "remira-test",
  });
  if (expired.length) await supabase.from("push_subscriptions").delete().in("id", expired);
  return NextResponse.json({ sent });
}
