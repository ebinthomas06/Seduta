"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SelectedPanel } from "@/components/editor/SelectedPanel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DownloadIcon } from "@/components/ui/Icons";
import { SeatGrid } from "@/components/ui/SeatGrid";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { TopBar } from "@/components/ui/TopBar";
import { cx } from "@/lib/cx";
import { updatePlan } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import {
  bestEmptySeat,
  clashNeighbours,
  clashSeats,
  key,
  moveToBestEmpty,
  rearrange,
  roomClashes,
  setSeatUsable,
  shortCode,
  swapSeats,
  type Seat,
  type Snapshot,
} from "@/lib/editor/ops";
import { useEditorStore } from "@/lib/editor/store";
import { distinctSubjects } from "@/lib/groups";
import { unplacedStudents } from "@/lib/review";
import { suggestSwaps, type Student } from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";
import { fitCellSize, useElementWidth } from "@/lib/useElementWidth";

const tabLabel = (name: string) => name.replace(/^room\s+/i, "") || name;

export function LayoutEditor({ plan }: { plan: Plan }) {
  const history = useEditorStore((s) => s.history);
  const loadedFor = useEditorStore((s) => s.planId);
  const load = useEditorStore((s) => s.load);
  const lastSaved = useRef<Snapshot | null>(null);

  // Load the saved layout once per plan. Later plan updates (our own autosaves) don't reload it.
  useEffect(() => {
    if (loadedFor === plan.id || !plan.layout) return;
    const snapshot = { layout: plan.layout, rooms: plan.rooms };
    lastSaved.current = snapshot;
    load(plan.id, snapshot);
  }, [plan.id, plan.layout, plan.rooms, loadedFor, load]);

  const present = history?.present;
  useEffect(() => {
    if (!present || loadedFor !== plan.id || present === lastSaved.current)
      return;
    lastSaved.current = present;
    void updatePlan(plan.id, { layout: present.layout, rooms: present.rooms });
  }, [present, loadedFor, plan.id]);

  if (!history || loadedFor !== plan.id) return null;
  return (
    <EditorBody
      plan={plan}
      snap={history.present}
      canUndo={history.past.length > 0}
      canRedo={history.future.length > 0}
    />
  );
}

