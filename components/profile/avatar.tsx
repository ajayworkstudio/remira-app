/* eslint-disable @next/next/no-img-element -- user avatars come from Supabase Storage/data URLs */
import { cn } from "@/lib/utils/cn";

const sizes = { sm: "size-9 text-small", md: "size-11 text-body", lg: "size-24 text-large" } as const;

export function Avatar({ name, url, size = "md", className }: { name: string | null | undefined; url?: string | null; size?: keyof typeof sizes; className?: string }) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "R";
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-hero font-bold text-white ring-2 ring-surface", sizes[size], className)}>
      {url ? <img src={url} alt="" className="absolute inset-0 size-full object-cover" /> : <span aria-hidden>{initials}</span>}
      <span className="sr-only">{name ?? "Profile"}</span>
    </span>
  );
}
