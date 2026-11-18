"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StepScreen } from "@/components/plan/StepScreen";
import { ReviewCardView } from "@/components/review/ReviewCardView";
import { UnplacedDialog } from "@/components/review/UnplacedDialog";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { monoLabelClass } from "@/components/ui/TextField";
import { Workspace } from "@/components/workspace/Workspace";
import type { Plan } from "@/lib/db/types";
import { usePlan } from "@/lib/db/usePlan";
import { institutionLabel, studentCount } from "@/lib/plan-utils";
import { roomsCapacity } from "@/lib/rooms";
import { reviewPlan, rulesSummary, type FixStep } from "@/lib/review";
import { useGenerate } from "@/lib/useGenerate";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";

export function ReviewScreen() {
  const id = usePlanId();
  const plan = usePlan(id);
  const desktop = useIsDesktop();

  if (plan === undefined) return null;
  if (plan === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
        <h1 className="text-[24px] font-semibold">Plan not found</h1>
        <Link href="/" className="text-[15px] font-medium">
          Back to saved plans
        </Link>
      </div>
    );
  }
  return desktop ? <Workspace plan={plan} /> : <Review plan={plan} />;
}

function Review({ plan }: { plan: Plan }) {
  const { generate, busy, unplaced, dismiss } = useGenerate(plan);

  const stepHref = (s: FixStep) => routes[s](plan.id);
  const review = useMemo(() => reviewPlan(plan), [plan]);
  const students = studentCount(plan);
  const subjects = new Set(plan.groups.map((g) => g.subject)).size;

  const summary = [
    {
      key: "Plan",
      value: `${plan.name} · ${institutionLabel(plan)}`,
      href: routes.setup(plan.id),
      aria: "Edit plan",
    },
    {
      key: "Kept apart",
      value: rulesSummary(plan.rules),
      href: routes.setup(plan.id),
      aria: "Edit rules",
    },
    {
      key: "Groups",
      value: `${plan.groups.length} ${plan.groups.length === 1 ? "group" : "groups"} · ${students} students · ${subjects} ${subjects === 1 ? "subject" : "subjects"}`,
      href: routes.groups(plan.id),
      aria: "Edit groups",
    },
    {
      key: "Rooms",
      value: `${plan.rooms.length} ${plan.rooms.length === 1 ? "room" : "rooms"} · ${roomsCapacity(plan.rooms)} seats`,
      href: routes.rooms(plan.id),
      aria: "Edit rooms",
    },
  ];

  return (
    <StepScreen
      step={4}
      stepName="Review"
      backHref={routes.rooms(plan.id)}
      backLabel="Back to rooms"
      footer={
        <BottomBar>
          <Button
            variant="accent"
            onClick={generate}
            disabled={review.blocked || busy}
          >
            Generate seating
          </Button>
          <p className="text-center text-[13px] leading-snug text-ink2">
            You can move any student afterwards.
          </p>
        </BottomBar>
      }
    >
      <h2 className="-mb-1 text-[24px] leading-tight font-semibold">
        Check, then generate
      </h2>

      <ul className="m-0 flex list-none flex-col border-t border-ink p-0">
        {summary.map((s) => (
          <li
            key={s.key}
            className="flex min-h-[60px] items-center justify-between gap-3 border-b border-rule py-1.5"
          >
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className={monoLabelClass}>{s.key}</span>
              <span className="text-[15px] leading-snug">{s.value}</span>
            </div>
            <Link
              href={s.href}
              aria-label={s.aria}
              className="flex h-11 min-w-11 items-center justify-center text-[14px] font-medium"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <h3 className={monoLabelClass}>Before you generate</h3>
        {review.cards.map((c) => (
          <ReviewCardView
            key={c.title}
            card={c}
            href={c.action && stepHref(c.action.step)}
          />
        ))}
      </div>

      <UnplacedDialog unplaced={unplaced} planId={plan.id} onClose={dismiss} />
    </StepScreen>
  );
}
