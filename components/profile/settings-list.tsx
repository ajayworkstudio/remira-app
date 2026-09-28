import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function SettingsGroup({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-6">
      {title ? <h2 className="mb-2 px-1 text-small font-semibold uppercase tracking-[0.06em] text-muted">{title}</h2> : null}
      <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-card">{children}</div>
    </section>
  );
}

export function SettingsRow({ icon, label, detail, href, onClick, trailing, danger }: { icon?: ReactNode; label: string; detail?: ReactNode; href?: string; onClick?: () => void; trailing?: ReactNode; danger?: boolean }) {
  const inner = (
    <>
      {icon ? <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${danger ? "bg-danger-soft text-danger" : "bg-brand-softer text-brand"}`}>{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={`block text-body font-medium ${danger ? "text-danger" : "text-ink"}`}>{label}</span>
        {detail ? <span className="block text-small text-muted">{detail}</span> : null}
      </span>
      {trailing !== undefined ? trailing : (href || onClick ? <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden /> : null)}
    </>
  );
  const cls = "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2/60";
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}
