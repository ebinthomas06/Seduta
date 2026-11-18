"use client";

import { useId, useState } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { updatePlan } from "@/lib/db/plans";
import { mutatePlanInputs } from "@/lib/db/plans";
import type { Institution, Plan } from "@/lib/db/types";
import { fieldLabelClass, SectionHeading } from "./SectionHeading";

const checkbox = "m-0 h-5 w-5 accent-accent";

export function PlanSection({ plan }: { plan: Plan }) {
  const nameId = useId();
  const [name, setName] = useState(plan.name);
  const setRule = (patch: Partial<Plan["rules"]>) =>
    void mutatePlanInputs(plan.id, (p) => ({
      rules: { ...p.rules, ...patch },
    }));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading number="01" title="Plan" />
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex min-w-[280px] flex-[2_1_280px] flex-col gap-2">
          <label htmlFor={nameId} className={fieldLabelClass}>
            Plan name
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              void updatePlan(plan.id, {
                name: e.target.value.trim() || "Untitled plan",
              });
            }}
            className="h-11 w-full rounded-[3px] border border-rule2 bg-surface px-3 text-[15px] text-ink"
          />
        </div>
        <SegmentedControl<Institution>
          legend="Institution"
          size="sm"
          value={plan.institution}
          onChange={(v) => void updatePlan(plan.id, { institution: v })}
          options={[
            { value: "school", label: "School" },
            { value: "college", label: "College" },
          ]}
        />
      </div>
      <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-x-7 gap-y-2 border-0 p-0">
        <legend className="sr-only">Keep same-subject students apart</legend>
        <span className="text-[14px] text-ink2" aria-hidden="true">
          Keep same subject apart:
        </span>
        <label className="flex min-h-11 items-center gap-2 text-[15px]">
          <input type="checkbox" checked disabled className={checkbox} />
          Side by side
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[15px]">
          <input
            type="checkbox"
            checked={plan.rules.frontBack}
            onChange={(e) => setRule({ frontBack: e.target.checked })}
            className={checkbox}
          />
          In front and behind
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[15px]">
          <input
            type="checkbox"
            checked={plan.rules.diagonal}
            onChange={(e) => setRule({ diagonal: e.target.checked })}
            className={checkbox}
          />
          Diagonally
        </label>
      </fieldset>
    </section>
  );
}
