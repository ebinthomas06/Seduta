"use client";

import { useMemo, useState } from "react";
import { GroupSheet } from "@/components/groups/GroupSheet";
import { StepScreen } from "@/components/plan/StepScreen";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlusIcon } from "@/components/ui/Icons";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { updatePlanInputs } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import { usePlan } from "@/lib/db/usePlan";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { Workspace } from "@/components/workspace/Workspace";
import { distinctSubjects, rollSummary } from "@/lib/groups";
import { studentCount } from "@/lib/plan-utils";
import { expandGroup, type Group } from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";
import { LoadingState, PlanNotFound } from "@/components/plan/PlanStates";

export function GroupsScreen() {
  const id = usePlanId();
  const plan = usePlan(id);
  const desktop = useIsDesktop();

  if (plan === undefined) return <LoadingState />;
  if (plan === null) return <PlanNotFound />;
  return desktop ? <Workspace plan={plan} /> : <GroupsList plan={plan} />;
}

type SheetState = { open: false } | { open: true; group: Group | null };

function GroupsList({ plan }: { plan: Plan }) {
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const subjects = useMemo(() => distinctSubjects(plan.groups), [plan.groups]);
  const subjectMap = useMemo(() => buildSubjectMap(subjects), [subjects]);
  const editing = sheet.open ? sheet.group : null;

  async function onSave(data: Omit<Group, "id">) {
    const groups = editing
      ? plan.groups.map((g) =>
          g.id === editing.id ? { ...data, id: g.id } : g,
        )
      : [...plan.groups, { ...data, id: crypto.randomUUID() }];
    await updatePlanInputs(plan.id, { groups });
    setSheet({ open: false });
  }

  async function onDelete() {
    if (!editing) return;
    await updatePlanInputs(plan.id, {
      groups: plan.groups.filter((g) => g.id !== editing.id),
    });
    setConfirmDelete(false);
    setSheet({ open: false });
  }

  const students = studentCount(plan);
  const noGroups = plan.groups.length === 0;

  return (
    <StepScreen
      step={2}
      stepName="Groups"
      backHref={routes.setup(plan.id)}
      backLabel="Back to setup"
      footer={
        <BottomBar>
          <div className="flex justify-between font-mono text-[12px] font-medium tracking-[.04em] text-ink2">
            <span>{students} students</span>
            <span>
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
            </span>
          </div>
          <Button href={routes.rooms(plan.id)}>Next: Rooms</Button>
        </BottomBar>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[24px] leading-tight font-semibold">
          Who is writing?
        </h2>
        <p className="text-[14px] leading-snug text-ink2">
          One group per{" "}
          {plan.institution === "school"
            ? "class and section"
            : "year and branch"}
          . Groups sitting the same subject are kept apart.
        </p>
      </div>

      {!noGroups && (
        <ul className="m-0 flex list-none flex-col border-t border-ink p-0">
          {plan.groups.map((g) => {
            const info = subjectMap.get(g.subject);
            return (
              <li key={g.id} className="border-b border-rule">
                <button
                  type="button"
                  onClick={() => setSheet({ open: true, group: g })}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 py-2.5 text-left text-ink"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[17px] leading-tight font-medium">
                      {g.label}
                    </span>
                    <span className="font-mono text-[13px] leading-snug text-ink2">
                      {rollSummary(g)}
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-2.5">
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-[14px] leading-tight">
                        {g.subject}
                      </span>
                      <span className="font-mono text-[12px] leading-tight text-ink2">
                        {expandGroup(g).length} students
                      </span>
                    </span>
                    {info && <SubjectTile info={info} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        variant="dashed"
        onClick={() => setSheet({ open: true, group: null })}
      >
        <PlusIcon /> Add group
      </Button>

      <GroupSheet
        open={sheet.open}
        group={editing}
        institution={plan.institution}
        subjects={subjects}
        onClose={() => setSheet({ open: false })}
        onSave={onSave}
        onDelete={() => setConfirmDelete(true)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this group?"
        message={
          editing
            ? `${editing.label} (${editing.subject}) will be removed from this plan.`
            : ""
        }
        confirmLabel="Delete group"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </StepScreen>
  );
}
