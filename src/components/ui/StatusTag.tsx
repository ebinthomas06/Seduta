import { cx } from "@/lib/cx";

export type PlanStatus = "ready" | "draft";

/** Solid outline = ready, dashed outline = draft. Text carries the meaning too. */
export function StatusTag({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cx(
        "flex-none rounded-sm border px-2 py-1.5 font-mono text-[11px] leading-none font-medium tracking-[.08em] uppercase",
        status === "ready"
          ? "border-ink text-ink"
          : "border-dashed border-ink2 text-ink2",
      )}
    >
      {status === "ready" ? "Ready" : "Draft"}
    </span>
  );
}
