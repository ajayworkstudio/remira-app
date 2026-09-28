import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex animate-rise flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-brand-softer text-brand">{icon}</div>
      <h3 className="text-headline font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-xs whitespace-pre-line text-body text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
