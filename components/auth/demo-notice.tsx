import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function DemoNotice() {
  return (
    <div className="mb-6 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-small text-ink">
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="font-semibold">Supabase isn&apos;t configured yet</p>
          <p className="mt-1 text-muted">
            Add your keys to <code className="rounded bg-surface px-1">.env.local</code> to enable accounts. Meanwhile you can
            explore Remira with sample data stored only on this device.
          </p>
          <Link href="/home" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand">
            Continue in demo mode →
          </Link>
        </div>
      </div>
    </div>
  );
}
