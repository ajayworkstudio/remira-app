"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useReminders } from "@/hooks/use-reminders";
import { useProfile } from "@/hooks/use-profile";
import { useNow } from "@/hooks/use-now";
import { addDays, todayISO } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";

function nextHour(now: Date) {
  const h = now.getHours() + 1;
  return h >= 24 ? { time: "09:00", tomorrow: true } : { time: `${String(h).padStart(2, "0")}:00`, tomorrow: false };
}

export function NewReminderView({ date }: { date?: string }) {
  const router = useRouter();
  const now = useNow();
  const { create, loading } = useReminders();
  const { preferences, loading: profileLoading } = useProfile();

  if (!now || loading || profileLoading) {
    return (
      <>
        <PageHeader title="New Reminder" backHref="/reminders" backLabel="Reminders" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-32" />
          <Skeleton className="h-44" />
        </div>
      </>
    );
  }

  const today = todayISO(now);
  const nh = nextHour(now);

  return (
    <>
      <PageHeader title="New Reminder" backHref="/reminders" backLabel="Reminders" />
      <ReminderForm
        today={today}
        submitLabel="Save Reminder"
        initial={{
          title: "",
          description: "",
          reminder_date: date ?? (nh.tomorrow ? addDays(today, 1) : today),
          reminder_time: nh.time,
          category_id: null,
          priority: "medium",
          repeat_type: "none",
          repeat_config: {},
          notification_enabled: true,
          notification_minutes_before: preferences.default_notification_minutes ?? 15,
        }}
        onSubmit={async (input) => {
          try {
            await create(input);
            toast.success("Reminder created");
            router.push("/reminders");
          } catch (err) {
            toast.error(friendlyError(err, "Unable to save reminder."));
            throw err;
          }
        }}
      />
    </>
  );
}
