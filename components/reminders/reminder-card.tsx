"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Repeat2, BellOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { CategoryBadge } from "@/components/categories/category-icon";
import { PriorityTag } from "@/components/reminders/priority";
import { useReminders } from "@/hooks/use-reminders";
import { useCategories } from "@/hooks/use-categories";
import { combineDateTime, formatShortDate, relativeDayLabel, toHHMM } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import type { Reminder } from "@/types/reminder";

interface ReminderCardProps {
  reminder: Reminder;
  /** Show the date under the time (for Upcoming lists) */
  showDate?: boolean;
  today: string | null;
  now: Date | null;
}

export function ReminderCard({ reminder: r, showDate, today, now }: ReminderCardProps) {
  const { toggle } = useReminders();
  const { byId } = useCategories();
  const [busy, setBusy] = useState(false);
  const category = r.category_id ? byId.get(r.category_id) : null;
  const overdue = !r.is_completed && now !== null && combineDateTime(r.reminder_date, r.reminder_time) < now;

  async function onToggle() {
    setBusy(true);
    try {
      const { advancedTo } = await toggle(r.id);
      if (advancedTo) toast.success("Done — see you next time", { description: `Next: ${formatShortDate(advancedTo)}` });
    } catch (err) {
      toast.error(friendlyError(err, "Unable to update reminder."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex animate-rise items-center gap-3.5 rounded-[var(--radius-card)] bg-surface p-4 shadow-card transition-all",
        "hover:-translate-y-px hover:shadow-[0_2px_4px_rgb(0_0_0/0.04),0_14px_30px_-14px_rgb(18_48_45/0.25)]",
        r.is_completed && "opacity-60",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-start">
        <span className={cn("text-headline font-bold tabular-nums", overdue ? "text-warning" : "text-ink")}>{toHHMM(r.reminder_time)}</span>
        {showDate && today ? <span className="mt-0.5 text-caption font-medium text-muted">{relativeDayLabel(r.reminder_date, today)}</span> : null}
      </div>

      <div className="h-10 w-px shrink-0 bg-line" aria-hidden />

      <div className="min-w-0 flex-1">
        <Link href={`/reminders/${r.id}`} className="block after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
          <h3 className={cn("truncate text-body font-semibold text-ink", r.is_completed && "line-through decoration-muted/60")}>{r.title}</h3>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <CategoryBadge category={category} />
          <PriorityTag priority={r.priority} compact />
          {r.repeat_type !== "none" ? (
            <span className="inline-flex items-center gap-1 text-caption text-muted">
              <Repeat2 className="size-3" aria-hidden />
              <span className="sr-only">Repeats</span>
            </span>
          ) : null}
          {!r.notification_enabled ? <BellOff className="size-3 text-subtle" aria-label="Notification off" /> : null}
          {overdue ? <span className="text-caption font-semibold text-warning">Overdue</span> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-pressed={r.is_completed}
        aria-label={r.is_completed ? `Mark "${r.title}" as not done` : `Mark "${r.title}" as done`}
        className="relative z-10 -mr-1.5 grid size-11 shrink-0 place-items-center rounded-full"
      >
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full border-2 transition-all duration-200",
            r.is_completed ? "animate-pop border-brand bg-brand text-on-brand" : "border-line text-transparent group-hover:border-brand/50",
          )}
        >
          <Check className="size-4" strokeWidth={3} aria-hidden />
        </span>
      </button>
    </div>
  );
}
