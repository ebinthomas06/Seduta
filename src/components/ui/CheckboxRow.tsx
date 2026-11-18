import { cx } from "@/lib/cx";

interface CheckboxRowProps {
  label: string;
  /** Small grey text after the label, e.g. "always on". */
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export function CheckboxRow({
  label,
  note,
  checked,
  disabled,
  onChange,
}: CheckboxRowProps) {
  return (
    <label
      className={cx(
        "flex min-h-14 items-center justify-between gap-3 border-b border-rule text-[16px]",
        !disabled && "cursor-pointer",
      )}
    >
      <span>
        {label}
        {note && <span className="text-[14px] text-ink2"> · {note}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="m-0 h-6 w-6 flex-none accent-accent"
      />
    </label>
  );
}
