import Link from "next/link";
import { cx } from "@/lib/cx";

type Variant =
  "primary" | "outline" | "danger" | "dashed" | "text" | "textDanger";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-bg",
  outline: "border border-ink bg-surface text-ink",
  danger: "border border-alert text-alert",
  dashed: "border border-dashed border-ink2 text-ink",
  text: "text-accent hover:text-accent-hover",
  textDanger: "text-alert",
};

const sizes: Record<Size, string> = {
  lg: "h-13 px-5 text-[16px]",
  md: "h-12 px-4 text-[14px]",
  sm: "h-11 px-3.5 text-[14px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type LinkProps = CommonProps & { href: string; "aria-label"?: string };

function classes({ variant = "primary", size = "lg", className }: CommonProps) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium no-underline",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    variant === "text" || variant === "textDanger"
      ? "h-11 min-w-11 px-2 text-[14px]"
      : sizes[size],
    className,
  );
}

export function Button(props: ButtonProps | LinkProps) {
  if ("href" in props) {
    const { href, variant, size, className, children, ...rest } = props;
    return (
      <Link
        href={href}
        className={classes({ variant, size, className, children })}
        {...rest}
      >
        {children}
      </Link>
    );
  }
  const {
    variant,
    size,
    className,
    children,
    type = "button",
    ...rest
  } = props;
  return (
    <button
      type={type}
      className={classes({ variant, size, className, children })}
      {...rest}
    >
      {children}
    </button>
  );
}
