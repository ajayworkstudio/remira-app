import "server-only";
import webpush from "web-push";
import { isPushConfigured, serverEnv } from "@/lib/env.server";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface StoredSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let configured = false;
function ensureConfigured() {
  if (!isPushConfigured) throw new Error("VAPID keys are not configured");
  if (!configured) {
    webpush.setVapidDetails(serverEnv.vapidSubject, serverEnv.vapidPublicKey, serverEnv.vapidPrivateKey);
    configured = true;
  }
}

/** Sends a payload to many subscriptions; returns ids of subscriptions that are gone (404/410). */
export async function sendPush(subs: StoredSubscription[], payload: PushPayload) {
  ensureConfigured();
  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60, urgency: "high" });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) expired.push(s.id);
        else console.error("[push] send failed", code);
      }
    }),
  );
  return { sent, expired };
}
