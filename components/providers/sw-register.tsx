"use client";

import { useEffect } from "react";

/** Registers the service worker after load (never during SSR). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
    const register = () => {
      navigator.serviceWorker.register(url, { scope: "/", updateViaCache: "none" }).catch(() => {
        /* non-fatal: app works without SW */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
