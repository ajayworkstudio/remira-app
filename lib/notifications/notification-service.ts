"use client";

/**
 * Client-side NotificationService.
 * Browser APIs are only touched inside functions (never at import time) so this is SSR-safe.
 */
import { UserFacingError } from "@/lib/utils/errors";

export type PermissionState = NotificationPermission | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function isPushSupported(): boolean {
  return isNotificationSupported() && "PushManager" in window;
}

/** iOS only allows Web Push for Home Screen web apps (iOS 16.4+). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function getPermission(): PermissionState {
  return isNotificationSupported() ? Notification.permission : "unsupported";
}

/** Must be called from a user gesture (button tap). */
export async function requestPermission(): Promise<PermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  return await Notification.requestPermission();
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) {
    const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
    await navigator.serviceWorker.register(url, { scope: "/", updateViaCache: "none" });
  }
  return await navigator.serviceWorker.ready;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function fetchPublicKey(): Promise<string> {
  const res = await fetch("/api/push/public-key", { cache: "no-store" });
  if (!res.ok) throw new UserFacingError("Push notifications aren't configured on the server yet.");
  const { publicKey } = (await res.json()) as { publicKey?: string };
  if (!publicKey) throw new UserFacingError("Push notifications aren't configured on the server yet.");
  return publicKey;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? await reg.pushManager.getSubscription() : null;
}

export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) throw new UserFacingError("Couldn't save your notification settings.");
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}

export async function subscribeToPush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new UserFacingError(
      isIOS() && !isStandalone()
        ? "On iPhone, add Remira to your Home Screen first (Share → Add to Home Screen), then enable notifications from the installed app."
        : "This browser doesn't support push notifications.",
    );
  }
  const permission = await requestPermission();
  if (permission !== "granted") throw new UserFacingError("Notifications are blocked. You can allow them in your browser or iOS Settings.");
  const reg = await getRegistration();
  const key = await fetchPublicKey();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  await saveSubscription(sub);
  return sub;
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (!sub) return;
  await removeSubscription(sub.endpoint);
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  const res = await fetch("/api/push/test", { method: "POST" });
  if (!res.ok) throw new UserFacingError("Couldn't send a test notification.");
}

/** Level-1 in-app notification: shows a system notification via the SW while the app is open. */
export async function showLocalNotification(title: string, body: string, url = "/home", tag?: string) {
  if (getPermission() !== "granted") return false;
  try {
    const reg = await getRegistration();
    await reg.showNotification(title, { body, tag, icon: "/icons/icon-192.png", badge: "/icons/badge-72.png", data: { url } });
    return true;
  } catch {
    return false;
  }
}

export const NotificationService = {
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  saveSubscription,
  removeSubscription,
  getPermission,
  getCurrentSubscription,
  showLocalNotification,
  sendTestPush,
};
