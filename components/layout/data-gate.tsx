"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CloudOff } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";

/** Shows a friendly, recoverable error when the initial load fails. */
export function DataGate({ children }: { children: ReactNode }) {
  const { status, error, reload } = useData();
  if (status === "error") {
    const expired = /session/i.test(error ?? "");
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-surface-2 text-muted">
          <CloudOff className="size-8" aria-hidden />
        </div>
        <h1 className="mt-5 text-title font-bold">{expired ? "Please sign in again" : "We couldn't load Remira"}</h1>
        <p className="mt-2 max-w-xs text-body text-muted">{error}</p>
        <div className="mt-6">
          {expired ? (
            <Link href="/login" className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 font-semibold text-on-brand">
              Sign in
            </Link>
          ) : (
            <Button onClick={() => void reload()}>Try again</Button>
          )}
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
