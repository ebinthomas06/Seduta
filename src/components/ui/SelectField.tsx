import { useId } from "react";
import { cx } from "@/lib/cx";
import { monoLabelClass } from "./TextField";

interface SelectFieldProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> {
  label: string;
  options: string[];
  className?: string;
}

export function SelectField({
  label,
  options,
  className,
  id,
  ...select
}: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={fieldId} className={monoLabelClass}>
        {label}
      </label>
      <select
        id={fieldId}
        className="h-12 w-full rounded-[3px] border border-rule2 bg-surface px-2.5 text-[16px] text-ink"
        {...select}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
