import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/** Remira mark: a leaf whose midrib is a check — "remember what matters, and grow". */
export function LogoMark({ className, title = "Remira" }: { className?: string; title?: string }) {
  const gid = `remira-g-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 512 512" className={cn("size-9", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F766E" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${gid})`} />
      <path
        d="M136 380 C136 232 236 136 384 136 C384 284 288 380 136 380 Z"
        fill="#fff"
        fillOpacity="0.16"
        stroke="#fff"
        strokeWidth="26"
        strokeLinejoin="round"
      />
      <path d="M196 276 L246 322 L330 212" fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-9" />
      <span className="text-[1.35rem] font-bold tracking-[-0.03em] text-ink">Remira</span>
    </span>
  );
}
