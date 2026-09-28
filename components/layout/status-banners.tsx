"use client";

import { FlaskConical, WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/use-online";
import { useData } from "@/components/providers/data-provider";

export function StatusBanners() {
  const online = useOnline();
  const { mode } = useData();
  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {!online ? (
        <div role="status" className="flex items-center gap-2.5 rounded-2xl bg-warning-soft px-4 py-3 text-small font-medium text-ink">
          <WifiOff className="size-4 shrink-0 text-warning" aria-hidden />
          You are offline. Changes will sync when you&apos;re back online.
        </div>
      ) : null}
      {mode === "demo" ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-external-soft px-4 py-2.5 text-small text-ink">
          <FlaskConical className="size-4 shrink-0 text-external" aria-hidden />
          <span>
            <span className="font-semibold">Demo mode</span> — sample data stored only on this device.
          </span>
        </div>
      ) : null}
    </div>
  );
}
