"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Download, Plus, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/categories/category-icon";
import { useData } from "@/components/providers/data-provider";
import { useCategories } from "@/hooks/use-categories";
import { useProfile } from "@/hooks/use-profile";
import { useNow } from "@/hooks/use-now";
import { buildAgenda, type AgendaItem } from "@/lib/calendar/agenda";
import { CalendarService } from "@/lib/calendar/calendar-service";
import { WEEKDAY_SHORT, addDays, formatLongDate, formatMonthYear, parseISODate, relativeDayLabel, toISODate, todayISO } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils/cn";

type View = "month" | "week" | "agenda";
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

function startOfWeekMon(iso: string) {
  const dow = parseISODate(iso).getDay();
  return addDays(iso, -((dow + 6) % 7));
}

function monthGrid(year: number, month: number): string[] {
  const first = toISODate(new Date(year, month, 1));
  const start = startOfWeekMon(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function CalendarView() {
  const now = useNow();
  const { data, status, mode } = useData();
  const { preferences } = useProfile();
  const [view, setView] = useState<View>("month");
  const [selected, setSelected] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);

  const today = now ? todayISO(now) : null;
  const sel = selected ?? today;
  const curY = cursor?.y ?? now?.getFullYear() ?? null;
  const curM = cursor?.m ?? now?.getMonth() ?? null;
  const cur = curY !== null && curM !== null ? { y: curY, m: curM } : null;

  const range = useMemo(() => {
    if (!sel || curY === null || curM === null) return null;
    if (view === "month") {
      const grid = monthGrid(curY, curM);
      return { from: grid[0], to: grid[41], grid };
    }
    if (view === "week") {
      const from = startOfWeekMon(sel);
      return { from, to: addDays(from, 6), grid: Array.from({ length: 7 }, (_, i) => addDays(from, i)) };
    }
    return { from: today!, to: addDays(today!, 30), grid: [] };
  }, [view, sel, curY, curM, today]);

  const agenda = useMemo(
    () => (range && data ? buildAgenda(data.reminders, data.calendarEvents, range.from, range.to) : new Map<string, AgendaItem[]>()),
    [range, data],
  );

  const icsOpts = { serverBacked: mode === "supabase", durationMinutes: preferences.ics_event_duration ?? 30, includeAlarm: preferences.ics_include_alarm ?? true };

  if (status === "loading" || !today || !sel || !cur || !range) {
    return (
      <>
        <PageHeader title="Calendar" />
        <Skeleton className="mb-4 h-12" />
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
      </>
    );
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(cur.y, cur.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  const shiftWeek = (delta: number) => setSelected(addDays(sel, delta * 7));
  const goToday = () => {
    setSelected(today);
    setCursor({ y: now!.getFullYear(), m: now!.getMonth() });
  };

  const agendaDays = view === "agenda" ? [...agenda.keys()].sort() : view === "week" ? range.grid : [sel];

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
            <Button
              variant="soft"
              size="icon"
              aria-label="Export all reminders to Apple Calendar (.ics)"
              onClick={() => {
                try {
                  CalendarService.exportAllToICS(data?.reminders ?? [], icsOpts);
                } catch (err) {
                  toast.error(friendlyError(err, "Calendar file could not be generated."));
                }
              }}
            >
              <Download className="size-5" aria-hidden />
            </Button>
          </>
        }
      />

      <Segmented<View>
        label="Calendar view"
        value={view}
        onChange={setView}
        className="mb-4"
        options={[
          { value: "month", label: "Month" },
          { value: "week", label: "Week" },
          { value: "agenda", label: "Agenda" },
        ]}
      />

      {view !== "agenda" ? (
        <section className="mb-6 rounded-[var(--radius-card)] bg-surface p-3 shadow-card sm:p-4" aria-label="Calendar grid">
          <div className="mb-2 flex items-center justify-between px-1">
            <button type="button" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={() => (view === "month" ? shiftMonth(-1) : shiftWeek(-1))} className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <h2 className="text-headline font-bold text-ink" aria-live="polite">
              {view === "month" ? formatMonthYear(cur.y, cur.m) : `${parseISODate(range.from).toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${parseISODate(range.to).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
            </h2>
            <button type="button" aria-label={view === "month" ? "Next month" : "Next week"} onClick={() => (view === "month" ? shiftMonth(1) : shiftWeek(1))} className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center" role="row">
            {MON_FIRST.map((d) => (
              <div key={d} className="pb-1.5 text-caption font-semibold uppercase text-subtle" role="columnheader">
                {WEEKDAY_SHORT[d].slice(0, view === "month" ? 1 : 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1" role="grid">
            {range.grid.map((iso) => {
              const items = agenda.get(iso) ?? [];
              const d = parseISODate(iso);
              const outside = view === "month" && d.getMonth() !== cur.m;
              const isSel = iso === sel;
              const isToday = iso === today;
              const hasRemira = items.some((i) => i.kind === "reminder" && !i.reminder.is_completed);
              const hasDone = items.some((i) => i.kind === "reminder" && i.reminder.is_completed);
              const hasExternal = items.some((i) => i.kind === "external");
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  aria-selected={isSel}
                  aria-label={`${formatLongDate(iso)}${items.length ? `, ${items.length} item${items.length > 1 ? "s" : ""}` : ""}`}
                  onClick={() => {
                    setSelected(iso);
                    if (view === "month" && outside) setCursor({ y: d.getFullYear(), m: d.getMonth() });
                  }}
                  className="flex flex-col items-center gap-1 py-1"
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-full text-body font-semibold tabular-nums transition",
                      isSel ? "bg-brand text-on-brand" : isToday ? "text-brand ring-2 ring-brand/40" : outside ? "text-subtle/60" : "text-ink hover:bg-surface-2",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {hasRemira ? <span className="size-1.5 rounded-full bg-brand" /> : null}
                    {hasDone && !hasRemira ? <span className="size-1.5 rounded-full bg-subtle" /> : null}
                    {hasExternal ? <span className="size-1.5 rounded-full bg-external" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-1 pt-3 text-caption text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand" aria-hidden />Remira reminders</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-external" aria-hidden />Apple Calendar (imported)</span>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-6" aria-live="polite">
        {agendaDays.length === 0 ? (
          <p className="rounded-[var(--radius-card)] bg-surface px-4 py-8 text-center text-body text-muted shadow-card">Nothing in the next 30 days.</p>
        ) : (
          agendaDays.map((iso) => (
            <DaySection key={iso} iso={iso} today={today} items={agenda.get(iso) ?? []} compact={view !== "month"} onAddToCalendar={(r) => {
              try {
                CalendarService.addToAppleCalendar(r, icsOpts);
              } catch (err) {
                toast.error(friendlyError(err, "Calendar file could not be generated."));
              }
            }} />
          ))
        )}
      </div>
    </>
  );
}

function DaySection({ iso, today, items, compact, onAddToCalendar }: { iso: string; today: string; items: AgendaItem[]; compact: boolean; onAddToCalendar: (r: Extract<AgendaItem, { kind: "reminder" }>["reminder"]) => void }) {
  const { byId } = useCategories();
  if (compact && !items.length) return null;
  return (
    <section aria-label={formatLongDate(iso)}>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h2 className="text-headline font-bold text-ink">
          {relativeDayLabel(iso, today)}
          <span className="ml-2 text-small font-medium text-muted">{parseISODate(iso).toLocaleDateString(undefined, { day: "numeric", month: "long" })}</span>
        </h2>
        <Link href={`/reminders/new?date=${iso}`} className="inline-flex min-h-11 items-center gap-1 text-small font-semibold text-brand" aria-label={`Add reminder on ${formatLongDate(iso)}`}>
          <Plus className="size-4" aria-hidden /> Add
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line px-4 py-6 text-center text-small text-muted">No reminders on this day.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) =>
            item.kind === "reminder" ? (
              <li key={item.key} className={cn("relative flex items-center gap-3 rounded-2xl bg-surface p-3 pl-4 shadow-card", item.reminder.is_completed && "opacity-60")}>
                <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-brand" aria-hidden />
                <span className="w-12 shrink-0 text-body font-bold tabular-nums text-ink">{item.time}</span>
                <Link href={`/reminders/${item.reminder.id}`} className="min-w-0 flex-1">
                  <span className={cn("block truncate text-body font-semibold text-ink", item.reminder.is_completed && "line-through")}>{item.reminder.title}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="text-caption font-medium text-brand">Remira</span>
                    <CategoryBadge category={item.reminder.category_id ? byId.get(item.reminder.category_id) : null} />
                    {item.reminder.repeat_type !== "none" ? <Repeat2 className="size-3 text-muted" aria-label="Repeats" /> : null}
                  </span>
                </Link>
                <button type="button" onClick={() => onAddToCalendar(item.reminder)} aria-label={`Add "${item.reminder.title}" to Apple Calendar`} className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-brand">
                  <CalendarPlus className="size-5" aria-hidden />
                </button>
              </li>
            ) : (
              <li key={item.key} className="relative flex items-center gap-3 rounded-2xl bg-external-soft p-3 pl-4">
                <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-external" aria-hidden />
                <span className="w-12 shrink-0 text-body font-bold tabular-nums text-ink">{item.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">{item.event.title ?? "Event"}</span>
                  <span className="text-caption font-medium text-external">{item.event.calendar_name ?? "Apple Calendar"}{item.event.location ? ` · ${item.event.location}` : ""}</span>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
