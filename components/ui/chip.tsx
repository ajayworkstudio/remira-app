import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
  tintStyle?: CSSProperties;
}

export function Chip({ active, icon, className, children, tintStyle, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      style={tintStyle}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-small font-medium transition-all",
        active
          ? "border-transparent bg-ink text-bg"
          : "border-line bg-surface text-muted hover:text-ink",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function ChipRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 md:mx-0 md:flex-wrap md:px-0">
      {children}
    </div>
  );
}