function EditorBody({
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
  const { edit, undo, redo } = useEditorStore.getState();
  const rules = plan.rules;
  const [roomId, setRoomId] = useState(snap.rooms[0]?.id ?? "");
  const [selected, setSelected] = useState<Seat | null>(null);
  const [fixCursor, setFixCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRearrange, setConfirmRearrange] = useState(false);

  const room = snap.rooms.find((r) => r.id === roomId) ?? snap.rooms[0];
  const grid = snap.layout[room.id];
  const subjects = useMemo(
    () => buildSubjectMap(distinctSubjects(plan.groups)),
    [plan.groups],
  );
  const codeOf = (s: Student) => shortCode(s, plan.groups);

  const clashList = roomClashes(snap, rules, room.id);
  const clashes = useMemo(
    () => clashSeats(snap, rules, room.id),
    [snap, rules, room.id],
  );
  const disabled = useMemo(() => new Set(room.disabled), [room.disabled]);
  const unplaced = useMemo(
    () => unplacedStudents(plan.groups, snap.layout),
    [plan.groups, snap.layout],
  );

  const selStudent = selected ? grid[selected[0]][selected[1]] : null;
  const selUnusable = selected ? disabled.has(key(selected)) : false;
  const targets = useMemo(
    () =>
      selected && selStudent
        ? new Set(
            suggestSwaps(snap.layout, snap.rooms, rules, room.id, selected).map(
              (s) => key(s.seat),
            ),
          )
        : new Set<string>(),
    [selected, selStudent, snap, rules, room.id],
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const available = useElementWidth(wrapRef);
  const cellSize = fitCellSize(available - 24, room.cols, room.seatsPerBench);

  function reset() {
    setSelected(null);
    setError(null);
    setNotice(null);
  }

  function chooseRoom(id: string) {
    setRoomId(id);
    setFixCursor(0);
    reset();
  }

  function onSeat(r: number, c: number) {
    setError(null);
    setNotice(null);
    const here: Seat = [r, c];
    if (!selected) return setSelected(here);
    if (selected[0] === r && selected[1] === c) return setSelected(null);
    // Unusable seats can be selected, never swapped into.
    if (disabled.has(key(here)) || selUnusable) return setSelected(here);
    if (!selStudent && !grid[r][c]) return setSelected(here);
    edit(swapSeats(snap, room.id, selected, here));
    setSelected(null);
  }

  function fix() {
    if (clashList.length === 0) return;
    const clash = clashList[fixCursor % clashList.length];
    setFixCursor(fixCursor + 1);
    setError(null);
    setNotice(null);
    setSelected(clash.a);
  }

  function moveToEmpty() {
    if (!selected) return;
    const next = moveToBestEmpty(snap, rules, room.id, selected);
    if (next) edit(next);
    setSelected(null);
  }

  function toggleUsable() {
    if (!selected) return;
    const res = setSeatUsable(snap, rules, room.id, selected, selUnusable);
    if (!res.ok) return setError(res.error);
    edit(res.snapshot);
    setSelected(null);
    setError(null);
  }

  function doRearrange() {
    setConfirmRearrange(false);
    const next = rearrange(snap, rules, room.id);
    if (next) {
      edit(next);
      setNotice(`${room.name} was seated again.`);
    } else {
      setNotice(
        `Couldn't seat ${room.name} again without leaving someone out, so nothing changed.`,
      );
    }
    setSelected(null);
  }

  const afterUndo = (fn: () => void) => () => {
    fn();
    reset();
  };

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
            disabled
            title="Export arrives in a later step"
          >
            <DownloadIcon /> Export
          </Button>
        }
      />

      <div
        role="tablist"
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
              role="tab"
              aria-selected={on}
              aria-label={`${r.name}${n ? `, ${n} ${n === 1 ? "clash" : "clashes"}` : ""}`}
              onClick={() => chooseRoom(r.id)}
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
      </div>

      {!selected && (
        <div className="flex flex-none flex-col gap-2 px-4 pt-3">
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
            {[...subjects].map(([name, info]) => (
              <li key={name} className="flex items-center gap-1.5 text-[13px]">
                <SubjectTile info={info} size={20} />
                {name}
              </li>
            ))}
          </ul>
          {unplaced.length > 0 && (
            <p className="text-[13px] leading-snug text-ink3">
              <strong className="font-semibold">
                {unplaced.length}{" "}
                {unplaced.length === 1 ? "student isn't" : "students aren't"}{" "}
                seated:
              </strong>{" "}
              <span className="font-mono">
                {unplaced
                  .slice(0, 6)
                  .map((s) => s.label)
                  .join(", ")}
                {unplaced.length > 6 ? ` +${unplaced.length - 6} more` : ""}
              </span>
              .{" "}
              <Link href={`/plan/${plan.id}/rooms`} className="font-medium">
                Add a room
              </Link>
            </p>
          )}
        </div>
      )}

      <div
        ref={wrapRef}
        className="min-h-0 flex-1 overflow-auto px-3 pt-4 pb-2"
      >
        <SeatGrid
          className="mx-auto w-max"
          grid={grid}
          disabled={disabled}
          seatsPerBench={room.seatsPerBench}
          subjects={subjects}
          cellSize={cellSize}
          selected={selected}
          clashes={clashes}
          targets={targets}
          onSeatClick={onSeat}
          codeOf={codeOf}
        />
        {notice && (
          <p
            className="mt-3 text-center text-[13px] leading-snug text-ink2"
            aria-live="polite"
          >
            {notice}
          </p>
        )}
      </div>

      {selected ? (
        <SelectedPanel
          seat={selected}
          student={selStudent}
          unusable={selUnusable}
          info={selStudent ? subjects.get(selStudent.subject) : undefined}
          code={selStudent ? codeOf(selStudent) : undefined}
          clashes={clashNeighbours(snap, rules, room.id, selected)}
          hasTargets={targets.size > 0}
          canMoveToEmpty={
            !!selStudent &&
            bestEmptySeat(snap, rules, room.id, selected) !== null
          }
          error={error}
          codeOf={codeOf}
          onCancel={reset}
          onMoveToEmpty={moveToEmpty}
          onToggleUsable={toggleUsable}
        />
      ) : (
        <>
          <div
            className={cx(
              "mx-4 mb-3 flex flex-none items-center justify-between gap-2 rounded-[3px] border bg-surface py-1.5 pr-1.5 pl-3",
              clashList.length > 0 ? "border-alert" : "border-rule",
            )}
            aria-live="polite"
          >
            <p className="text-[14px] leading-snug">
              {clashList.length > 0 ? (
                <>
                  <strong className="font-semibold">
                    {clashList.length}{" "}
                    {clashList.length === 1 ? "clash" : "clashes"}
                  </strong>{" "}
                  in this room. Tap a seat, then tap another to swap.
                </>
              ) : (
                "No clashes in this room. Tap a seat, then tap another to swap."
              )}
            </p>
            {clashList.length > 0 && (
              <Button variant="text" onClick={fix}>
                Fix
              </Button>
            )}
          </div>

          <div className="flex flex-none gap-2 border-t border-rule px-4 pt-2 pb-5">
            <Button
              variant="outline"
              size="md"
              className="flex-1 border-rule2 px-2"
              disabled={!canUndo}
              onClick={afterUndo(undo)}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-1 border-rule2 px-2"
              disabled={!canRedo}
              onClick={afterUndo(redo)}
            >
              Redo
            </Button>
            <Button
              variant="outline"
              size="md"
              className="flex-[2] px-2"
              onClick={() => setConfirmRearrange(true)}
            >
              Rearrange this room
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmRearrange}
        title={`Rearrange ${room.name}?`}
        message="The students in this room are seated again from scratch, so your manual moves here are replaced. You can undo this."
        confirmLabel="Rearrange"
        onCancel={() => setConfirmRearrange(false)}
        onConfirm={doRearrange}
      />
    </div>
  );
}
