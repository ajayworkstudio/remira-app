import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({ title, subtitle, actions, backHref, backLabel = "Back" }: PageHeaderProps) {
  return (
    <header className="mb-5 animate-fade">
      {backHref ? (
        <Link href={backHref} className="-ml-2.5 mb-2 inline-flex min-h-11 items-center gap-0.5 pr-3 text-body font-medium text-brand">
          <ChevronLeft className="size-5" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-large font-bold text-ink md:text-display">{title}</h1>
          {subtitle ? <p className="mt-1 text-body text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </div>
    </header>
  );
}
