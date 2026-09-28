import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";

const subscribeBody = z.object({
  subscription: z.object({
    endpoint: z.url().startsWith("https://").max(1024),
    keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
  }),
});
const deleteBody = z.object({ endpoint: z.url().max(1024) });

async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  return { supabase, userId };
}

/** Save this device's push subscription for the signed-in user (user id comes from the session, never the body). */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await authed();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const parsed = subscribeBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  const { endpoint, keys } = parsed.data.subscription;
  const row = { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null };

  if (serverEnv.serviceRoleKey) {
    // A device belongs to one account at a time: drop any stale owner of this endpoint.
    const admin = createAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
    const { error } = await admin.from("push_subscriptions").insert({ ...row, user_id: userId });
    if (error) return NextResponse.json({ error: "Couldn't save subscription." }, { status: 500 });
  } else {
    const { error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
    if (error) return NextResponse.json({ error: "Couldn't save subscription." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, userId } = await authed();
  if (!userId) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const parsed = deleteBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint); // RLS: own rows only
  return NextResponse.json({ ok: true });
}
