"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Student } from "@/lib/seating/seating";
import { routes } from "@/lib/routes";

/** Shown after generating when some students could not be seated safely. */
export function UnplacedDialog({
  unplaced,
  planId,
  onClose,
}: {
  unplaced: Student[] | null;
  planId: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={unplaced !== null}
      onClose={onClose}
      title="Some students didn't fit"
      variant="dialog"
      maxWidth={440}
    >
      {unplaced && (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-normal text-ink3">
            {unplaced.length} {unplaced.length === 1 ? "student" : "students"}{" "}
            could not be seated without sitting next to the same subject, so
            they were left out. Add a room or relax a rule, then generate again.
          </p>
          <p className="max-h-32 overflow-y-auto font-mono text-[13px] leading-relaxed text-ink2">
            {unplaced.map((s) => s.label).join(", ")}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Back to review
            </Button>
            <Button size="md" href={routes.layout(planId)}>
              Open layout
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
