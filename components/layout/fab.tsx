import Link from "next/link";
import { Plus } from "lucide-react";

/** Floating add button — sits above the bottom nav on phones, never covering it. */
export function Fab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="bottom-nav-offset fixed right-4 z-30 grid size-14 place-items-center rounded-full bg-brand text-on-brand shadow-float transition active:scale-95 md:bottom-8 md:right-8"
    >
      <Plus className="size-7" strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
