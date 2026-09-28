"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};
/** true only after hydration — for UI that depends on client-only state (e.g. theme). */
export function useMounted(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
