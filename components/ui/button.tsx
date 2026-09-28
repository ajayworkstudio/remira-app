import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "md" | "lg" | "sm" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong shadow-[0_6px_16px_-6px_var(--brand)]",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  soft: "bg-brand-soft text-brand hover:brightness-95 dark:hover:brightness-110",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:brightness-95 dark:hover:brightness-110",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-small rounded-xl gap-1.5",
  md: "h-11 px-4.5 text-body rounded-2xl gap-2",
  lg: "h-13 px-6 text-headline rounded-2xl gap-2 w-full",
  icon: "size-11 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-semibold transition-all duration-150",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
