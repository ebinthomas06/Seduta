import { cx } from "@/lib/cx";

interface StepIndicatorProps {
  /** 1-based current step. */
  step: number;
  total?: number;
  name: string;
}

export function StepIndicator({ step, total = 4, name }: StepIndicatorProps) {
  return (
    <div className="flex flex-none flex-col gap-2 px-4 pt-4">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cx("h-[3px] flex-1", i < step ? "bg-ink" : "bg-rule")}
          />
        ))}
      </div>
      <p className="font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
        Step {step} of {total} · {name}
      </p>
    </div>
  );
}
