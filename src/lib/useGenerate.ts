"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePlan } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import { place, type Student } from "@/lib/seating/seating";
import { routes } from "@/lib/routes";

/**
 * Runs the engine, saves the layout and marks the plan ready. Goes straight to the editor when
 * everyone is seated; otherwise exposes `unplaced` so a dialog can explain first.
 */
export function useGenerate(plan: Plan) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [unplaced, setUnplaced] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = place(plan.groups, plan.rooms, plan.rules);
      await updatePlan(plan.id, { layout: result.layout, status: "ready" });
      if (result.unplaced.length > 0) setUnplaced(result.unplaced);
      else router.push(routes.layout(plan.id));
    } catch {
      setError("Couldn't save the seating on this device. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return {
    generate,
    busy,
    error,
    unplaced,
    dismiss: () => setUnplaced(null),
  };
}
