"use client";

import { CalendarClock, CheckCircle2, CircleDashed, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewProps {
  total: number;
  done: number;
  pending: number;
  upcoming: number;
  loading: boolean;
}

function ProgressRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 76 76" className="size-20 -rotate-90" aria-hidden>
      <circle cx="38" cy="38" r={r} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="8" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-4 shadow-card">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-softer text-brand">{icon}</span>
      <div>
        <p className="text-large font-bold tabular-nums text-ink">{value}</p>
        <p className="text-small font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

export function Overview({ total, done, pending, upcoming, loading }: OverviewProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-36 rounded-[var(--radius-card)]" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }
  const pct = total ? done / total : 0;
  return (
    <section aria-labelledby="overview-title" className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-hero p-5 text-white shadow-float">
        <div aria-hidden className="absolute -right-10 -top-16 size-48 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-20 right-24 size-40 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h2 id="overview-title" className="text-small font-semibold uppercase tracking-[0.08em] text-white/80">
              Today&apos;s Overview
            </h2>
            <p className="mt-2 text-large font-bold">
              {total === 0 ? "A clear day" : pending === 0 ? "All done! 🎉" : `${done} of ${total} done`}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-small text-white/85">
              <CalendarClock className="size-4" aria-hidden />
              {upcoming} upcoming this week
            </p>
          </div>
          <div className="relative grid place-items-center">
            <ProgressRing value={pct} />
            <span className="absolute text-body font-bold tabular-nums">{Math.round(pct * 100)}%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<ListTodo className="size-5" aria-hidden />} value={total} label="Tasks" />
        <Stat icon={<CheckCircle2 className="size-5" aria-hidden />} value={done} label="Done" />
        <Stat icon={<CircleDashed className="size-5" aria-hidden />} value={pending} label="Pending" />
      </div>
    </section>
  );
}
