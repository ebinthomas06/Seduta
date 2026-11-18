"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ExportDialog } from "@/components/export/ExportDialog";
import { SelectedPanel } from "@/components/editor/SelectedPanel";
import type { LayoutController } from "@/components/editor/useLayoutController";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DownloadIcon } from "@/components/ui/Icons";
import { SeatGrid } from "@/components/ui/SeatGrid";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { TopBar } from "@/components/ui/TopBar";
import { cx } from "@/lib/cx";
import { bestEmptySeat, clashNeighbours, roomClashes } from "@/lib/editor/ops";
import { fitCellSize, useElementWidth } from "@/lib/useElementWidth";
import { routes } from "@/lib/routes";

const tabLabel = (name: string) => name.replace(/^room\s+/i, "") || name;

/** M8 and M9: the phone layout editor. */
export function MobileEditor({ c }: { c: LayoutController }) {
  const { plan, snap, rules, room, selected, selStudent } = c;
  const [exportOpen, setExportOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const available = useElementWidth(wrapRef);
  const cellSize = fitCellSize(available - 24, room.cols, room.seatsPerBench);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden">
      <TopBar
        title={plan.name}
        backHref="/"
        backLabel="Back to saved plans"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
          >
            <DownloadIcon /> Export
          </Button>
        }
      />

      <nav
        aria-label="Rooms"
        className="flex flex-none overflow-x-auto border-b border-rule px-2"
      >
        {snap.rooms.map((r) => {
          const n = roomClashes(snap, rules, r.id).length;
          const on = r.id === room.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-current={on ? "true" : undefined}
              aria-label={`${r.name}${n ? `, ${n} ${n === 1 ? "clash" : "clashes"}` : ""}`}
              onClick={() => c.chooseRoom(r.id)}
              className={cx(
                "relative flex h-12 min-w-[72px] flex-none items-center justify-center gap-1.5 px-3 font-mono text-[15px]",
                on
                  ? "font-semibold text-ink shadow-[inset_0_-3px_0_var(--ink)]"
                  : "font-medium text-ink2",
              )}
            >
              <span>{tabLabel(r.name)}</span>
              {n > 0 && (
                <span
                  aria-hidden="true"
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-alert px-[5px] font-mono text-[11px] font-semibold text-on-alert"
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!selected && (
        <div className="flex flex-none flex-col gap-2 px-4 pt-3">
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
            {[...c.subjects].map(([name, info]) => (
              <li key={name} className="flex items-center gap-1.5 text-[13px]">
                <SubjectTile info={info} size={20} />
                {name}
              </li>
            ))}
          </ul>
          {c.unplaced.length > 0 && (
            <p className="text-[13px] leading-snug text-ink3">
              <strong className="font-semibold">
                {c.unplaced.length}{" "}
                {c.unplaced.length === 1 ? "student isn't" : "students aren't"}{" "}
                seated:
              </strong>{" "}
              <span className="font-mono">
                {c.unplaced
                  .slice(0, 6)
                  .map((s) => s.label)
                  .join(", ")}
                {c.unplaced.length > 6 ? ` +${c.unplaced.length - 6} more` : ""}
              </span>
              .{" "}
              <Link href={routes.rooms(plan.id)} className="font-medium">
                Add a room
              </Link>
            </p>
          )}
        </div>
      )}

      <main
        ref={wrapRef}
        className="min-h-0 flex-1 overflow-auto px-3 pt-4 pb-2"
      >
        <SeatGrid
          className="mx-auto w-max"
          grid={c.grid}
          disabled={c.disabled}
          seatsPerBench={room.seatsPerBench}
          subjects={c.subjects}
          cellSize={cellSize}
          selected={selected}
          clashes={c.clashes}
          targets={c.targets}
          onSeatClick={c.onSeat}
          codeOf={c.codeOf}
        />
        {c.notice && (
          <p
            className="mt-3 text-center text-[13px] leading-snug text-ink2"
            aria-live="polite"
          >
            {c.notice}
          </p>
        )}
        {c.saveError && (
          <p
            role="alert"
            className="mt-3 text-center text-[13px] font-medium text-alert"
          >
            Couldn&apos;t save your last change on this device. Export a backup
            from the saved plans page, then reload.
          </p>
        )}
      </main>

      {selected ? (
        <SelectedPanel
          seat={selected}
          student={selStudent}
          unusable={c.selUnusable}
          info={selStudent ? c.subjects.get(selStudent.subject) : undefined}
          code={selStudent ? c.codeOf(selStudent) : undefined}
          clashes={clashNeighbours(snap, rules, room.id, selected)}
          hasTargets={c.targets.size > 0}
          canMoveToEmpty={
            !!selStudent &&
            bestEmptySeat(snap, rules, room.id, selected) !== null
          }
          error={c.error}
          codeOf={c.codeOf}
          onCancel={c.clearSelection}
          onMoveToEmpty={c.moveToEmpty}
          onToggleUsable={c.toggleUsable}
        />
      ) : (
        <>
          <div
            className={cx(
              "mx-4 mb-3 flex flex-none items-center justify-between gap-2 rounded-[3px] border bg-surface py-1.5 pr-1.5 pl-3",
              c.clashList.length > 0 ? "border-alert" : "border-rule",
            )}
            aria-live="polite"
          >
            <p className="text-[14px] leading-snug">
              {c.clashList.length > 0 ? (
                <>
                  <strong className="font-semibold">
                    {c.clashList.length}{" "}
                    {c.clashList.length === 1 ? "clash" : "clashes"}
                  </strong>{" "}
                  in this room. Tap a seat, then tap another to swap.
                </>
              ) : (
                "No clashes in this room. Tap a seat, then tap another to swap."
              )}
            </p>
            {c.clashList.length > 0 && (
              <Button variant="text" onClick={c.fix}>
                Fix
              </Button>
            )}
          </div>

          <div className="flex flex-none gap-2 border-t border-rule px-4 pt-2 pb-5">
            <Button
              variant="outline"
              size="md"
              className="flex-1 border-rule2 px-2"
              disabled={!c.canUndo}
              onClick={c.doUndo}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-1 border-rule2 px-2"
              disabled={!c.canRedo}
              onClick={c.doRedo}
            >
              Redo
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-[2] px-2"
              onClick={() => c.setConfirmRearrange(true)}
            >
              Rearrange this room
            </Button>
          </div>
        </>
      )}

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        plan={plan}
        snap={snap}
      />
      <ConfirmDialog
        open={c.confirmRearrange}
        title={`Rearrange ${room.name}?`}
        message="The students in this room are seated again from scratch, so your manual moves here are replaced. You can undo this."
        confirmLabel="Rearrange"
        onCancel={() => c.setConfirmRearrange(false)}
        onConfirm={c.doRearrange}
      />
    </div>
  );
}
