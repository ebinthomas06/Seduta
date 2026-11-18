import { Button } from "@/components/ui/Button";
import { SubjectTile } from "@/components/ui/SubjectTile";
import type { ClashNeighbour, Seat } from "@/lib/editor/ops";
import type { Student } from "@/lib/seating/seating";
import type { SubjectInfo } from "@/lib/subjects";

interface SelectedPanelProps {
  seat: Seat;
  student: Student | null;
  unusable: boolean;
  info?: SubjectInfo;
  code?: string;
  clashes: ClashNeighbour[];
  hasTargets: boolean;
  canMoveToEmpty: boolean;
  error: string | null;
  codeOf: (s: Student) => string;
  onCancel: () => void;
  onMoveToEmpty: () => void;
  onToggleUsable: () => void;
}

/** The bottom panel shown while a seat is selected (M9). */
export function SelectedPanel({
  seat,
  student,
  unusable,
  info,
  code,
  clashes,
  hasTargets,
  canMoveToEmpty,
  error,
  codeOf,
  onCancel,
  onMoveToEmpty,
  onToggleUsable,
}: SelectedPanelProps) {
  const where = `Row ${seat[0] + 1}, seat ${seat[1] + 1}`;

  return (
    <section
      aria-label="Selected seat"
      className="flex flex-none flex-col gap-3 border-t-2 border-ink bg-surface px-4 pt-3.5 pb-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {student && info ? (
            <SubjectTile info={info} size={36} selected />
          ) : (
            <span
              aria-hidden="true"
              className="box-border h-9 w-9 flex-none rounded-[3px] border-[3px] border-accent"
            />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-[16px] leading-tight font-semibold">
              {student
                ? `${code} · ${student.subject}`
                : unusable
                  ? "Unusable seat"
                  : "Empty seat"}
            </p>
            <p className="truncate font-mono text-[12px] leading-snug text-ink2">
              {student ? `${student.label} · ${where}` : where}
            </p>
          </div>
        </div>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <p className="text-[14px] leading-normal text-ink3" aria-live="polite">
        {student ? (
          clashes.length > 0 ? (
            <>
              Clashes with{" "}
              {clashes.map((c, i) => (
                <span key={`${c.seat}`}>
                  {i > 0 && (i === clashes.length - 1 ? " and " : ", ")}
                  <strong className="font-semibold">
                    {codeOf(c.student)}
                  </strong>{" "}
                  {c.where === "beside"
                    ? "in the seat beside"
                    : `in the seat ${c.where}`}
                </span>
              ))}{" "}
              (both {student.subject}).
              {hasTargets && " Tap a dashed seat to swap and clear it."}
            </>
          ) : (
            "No clashes here. Tap another seat to swap places."
          )
        ) : unusable ? (
          "Students can't sit here. Make it usable to seat someone again."
        ) : (
          "Tap a student to move them into this seat."
        )}
      </p>

      {error && (
        <p role="alert" className="text-[13px] font-medium text-alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {student && (
          <Button
            variant="outline"
            size="md"
            className="flex-1 px-2"
            disabled={!canMoveToEmpty}
            onClick={onMoveToEmpty}
          >
            Move to empty seat
          </Button>
        )}
        <Button
          variant="outline"
          size="md"
          className="flex-1 px-2"
          onClick={onToggleUsable}
        >
          {unusable ? "Make seat usable" : "Mark seat unusable"}
        </Button>
      </div>
    </section>
  );
}
