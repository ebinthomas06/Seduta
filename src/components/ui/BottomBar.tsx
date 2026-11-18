import { cx } from "@/lib/cx";

/** Sticky action area at the foot of a screen: hairline above, buttons inside. */
export function BottomBar({
  children,
  row = false,
  className,
}: {
  children: React.ReactNode;
  /** Lay children out side by side instead of stacked. */
  row?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-none border-t border-rule px-4 pt-3 pb-5",
        row ? "gap-3" : "flex-col gap-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
