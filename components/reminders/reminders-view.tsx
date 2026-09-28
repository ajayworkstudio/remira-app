"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { CalendarCheck2, Plus, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { CategoryGlyph } from "@/components/categories/category-icon";
import { Chip, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useReminders } from "@/hooks/use-reminders";
import { useCategories } from "@/hooks/use-categories";
import { useNow } from "@/hooks/use-now";
import { groupReminders, matchesReminderQuery } from "@/lib/reminders/selectors";
import { categoryStyle } from "@/lib/categories";
import { todayISO } from "@/lib/utils/date";
import type { Reminder } from "@/types/reminder";

type Filter = "all" | "pending" | "completed" | "high";
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "high", label: "High Priority" },
];

function Group({ title, items, today, now, showDate, tone }: { title: string; items: Reminder[]; today: string; now: Date; showDate?: boolean; tone?: "warning" }) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className={tone === "warning" ? "text-headline font-bold text-warning" : "text-headline font-bold text-ink"}>
        {title} <span className="ml-1 text-small font-semibold text-subtle">{items.length}</span>
      </h2>
      {items.map((r) => (
        <ReminderCard key={r.id} reminder={r} today={today} now={now} showDate={showDate} />
      ))}
    </section>
  );
}

export function RemindersView() {
  const now = useNow();
  const { reminders, loading } = useReminders();
  const { categories } = useCategories();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const filtered = useMemo(
    () =>
      reminders.filter((r) => {
        if (filter === "pending" && r.is_completed) return false;
        if (filter === "completed" && !r.is_completed) return false;
        if (filter === "high" && r.priority !== "high") return false;
        if (category && r.category_id !== category) return false;
        return matchesReminderQuery(r, deferredQuery);
      }),
    [reminders, filter, category, deferredQuery],
  );

  const today = now ? todayISO(now) : null;
  const groups = useMemo(() => (today ? groupReminders(filtered, today) : null), [filtered, today]);
  const pendingCount = reminders.filter((r) => !r.is_completed).length;
  const isFiltering = Boolean(deferredQuery || category || filter !== "all");

  return (
    <>
      <PageHeader title="Reminders" subtitle={loading ? " " : `${pendingCount} pending`} />

      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-col gap-3 bg-bg/85 px-4 pb-3 pt-2 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <SearchInput value={query} onChange={setQuery} placeholder="Search reminders" label="Search reminders" />
        <ChipRow label="Status filter">
          {FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </Chip>
          ))}
        </ChipRow>
        {categories.length ? (
          <ChipRow label="Category filter">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              All categories
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
                tintStyle={categoryStyle(c.color)}
                icon={<CategoryGlyph name={c.icon} className="size-3.5 text-[var(--cat)]" />}
              >
                {c.name}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>

      {loading || !groups || !now || !today ? (
        <ListSkeleton rows={5} />
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck2 className="size-7" aria-hidden />}
          title="No reminders yet"
          description={"Your schedule is clear.\nAdd a reminder to stay organized."}
          action={
            <Link href="/reminders/new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-semibold text-on-brand">
              <Plus className="size-4" aria-hidden /> Add Reminder
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-7" aria-hidden />}
          title="No matches"
          description={isFiltering ? "Try a different search or clear your filters." : "Nothing here."}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setCategory(null);
              }}
              className="inline-flex h-11 items-center rounded-2xl bg-surface-2 px-5 font-semibold text-ink"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-7" aria-live="polite">
          <Group title="Overdue" items={groups.overdue} today={today} now={now} showDate tone="warning" />
          <Group title="Today" items={groups.today} today={today} now={now} />
          <Group title="Tomorrow" items={groups.tomorrow} today={today} now={now} />
          <Group title="Upcoming" items={groups.upcoming} today={today} now={now} showDate />
          <Group title="Completed" items={groups.completed} today={today} now={now} showDate />
        </div>
      )}

      <Fab href="/reminders/new" label="New reminder" />
    </>
  );
}
