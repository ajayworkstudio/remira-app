"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useData } from "@/components/providers/data-provider";
import { useNow } from "@/hooks/use-now";
import { NotificationService } from "@/lib/notifications/notification-service";
import { combineDateTime, toHHMM } from "@/lib/utils/date";

/**
 * LEVEL 1 notifications: while Remira is open, surface reminders as they come due.
 * This is a convenience layer only — reliable delivery when the app is closed
 * comes from the server-side Web Push dispatcher (/api/notifications/dispatch).
 */
export function InAppNotifier() {
  const now = useNow();
  const router = useRouter();
  const { data } = useData();
  const seen = useRef<Set<string>>(new Set());
  const lastCheck = useRef<number | null>(null);

  useEffect(() => {
    if (!now || !data) return;
    const nowMs = now.getTime();
    // First tick: only look back 1 minute so opening the app doesn't replay old alerts.
    const since = lastCheck.current ?? nowMs - 60_000;
    lastCheck.current = nowMs;

    for (const r of data.reminders) {
      if (r.is_completed || !r.notification_enabled) continue;
      const due = combineDateTime(r.reminder_date, r.reminder_time).getTime() - r.notification_minutes_before * 60_000;
      const key = `${r.id}:${r.reminder_date}:${r.reminder_time}`;
      if (due > since && due <= nowMs && !seen.current.has(key)) {
        seen.current.add(key);
        const body = r.notification_minutes_before > 0 ? `Starts at ${toHHMM(r.reminder_time)}` : "It's time.";
        toast(r.title, {
          description: body,
          duration: 10_000,
          action: { label: "Open", onClick: () => router.push(`/reminders/${r.id}`) },
        });
        if (document.visibilityState === "hidden") {
          void NotificationService.getCurrentSubscription().then((sub) => {
            // If push is active, the server will deliver it — avoid duplicates.
            if (!sub) void NotificationService.showLocalNotification(r.title, body, `/reminders/${r.id}`, r.id);
          });
        }
      }
    }
  }, [now, data, router]);

  return null;
}
