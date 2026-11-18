"use client";

import { useMemo } from "react";
import { ReviewCardView } from "@/components/review/ReviewCardView";
import { UnplacedDialog } from "@/components/review/UnplacedDialog";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import type { Plan } from "@/lib/db/types";
import { studentCount } from "@/lib/plan-utils";
import { roomsCapacity } from "@/lib/rooms";
import { reviewPlan, type FixStep } from "@/lib/review";
import { useGenerate } from "@/lib/useGenerate";

/** Sticky summary: live counts, the same pre-checks as the review step, and Generate. */
export function SummaryPanel({ plan }: { plan: Plan }) {
  const { generate, busy, error, unplaced, dismiss } = useGenerate(plan);
  const review = useMemo(() => reviewPlan(plan), [plan]);
  const subjects = new Set(plan.groups.map((g) => g.subject)).size;

  // On the workspace every fix is on the same page, so links just scroll there.
  const stepHref = (s: FixStep) =>
    s === "rooms" ? "#rooms" : s === "groups" ? "#groups" : "#plan";

  const stats = [
    { value: studentCount(plan), label: "students" },
    { value: subjects, label: "subjects" },
    { value: plan.rooms.length, label: "rooms" },
    { value: roomsCapacity(plan.rooms), label: "seats" },
  ];

  return (
    <aside
      aria-label="Summary"
      className="flex max-w-[380px] flex-[1_1_300px] flex-col self-start border border-ink bg-surface lg:sticky lg:top-8"
    >
      <h2 className="border-b border-rule px-5 py-4 font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
        Summary
      </h2>
      <dl className="m-0 grid grid-cols-2 border-b border-rule">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cx(
              "flex flex-col gap-1 px-5 py-4",
              i % 2 === 0 && "border-r border-rule",
              i < 2 && "border-b border-rule",
            )}
          >
            <dd className="m-0 font-mono text-[28px] leading-tight font-medium">
              {s.value}
            </dd>
            <dt className="text-[13px] text-ink2">{s.label}</dt>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 px-5 py-4" aria-live="polite">
        {review.cards.map((c) => (
          <ReviewCardView
            key={c.title}
            card={c}
            compact
            href={c.action && stepHref(c.action.step)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2.5 px-5 pb-5">
        <Button
          variant="accent"
          onClick={generate}
          disabled={review.blocked || busy}
        >
          Generate seating
        </Button>
        {error && (
          <p
            role="alert"
            className="text-center text-[13px] font-medium text-alert"
          >
            {error}
          </p>
        )}
        <p className="text-center text-[13px] text-ink2">
          You can move any student afterwards.
        </p>
      </div>
      <UnplacedDialog unplaced={unplaced} planId={plan.id} onClose={dismiss} />
    </aside>
  );
}
