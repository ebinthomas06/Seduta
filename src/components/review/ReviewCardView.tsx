import Link from "next/link";
import { cx } from "@/lib/cx";
import type { ReviewCard } from "@/lib/review";

/** One pre-check message: warning (red), blocking (thick red) or ok (neutral). */
export function ReviewCardView({
  card,
  href,
  compact = false,
}: {
  card: ReviewCard;
  href?: string;
  /** Smaller type and padding for the desktop summary panel. */
  compact?: boolean;
}) {
  const alert = card.kind !== "ok";
  return (
    <div
      className={cx(
        "flex gap-3 rounded-[3px] border",
        compact ? "p-3" : "p-3.5",
        alert ? "border-alert bg-surface" : "border-rule",
        card.kind === "blocking" && "border-2",
      )}
    >
      <div
        aria-hidden="true"
        className={cx(
          "flex flex-none items-center justify-center rounded-full border-[1.5px] font-semibold",
          compact ? "h-[22px] w-[22px] text-[13px]" : "h-6 w-6 text-[14px]",
          alert ? "border-alert text-alert" : "border-ink text-ink",
        )}
      >
        {alert ? (
          "!"
        ) : (
          <svg
            width={compact ? 12 : 14}
            height={compact ? 12 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        )}
      </div>
      <div
        className={cx("flex min-w-0 flex-col", compact ? "gap-1" : "gap-1.5")}
      >
        <h4
          className={cx(
            "leading-tight font-medium",
            compact ? "text-[14px]" : "text-[15px]",
          )}
        >
          {card.title}
        </h4>
        <p
          className={cx(
            "leading-normal text-ink3",
            compact ? "text-[13px]" : "text-[14px]",
          )}
        >
          {card.body}
        </p>
        {card.action && href && (
          <Link
            href={href}
            className="flex min-h-11 items-center self-start text-[14px] font-medium"
          >
            {card.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
