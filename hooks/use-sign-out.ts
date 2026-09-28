"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useData } from "@/components/providers/data-provider";
import { NotificationService } from "@/lib/notifications/notification-service";

export function useSignOut() {
  const router = useRouter();
  const { signOut } = useData();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async () => {
    setBusy(true);
    try {
      // Stop this device receiving another account's pushes
      await NotificationService.unsubscribeFromPush().catch(() => undefined);
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setBusy(false);
    }
  }, [router, signOut]);
  return { signOut: run, busy };
}
