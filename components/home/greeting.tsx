"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { useProfile } from "@/hooks/use-profile";
import { greetingFor, formatLongDate, todayISO } from "@/lib/utils/date";
import { Avatar } from "@/components/profile/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function Greeting() {
  const now = useNow();
  const { firstName, profile, loading } = useProfile();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {now ? (
          <p className="text-small font-semibold uppercase tracking-[0.08em] text-brand">{formatLongDate(todayISO(now))}</p>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
        <h1 className="mt-1.5 text-large font-bold text-ink md:text-display">
          {now && !loading ? (
            <>
              {greetingFor(now.getHours())}, <span className="whitespace-nowrap">{firstName} 👋</span>
            </>
          ) : (
            <Skeleton className="h-9 w-64" />
          )}
        </h1>
        <p className="mt-1 text-body text-muted">Let&apos;s make today productive.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-1">
        <Link
          href="/settings#notifications"
          aria-label="Notification settings"
          className="grid size-11 place-items-center rounded-full bg-surface text-ink shadow-card transition active:scale-95"
        >
          <Bell className="size-5" aria-hidden />
        </Link>
        <Link href="/profile" aria-label="Profile" className="rounded-full transition active:scale-95">
          <Avatar name={profile?.full_name ?? firstName} url={profile?.avatar_url} size="md" />
        </Link>
      </div>
    </header>
  );
}
