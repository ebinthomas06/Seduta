import Link from "next/link";
import { BackIcon } from "./Icons";

interface TopBarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  /** Right-hand action, e.g. an Export button. */
  action?: React.ReactNode;
}

export function TopBar({ title, backHref, backLabel, action }: TopBarProps) {
  return (
    <header className="flex h-14 flex-none items-center gap-1 border-b border-rule pr-3 pl-1.5">
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel ?? "Back"}
          className="flex h-11 w-11 flex-none items-center justify-center text-ink"
        >
          <BackIcon />
        </Link>
      ) : (
        <span className="w-2.5" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-[17px] leading-tight font-semibold">
        {title}
      </h1>
      {action}
    </header>
  );
}
