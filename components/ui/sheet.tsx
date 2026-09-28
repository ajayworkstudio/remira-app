"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Responsive modal built on native <dialog> (focus trap, Esc, top-layer for free).
 * Phones: slides up as a bottom sheet. ≥md: centered dialog.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop tap
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[var(--radius-sheet)] bg-surface p-0 text-ink shadow-2xl",
        "backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-sheet",
        "md:m-auto md:max-w-lg md:rounded-[var(--radius-sheet)] md:open:animate-rise",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
          <header className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
            <div>
              <h2 id="sheet-title" className="text-title font-bold">
                {title}
              </h2>
              {description ? <p className="mt-1 text-body text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 pb-4">{children}</div>
          {footer ? <footer className="border-t border-line px-5 pb-[max(1rem,var(--safe-bottom))] pt-3">{footer}</footer> : null}
          {!footer ? <div className="pb-[var(--safe-bottom)]" /> : null}
        </div>
      ) : null}
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
}

export function ConfirmSheet({ open, onClose, onConfirm, title, description, confirmLabel, loading }: ConfirmProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col gap-2 pb-2 pt-3 md:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="h-12 flex-1 rounded-2xl bg-danger font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Working…" : confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="h-12 flex-1 rounded-2xl bg-surface-2 font-semibold text-ink">
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
