"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, Copy, RotateCcw, SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { ConfirmSheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useReminder, useReminders } from "@/hooks/use-reminders";
import { useProfile } from "@/hooks/use-profile";
import { useData } from "@/components/providers/data-provider";
import { useNow } from "@/hooks/use-now";
import { CalendarService } from "@/lib/calendar/calendar-service";
import { formatShortDate, todayISO } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

function ActionButton({ icon, label, onClick, tone = "default", disabled }: { icon: ReactNode; label: string; onClick: () => void; tone?: "default" | "danger" | "brand"; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface px-2 text-caption font-semibold shadow-card transition active:scale-[0.97] disabled:opacity-50",
        tone === "danger" ? "text-danger" : tone === "brand" ? "text-brand" : "text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function ReminderDetailView({ id }: { id: string }) {
  const router = useRouter();
  const now = useNow();
  const { mode } = useData();
  const { reminder, loading } = useReminder(id);
  const { update, remove, toggle, duplicate } = useReminders();
  const { preferences } = useProfile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading || !now) {
    return (
      <>
        <PageHeader title="Reminder" backHref="/reminders" backLabel="Reminders" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-36" />
          <Skeleton className="h-44" />
        </div>
      </>
    );
  }

  if (!reminder) {
    return (
      <>
        <PageHeader title="Reminder" backHref="/reminders" backLabel="Reminders" />
        <EmptyState
          icon={<SearchX className="size-7" aria-hidden />}
          title="Reminder not found"
          description="It may have been deleted on another device."
          action={
            <Link href="/reminders" className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 font-semibold text-on-brand">
              Back to reminders
            </Link>
          }
        />
      </>
    );
  }

  const r = reminder;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Edit Reminder"
        backHref="/reminders"
        backLabel="Reminders"
        subtitle={r.is_completed ? "Completed" : undefined}
      />

      <div className="mb-5 grid grid-cols-4 gap-2.5">
        <ActionButton
          tone="brand"
          disabled={busy}
          icon={r.is_completed ? <RotateCcw className="size-5" aria-hidden /> : <CheckCircle2 className="size-5" aria-hidden />}
          label={r.is_completed ? "Reopen" : "Complete"}
          onClick={() =>
            run(async () => {
              try {
                const { advancedTo } = await toggle(r.id);
                toast.success(advancedTo ? `Done — next on ${formatShortDate(advancedTo)}` : r.is_completed ? "Reminder reopened" : "Reminder completed");
              } catch (err) {
                toast.error(friendlyError(err, "Unable to update reminder."));
              }
            })
          }
        />
        <ActionButton
          disabled={busy}
          icon={<Copy className="size-5" aria-hidden />}
          label="Duplicate"
          onClick={() =>
            run(async () => {
              try {
                const copy = await duplicate(r.id);
                toast.success("Reminder duplicated");
                router.push(`/reminders/${copy.id}`);
              } catch (err) {
                toast.error(friendlyError(err, "Unable to duplicate reminder."));
              }
            })
          }
        />
        <ActionButton
          icon={<CalendarPlus className="size-5" aria-hidden />}
          label="Calendar"
          onClick={() => {
            try {
              CalendarService.addToAppleCalendar(r, {
                serverBacked: mode === "supabase",
                durationMinutes: preferences.ics_event_duration ?? 30,
                includeAlarm: preferences.ics_include_alarm ?? true,
              });
            } catch (err) {
              toast.error(friendlyError(err, "Calendar file could not be generated."));
            }
          }}
        />
        <ActionButton tone="danger" icon={<Trash2 className="size-5" aria-hidden />} label="Delete" onClick={() => setConfirmDelete(true)} />
      </div>

      <ReminderForm
        key={`${r.id}:${r.updated_at}`}
        today={todayISO(now)}
        submitLabel="Save Changes"
        initial={{
          title: r.title,
          description: r.description ?? "",
          reminder_date: r.reminder_date,
          reminder_time: r.reminder_time.slice(0, 5),
          category_id: r.category_id,
          priority: r.priority,
          repeat_type: r.repeat_type,
          repeat_config: r.repeat_config ?? {},
          notification_enabled: r.notification_enabled,
          notification_minutes_before: r.notification_minutes_before,
        }}
        onSubmit={async (input) => {
          try {
            await update(r.id, input);
            toast.success("Reminder updated");
            router.push("/reminders");
          } catch (err) {
            toast.error(friendlyError(err, "Unable to update reminder."));
            throw err;
          }
        }}
      />

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete reminder?"
        description={`"${r.title}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await remove(r.id);
            toast.success("Reminder deleted");
            router.replace("/reminders");
          } catch (err) {
            toast.error(friendlyError(err, "Unable to delete reminder."));
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
