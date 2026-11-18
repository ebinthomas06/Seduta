import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

/** Desktop header: app name and a breadcrumb back to the saved plans. */
export function WorkspaceHeader({ planName }: { planName: string }) {
  return (
    <header className="flex h-14 flex-none items-center gap-6 border-b border-rule px-8">
      <span className="font-mono text-[15px] font-semibold tracking-[.04em]">
        {APP_NAME}
      </span>
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-2 text-[14px] text-ink2"
      >
        <Link href="/" className="flex min-h-11 items-center">
          Seating plans
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-ink">{planName}</span>
      </nav>
    </header>
  );
}
