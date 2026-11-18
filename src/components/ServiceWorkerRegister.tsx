"use client";

import { useEffect } from "react";

/** Registers the offline service worker. Only in production, so development never serves stale files. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is an extra; the app works without it.
    });
  }, []);
  return null;
}
