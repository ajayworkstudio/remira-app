import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* soft brand aura */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-brand-2/20 blur-3xl" />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(2rem,var(--safe-bottom))] pt-[max(3rem,calc(var(--safe-top)+2rem))]">
        <div className="mb-10 animate-rise">
          <Wordmark />
        </div>
        {children}
      </main>
    </div>
  );
}
