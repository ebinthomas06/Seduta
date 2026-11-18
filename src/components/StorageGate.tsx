"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/db/db";

/**
 * Seduta keeps everything in this browser's storage. If the browser refuses (a private window
 * in some browsers, or site data blocked), say so plainly instead of loading forever.
 */
export function StorageGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .open()
      .catch(() => {
        if (!cancelled) setBlocked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!blocked) return <>{children}</>;
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
      <h1 className="text-[24px] font-semibold">
        Can&apos;t save on this device
      </h1>
      <p className="text-[14px] leading-normal text-ink3">
        Seduta stores your plans in this browser, and the browser is not
        allowing it. This usually happens in a private or incognito window, or
        when site data is blocked in the browser settings.
      </p>
      <p className="text-[14px] leading-normal text-ink3">
        Open Seduta in a normal window, or allow site data for this page, then
        reload.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 h-12 rounded-md bg-ink px-5 text-[15px] font-medium text-bg"
      >
        Reload
      </button>
    </main>
  );
}
