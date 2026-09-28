import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";

/** The VAPID *public* key is safe to share; the private key never leaves the server. */
export async function GET() {
  if (!serverEnv.vapidPublicKey) return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  return NextResponse.json({ publicKey: serverEnv.vapidPublicKey }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
