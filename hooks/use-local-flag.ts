"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** A per-device boolean (UI convenience only, e.g. a dismissed tip). Server snapshot = `serverValue`. */
export function useLocalFlag(key: string, serverValue = true): [boolean, (v: boolean) => void] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);
  const value = useSyncExternalStore(subscribe, () => read(key), () => serverValue);
  const set = useCallback(
    (v: boolean) => {
      try {
        if (v) window.localStorage.setItem(key, "1");
        else window.localStorage.removeItem(key);
      } catch {
        /* storage unavailable */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
