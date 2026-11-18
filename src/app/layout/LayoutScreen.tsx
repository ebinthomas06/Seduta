"use client";

import { LayoutEditor } from "@/components/editor/LayoutEditor";
import {
  LoadingState,
  NotFoundState,
  PlanNotFound,
} from "@/components/plan/PlanStates";
import { usePlan } from "@/lib/db/usePlan";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";

export function LayoutScreen() {
  const id = usePlanId();
  const plan = usePlan(id);

  if (plan === undefined) return <LoadingState />;
  if (plan === null) return <PlanNotFound />;
  if (!plan.layout) {
    return (
      <NotFoundState
        title="No seating yet"
        text="Generate the seating from the review step first."
        href={routes.review(plan.id)}
        label="Go to review"
      />
    );
  }
  return <LayoutEditor plan={plan} />;
}
