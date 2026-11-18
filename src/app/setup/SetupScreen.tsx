"use client";

import Link from "next/link";
import { useState } from "react";
import { StepScreen } from "@/components/plan/StepScreen";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { CheckboxRow } from "@/components/ui/CheckboxRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextField, monoLabelClass } from "@/components/ui/TextField";
import { updatePlan, updatePlanInputs } from "@/lib/db/plans";
import type { Institution, Plan } from "@/lib/db/types";
import { usePlan } from "@/lib/db/usePlan";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { Workspace } from "@/components/workspace/Workspace";
import { institutionHint } from "@/lib/labels";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";

export function SetupScreen() {
  const id = usePlanId();
  const plan = usePlan(id);
  const desktop = useIsDesktop();

  if (plan === undefined) return null;
  if (plan === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
        <h1 className="text-[24px] font-semibold">Plan not found</h1>
        <p className="text-[14px] text-ink2">
          It may have been deleted from this device.
        </p>
        <Link href="/" className="text-[15px] font-medium">
          Back to saved plans
        </Link>
      </div>
    );
  }
  return desktop ? (
    <Workspace plan={plan} />
  ) : (
    <SetupForm key={plan.id} plan={plan} />
  );
}

/** Keeps its own copy of the fields while typing; every change is saved straight away. */
function SetupForm({ plan }: { plan: Plan }) {
  const [name, setName] = useState(plan.name);
  const [institution, setInstitution] = useState<Institution>(plan.institution);
  const [frontBack, setFrontBack] = useState(plan.rules.frontBack);
  const [diagonal, setDiagonal] = useState(plan.rules.diagonal);

  const save = (patch: Parameters<typeof updatePlan>[1]) =>
    void updatePlan(plan.id, patch);

  return (
    <StepScreen
      step={1}
      stepName="Setup"
      backHref={routes.home}
      backLabel="Back to saved plans"
      footer={
        <BottomBar>
          <Button href={routes.groups(plan.id)}>Next: Groups</Button>
        </BottomBar>
      }
    >
      <TextField
        label="Plan name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          save({ name: e.target.value.trim() || "Untitled plan" });
        }}
      />

      <div className="flex flex-col gap-2">
        <span id="institution-label" className={monoLabelClass}>
          Institution
        </span>
        <SegmentedControl<Institution>
          legend="Institution"
          value={institution}
          onChange={(v) => {
            setInstitution(v);
            save({ institution: v });
          }}
          options={[
            { value: "school", label: "School" },
            { value: "college", label: "College" },
          ]}
        />
        <p className="text-[14px] leading-snug text-ink2">
          {institutionHint(institution)}
        </p>
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
        <legend className={`${monoLabelClass} mb-1 p-0`}>
          Keep same-subject students apart
        </legend>
        <CheckboxRow label="Side by side" note="always on" checked disabled />
        <CheckboxRow
          label="In front and behind"
          checked={frontBack}
          onChange={(v) => {
            setFrontBack(v);
            void updatePlanInputs(plan.id, {
              rules: { frontBack: v, diagonal },
            });
          }}
        />
        <CheckboxRow
          label="Diagonally"
          checked={diagonal}
          onChange={(v) => {
            setDiagonal(v);
            void updatePlanInputs(plan.id, {
              rules: { frontBack, diagonal: v },
            });
          }}
        />
        <p className="pt-3 text-[14px] leading-snug text-ink2">
          Stricter rules need more rooms. You&apos;ll see a warning before
          generating if the rooms won&apos;t fit.
        </p>
      </fieldset>
    </StepScreen>
  );
}
