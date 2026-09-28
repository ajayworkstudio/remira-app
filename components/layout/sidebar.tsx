"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-line/70 bg-surface/70 px-3 py-6 backdrop-blur-xl md:flex lg:w-64 lg:px-4">
      <Link href="/home" className="mb-8 flex items-center gap-2.5 px-1.5 lg:px-2" aria-label="Remira home">
        <LogoMark className="size-10" />
        <span className="hidden text-[1.35rem] font-bold tracking-[-0.03em] text-ink lg:inline">Remira</span>
      </Link>

      <Link
        href="/reminders/new"
        className="mb-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand font-semibold text-on-brand shadow-[0_6px_16px_-6px_var(--brand)] transition active:scale-[0.98]"
      >
        <Plus className="size-5" aria-hidden />
        <span className="hidden lg:inline">New reminder</span>
        <span className="sr-only lg:hidden">New reminder</span>
      </Link>

      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={cn(
                    "flex h-12 items-center justify-center gap-3 rounded-2xl px-3 text-body font-semibold transition-colors lg:justify-start",
                    active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} aria-hidden />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-auto hidden px-3 text-caption text-subtle lg:block">Remember What Matters.</p>
    </aside>
  );
}
