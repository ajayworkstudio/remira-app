"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { CalendarPlus, ChevronRight, NotebookPen, Plus, Sparkles } from "lucide-react";
import { Greeting } from "@/components/home/greeting";
import { Overview } from "@/components/home/overview";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { NotificationPrompt } from "@/components/notifications/notification-prompt";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/ui/card";
import { useReminders } from "@/hooks/use-reminders";
import { useNow } from "@/hooks/use-now";
import { addDays, todayISO } from "@/lib/utils/date";

export function HomeView() {
  const now = useNow();
  const { reminders, loading } = useReminders();
  const today = now ? todayISO(now) : null;

  const view = useMemo(() => {
    if (!today) return null;
    const todays = reminders.filter((r) => r.reminder_date === today);
    const overdue = reminders.filter((r) => !r.is_completed && r.reminder_date < today);
    const weekEnd = addDays(today, 7);
    const upcoming = reminders.filter((r) => !r.is_completed && r.reminder_date > today);
    return {
      todays,
      overdue,
      done: todays.filter((r) => r.is_completed).length,
      upcoming: upcoming.slice(0, 5),
      upcomingWeek: upcoming.filter((r) => r.reminder_date <= weekEnd).length,
    };
  }, [reminders, today]);

  const busy = loading || !view;

  return (
    <div className="flex flex-col gap-7">
      <Greeting />

      <Overview
        loading={busy}
        total={view?.todays.length ?? 0}
        done={view?.done ?? 0}
        pending={(view?.todays.length ?? 0) - (view?.done ?? 0)}
        upcoming={view?.upcomingWeek ?? 0}
      />

      <NotificationPrompt />

      <div className="grid gap-7 xl:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="schedule-title">
          <SectionTitle
            action={
              <Link href="/reminders" className="inline-flex min-h-11 items-center gap-0.5 text-small font-semibold text-brand">
                See all <ChevronRight className="size-4" aria-hidden />
              </Link>
            }
          >
            <span id="schedule-title">Today&apos;s Schedule</span>
          </SectionTitle>
          {busy ? (
            <ListSkeleton rows={3} />
          ) : view.todays.length === 0 && view.overdue.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-7" aria-hidden />}
              title="No reminders today"
              description={"Your schedule is clear.\nAdd a reminder to stay organized."}
              action={
                <Link href="/reminders/new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-semibold text-on-brand">
                  <Plus className="size-4" aria-hidden /> Add Reminder
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {view.overdue.length ? (
                <p className="text-small font-semibold text-warning">
                  {view.overdue.length} overdue from earlier — <Link href="/reminders" className="underline underline-offset-2">review</Link>
                </p>
              ) : null}
              {view.todays.map((r) => (
                <ReminderCard key={r.id} reminder={r} today={today} now={now} />
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-7">
          <section aria-labelledby="upcoming-title">
            <SectionTitle>
              <span id="upcoming-title">Upcoming</span>
            </SectionTitle>
            {busy ? (
              <ListSkeleton rows={2} />
            ) : view.upcoming.length === 0 ? (
              <p className="rounded-[var(--radius-card)] bg-surface px-4 py-5 text-center text-body text-muted shadow-card">Nothing scheduled ahead yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {view.upcoming.map((r) => (
                  <ReminderCard key={r.id} reminder={r} showDate today={today} now={now} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="quick-title">
            <SectionTitle>
              <span id="quick-title">Quick actions</span>
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction href="/reminders/new" icon={<CalendarPlus className="size-5" aria-hidden />} label="Reminder" />
              <QuickAction href="/notes/new" icon={<NotebookPen className="size-5" aria-hidden />} label="Note" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface p-4 font-semibold text-ink shadow-card transition active:scale-[0.98] hover:-translate-y-px"
    >
      <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</span>
      <span>
        <span className="text-muted">+ </span>
        {label}
      </span>
    </Link>
  );
}
