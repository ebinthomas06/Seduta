"use client";

import Link from "next/link";
import { LayoutEditor } from "@/components/editor/LayoutEditor";
import { usePlan } from "@/lib/db/usePlan";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";

export function LayoutScreen() {
  const id = usePlanId();
  const plan = usePlan(id);

  if (plan === undefined) return null;
  if (plan === null) {
    return (
      <Message title="Plan not found" href="/" label="Back to saved plans" />
    );
  }
  if (!plan.layout) {
    return (
      <Message
        title="No seating yet"
        text="Generate the seating from the review step first."
        href={routes.review(plan.id)}
        label="Go to review"
      />
    );
  }
  return <LayoutEditor plan={plan} />;
}

function Message({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text?: string;
  href: string;
  label: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
      <h1 className="text-[24px] font-semibold">{title}</h1>
      {text && <p className="text-[14px] text-ink2">{text}</p>}
      <Link href={href} className="text-[15px] font-medium">
        {label}
      </Link>
    </div>
  );
}
