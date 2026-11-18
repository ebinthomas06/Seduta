"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";

interface Option<T extends string> {
  value: T;
  label: string;
  /** Accessible name when the visible label is terse, e.g. "2". */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  /** Screen-reader name for the group. */
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** lg: full-width 48px (setup). sm: 44px squares (seats per bench, paper size). */
  size?: "lg" | "sm";
  mono?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  size = "lg",
  mono = false,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={cx("m-0 min-w-0 border-0 p-0", className)}>
      <legend className="sr-only">{legend}</legend>
      <div
        className={cx(
          "flex overflow-hidden rounded-[3px] border border-ink",
          size === "sm" && "w-fit",
        )}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={o.value}
              className={cx(
                "relative flex items-center justify-center font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-accent",
                size === "lg"
                  ? "h-12 flex-1 text-[16px]"
                  : "h-11 min-w-11 px-3 text-[15px]",
                mono ? "font-mono" : "font-sans",
                on ? "bg-ink text-bg" : "bg-surface text-ink",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                aria-label={o.ariaLabel}
                onChange={() => onChange(o.value)}
                className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
