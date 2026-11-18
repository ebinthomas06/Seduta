import Link from "next/link";

/** Shown while a plan loads from this device. Fades in late so a quick load never flashes. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="fade-in-late flex min-h-dvh items-center justify-center px-4 text-[14px] text-ink2"
    >
      {label}
    </div>
  );
}

/** A friendly dead end: what happened, and one way out. */
export function NotFoundState({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text?: string;
  href: string;
  label: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
      <h1 className="text-[24px] font-semibold">{title}</h1>
      {text && <p className="text-[14px] leading-snug text-ink2">{text}</p>}
      <Link
        href={href}
        className="flex min-h-11 items-center text-[15px] font-medium"
      >
        {label}
      </Link>
    </main>
  );
}

/** Used by every plan screen when `?plan=` is missing or the plan was deleted. */
export function PlanNotFound() {
  return (
    <NotFoundState
      title="Plan not found"
      text="It may have been deleted from this device, or the link is incomplete."
      href="/"
      label="Back to saved plans"
    />
  );
}
