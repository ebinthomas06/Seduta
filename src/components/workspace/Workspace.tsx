"use client";

import type { Plan } from "@/lib/db/types";
import { GroupsTable } from "./GroupsTable";
import { PlanSection } from "./PlanSection";
import { RoomsTable } from "./RoomsTable";
import { SummaryPanel } from "./SummaryPanel";
import { WorkspaceHeader } from "./WorkspaceHeader";

/** D2: plan, groups and rooms on one page with a live summary. Replaces steps 1 to 4 on wide screens. */
export function Workspace({ plan }: { plan: Plan }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <WorkspaceHeader planName={plan.name} />
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-wrap items-start gap-10 p-8">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-9">
          <div id="plan" className="scroll-mt-8">
            <PlanSection plan={plan} />
          </div>
          <div id="groups" className="scroll-mt-8">
            <GroupsTable plan={plan} />
          </div>
          <div id="rooms" className="scroll-mt-8">
            <RoomsTable plan={plan} />
          </div>
        </div>
        <SummaryPanel plan={plan} />
      </div>
    </div>
  );
}
