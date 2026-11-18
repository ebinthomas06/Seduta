"use client";

import Link from "next/link";

/** Last line of defence: an unexpected error on any screen. Saved plans are not affected. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
      <h1 className="text-[24px] font-semibold">Something went wrong</h1>
      <p className="text-[14px] leading-normal text-ink3">
        This screen hit a problem. Your saved plans are stored on this device
        and are not affected.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-12 rounded-md bg-ink px-5 text-[15px] font-medium text-bg"
        >
          Try again
        </button>
        <Link
          href="/"
          className="flex h-12 items-center rounded-md border border-ink px-5 text-[15px] font-medium text-ink no-underline"
        >
          Saved plans
        </Link>
      </div>
    </main>
  );
}
