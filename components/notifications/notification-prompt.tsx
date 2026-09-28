"use client";

import { BellRing, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocalFlag } from "@/hooks/use-local-flag";
import { friendlyError } from "@/lib/utils/errors";

/** Soft-ask card. Permission is only requested when the user taps the button. */
export function NotificationPrompt() {
  const n = useNotifications();
  const [dismissed, setDismissed] = useLocalFlag("remira-notif-prompt-dismissed");

  if (!n.ready || dismissed || n.subscribed || n.permission === "denied" || n.permission === "unsupported") return null;

  async function enable() {
    try {
      await n.enable();
      toast.success("Notifications enabled");
    } catch (err) {
      toast.error(friendlyError(err, "Couldn't enable notifications."));
    }
  }

  return (
    <section className="relative flex animate-rise items-start gap-4 rounded-[var(--radius-card)] border border-brand/15 bg-brand-softer p-4 pr-12">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-brand shadow-card">
        <BellRing className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-body font-semibold text-ink">Never miss a deadline</h2>
        <p className="mt-0.5 text-small text-muted">
          {n.needsInstall
            ? "On iPhone, add Remira to your Home Screen (Share → Add to Home Screen) to receive reminders."
            : "Remira can remind you about important tasks and deadlines."}
        </p>
        {!n.needsInstall ? (
          <Button size="sm" className="mt-3" onClick={enable} loading={n.busy}>
            Enable Notifications
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-1.5 top-1.5 grid size-11 place-items-center rounded-full text-muted hover:text-ink"
      >
        <X className="size-4" aria-hidden />
      </button>
    </section>
  );
}
