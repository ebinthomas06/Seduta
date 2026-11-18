"use client";

import { useEffect, useRef } from "react";
import { DesktopEditor } from "@/components/editor/DesktopEditor";
import { MobileEditor } from "@/components/editor/MobileEditor";
import { useLayoutController } from "@/components/editor/useLayoutController";
import { updatePlan } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import type { Snapshot } from "@/lib/editor/ops";
import { useEditorStore } from "@/lib/editor/store";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { LoadingState } from "@/components/plan/PlanStates";

/** Loads the saved layout into the editor store, autosaves every change, and picks the view. */
export function LayoutEditor({ plan }: { plan: Plan }) {
  const history = useEditorStore((s) => s.history);
  const loadedFor = useEditorStore((s) => s.planId);
  const load = useEditorStore((s) => s.load);
  const lastSaved = useRef<Snapshot | null>(null);

  // Load the saved layout once per visit. Later plan updates (our own autosaves) don't reload it.
  useEffect(() => {
    if (loadedFor === plan.id || !plan.layout) return;
    const snapshot = { layout: plan.layout, rooms: plan.rooms };
    lastSaved.current = snapshot;
    load(plan.id, snapshot);
  }, [plan.id, plan.layout, plan.rooms, loadedFor, load]);

  // Forget the loaded layout on leaving, so a regenerated layout is picked up next time.
  useEffect(() => () => useEditorStore.getState().reset(), []);

  const present = history?.present;
  useEffect(() => {
    if (!present || loadedFor !== plan.id || present === lastSaved.current)
      return;
    lastSaved.current = present;
    updatePlan(plan.id, { layout: present.layout, rooms: present.rooms })
      .then(() => useEditorStore.getState().setSaveError(false))
      .catch(() => useEditorStore.getState().setSaveError(true));
  }, [present, loadedFor, plan.id]);

  if (!history || loadedFor !== plan.id) return <LoadingState />;
  return (
    <EditorView
      plan={plan}
      snap={history.present}
      canUndo={history.past.length > 0}
      canRedo={history.future.length > 0}
    />
  );
}

function EditorView({
  plan,
  snap,
  canUndo,
  canRedo,
}: {
  plan: Plan;
  snap: Snapshot;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const desktop = useIsDesktop();
  const controller = useLayoutController(plan, snap, canUndo, canRedo);
  return desktop ? (
    <DesktopEditor c={controller} />
  ) : (
    <MobileEditor c={controller} />
  );
}
