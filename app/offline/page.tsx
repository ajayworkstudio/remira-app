import { WifiOff } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-14" />
      <div className="mt-8 grid size-14 place-items-center rounded-3xl bg-surface-2 text-muted">
        <WifiOff className="size-7" aria-hidden />
      </div>
      <h1 className="mt-5 text-large font-bold">You are offline</h1>
      <p className="mt-2 text-body text-muted">Remira needs a connection to load your reminders and notes. Your data is safe — reconnect and try again.</p>
      <a href="/home" className="mt-8 inline-flex h-12 items-center rounded-2xl bg-brand px-6 font-semibold text-on-brand">
        Try again
      </a>
    </main>
  );
}
