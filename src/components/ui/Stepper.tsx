const btn =
  "h-11 w-11 rounded-[3px] border border-rule2 bg-surface text-[20px] font-medium text-ink disabled:opacity-40";

interface StepperProps {
  /** Row label, e.g. "Rows". Also names the buttons: "Fewer rows" / "More rows". */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
}: StepperProps) {
  const noun = label.toLowerCase();
  return (
    <div
      role="group"
      aria-label={label}
      className="flex min-h-14 items-center justify-between border-b border-rule"
    >
      <span className="text-[16px]">{label}</span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={`Fewer ${noun}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={btn}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="w-11 text-center font-mono text-[18px] font-medium"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label={`More ${noun}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={btn}
        >
          +
        </button>
      </div>
    </div>
  );
}
