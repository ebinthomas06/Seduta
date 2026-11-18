import { useId } from "react";
import { cx } from "@/lib/cx";

export const monoLabelClass =
  "font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase";

interface TextFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  label: string;
  hint?: string;
  error?: string;
  /** Use IBM Plex Mono for the value (roll numbers, prefixes). */
  mono?: boolean;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  mono = false,
  className,
  id,
  ...input
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={fieldId} className={monoLabelClass}>
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "h-12 w-full rounded-[3px] bg-surface px-3 text-[16px] text-ink",
          mono ? "font-mono" : "font-sans",
          error ? "border-2 border-alert" : "border border-rule2",
        )}
        {...input}
      />
      {hint && !error && (
        <p id={hintId} className="text-[13px] leading-snug text-ink2">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-[13px] leading-snug font-medium text-alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
