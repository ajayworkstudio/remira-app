"use client";

import { useCallback, useEffect, useState } from "react";
import {
  NotificationService,
  getPermission,
  isIOS,
  isPushSupported,
  isStandalone,
  type PermissionState,
} from "@/lib/notifications/notification-service";

interface State {
  ready: boolean;
  permission: PermissionState;
  subscribed: boolean;
  pushSupported: boolean;
  needsInstall: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<State>({ ready: false, permission: "default", subscribed: false, pushSupported: false, needsInstall: false });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const sub = await NotificationService.getCurrentSubscription().catch(() => null);
    setState({
      ready: true,
      permission: getPermission(),
      subscribed: Boolean(sub),
      pushSupported: isPushSupported(),
      needsInstall: isIOS() && !isStandalone(),
    });
  }, []);

  useEffect(() => {
    let alive = true;
    NotificationService.getCurrentSubscription()
      .catch(() => null)
      .then((sub) => {
        if (!alive) return;
        setState({
          ready: true,
          permission: getPermission(),
          subscribed: Boolean(sub),
          pushSupported: isPushSupported(),
          needsInstall: isIOS() && !isStandalone(),
        });
      });
    return () => {
      alive = false;
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      await NotificationService.subscribeToPush();
    } finally {
      setBusy(false);
      await refresh();
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await NotificationService.unsubscribeFromPush();
    } finally {
      setBusy(false);
      await refresh();
    }
  }, [refresh]);

  return { ...state, busy, enable, disable, refresh };
}
