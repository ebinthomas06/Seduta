"use client";

import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useState } from "react";
import { ExportDialog } from "@/components/export/ExportDialog";
import { DndSeat } from "@/components/editor/DndSeat";
import type { LayoutController } from "@/components/editor/useLayoutController";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BackIcon, DownloadIcon } from "@/components/ui/Icons";
import { seatKey, SeatGrid } from "@/components/ui/SeatGrid";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { cx } from "@/lib/cx";
import {
  bestEmptySeat,
  clashPosition,
  key,
  roomClashes,
  roomOccupancy,
  seatedBySubject,
  suggestionEffect,
  type Seat,
} from "@/lib/editor/ops";
import { roomMeta } from "@/lib/rooms";
import { routes } from "@/lib/routes";

const railLabel =
  "px-2 font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase";

const parseSeat = (id: string | number): Seat => {
  const [r, c] = String(id).split(",").map(Number);
  return [r, c];
};

/** D3: rooms rail, large grid with drag-to-swap, and an inspector. */
export function DesktopEditor({ c }: { c: LayoutController }) {
  const { plan, snap, rules, room, selected, selStudent } = c;
  const [exportOpen, setExportOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const bySubject = seatedBySubject(snap);
  const clashCount = c.clashList.length;
  const occupancy = roomOccupancy(snap, room.id);
  const group = selStudent
    ? plan.groups.find((g) => g.id === selStudent.groupId)
    : undefined;
  const info = selStudent ? c.subjects.get(selStudent.subject) : undefined;
  const where = selected
    ? `Row ${selected[0] + 1}, seat ${selected[1] + 1}`
    : "";

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    c.onDragSwap(parseSeat(e.active.id), parseSeat(e.over.id));
  }

  const codeAt = (seat: Seat) => {
    const s = c.grid[seat[0]][seat[1]];
    return s ? c.codeOf(s) : "Empty seat";
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex min-h-14 flex-none flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-1.5 text-[14px] text-ink no-underline"
          >
            <BackIcon size={18} />
            Seating plans
          </Link>
          <span className="h-6 w-px bg-rule" aria-hidden="true" />
          <h1 className="truncate text-[17px] leading-tight font-semibold">
            {plan.name}
          </h1>
          <span className="font-mono text-[12px] text-ink2">
            Saved on this computer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-rule2 px-4"
            disabled={!c.canUndo}
            onClick={c.doUndo}
          >
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-rule2 px-4"
            disabled={!c.canRedo}
            onClick={c.doRedo}
          >
            Redo
          </Button>
          <Button
            size="sm"
            className="px-[18px]"
            onClick={() => setExportOpen(true)}
          >
            <DownloadIcon size={16} /> Export
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-wrap items-stretch">
        {/* Rooms and subjects */}
        <aside
          aria-label="Rooms and subjects"
          className="flex flex-[0_0_248px] flex-col gap-7 border-r border-rule px-3 py-5"
        >
          <div className="flex flex-col gap-2">
            <h2 className={railLabel}>Rooms</h2>
            <div className="flex flex-col gap-0.5">
              {snap.rooms.map((r) => {
                const n = roomClashes(snap, rules, r.id).length;
                const occ = roomOccupancy(snap, r.id);
                const on = r.id === room.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${r.name}, ${occ.seated} of ${occ.usable} seats${n ? `, ${n} ${n === 1 ? "clash" : "clashes"}` : ""}`}
                    onClick={() => c.chooseRoom(r.id)}
                    className={cx(
                      "flex min-h-14 w-full items-center justify-between gap-2 rounded-[3px] px-2 py-1.5 text-left",
                      on ? "bg-ink text-bg" : "text-ink",
                    )}
                  >
                    <span className="flex flex-col gap-[3px]">
                      <span className="text-[15px] leading-tight font-medium">
                        {r.name}
                      </span>
                      <span
                        className={cx(
                          "font-mono text-[12px] leading-tight",
                          on ? "text-rule" : "text-ink2",
                        )}
                      >
                        {occ.seated} of {occ.usable} seats
                      </span>
                    </span>
                    {n > 0 && (
                      <span
                        aria-hidden="true"
                        className={cx(
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold",
                          on
                            ? "bg-on-alert text-alert"
                            : "bg-alert text-on-alert",
                        )}
                      >
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className={railLabel}>Subjects</h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {[...c.subjects].map(([name, sInfo]) => (
                <li
                  key={name}
                  className="flex items-center gap-2.5 p-2 text-[14px]"
                >
                  <SubjectTile info={sInfo} size={24} />
                  <span className="min-w-0 flex-1">{name}</span>
                  <span className="font-mono text-[12px] text-ink2">
                    {bySubject.get(name) ?? 0} seated
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-rule p-2 text-[14px]">
              <span>Unseated</span>
              <span className="font-mono font-medium">{c.unplaced.length}</span>
            </div>
            {c.unplaced.length > 0 && (
              <Link
                href={routes.rooms(plan.id)}
                className="px-2 text-[13px] font-medium"
              >
                Add a room
              </Link>
            )}
          </div>
        </aside>

        {/* Grid */}
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-8 py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[24px] leading-tight font-semibold">
              {room.name}
            </h2>
            <p className="font-mono text-[13px] text-ink2" aria-live="polite">
              {roomMeta(room)} · {occupancy.usable} seats · {clashCount}{" "}
              {clashCount === 1 ? "clash" : "clashes"}
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragEnd={onDragEnd}
          >
            <div className="overflow-x-auto pb-1">
              <SeatGrid
                className="mx-auto w-max gap-2.5"
                grid={c.grid}
                disabled={c.disabled}
                seatsPerBench={room.seatsPerBench}
                subjects={c.subjects}
                cellSize={76}
                cellHeight={64}
                selected={selected}
                clashes={c.clashes}
                targets={c.targets}
                onSeatClick={c.onSeat}
                codeOf={c.codeOf}
                wrapSeat={(r, col, seat) => (
                  <DndSeat
                    id={seatKey(r, col)}
                    canDrag={!!c.grid[r][col] && !c.disabled.has(key([r, col]))}
                    canDrop={!c.disabled.has(key([r, col]))}
                  >
                    {seat}
                  </DndSeat>
                )}
              />
            </div>
          </DndContext>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-ink2">
            <span className="flex items-center gap-2">
              <span className="box-border h-3.5 w-[18px] rounded-sm border-[3px] border-alert" />
              Clash
            </span>
            <span className="flex items-center gap-2">
              <span className="box-border h-3.5 w-[18px] rounded-sm border-2 border-dashed border-accent" />
              Swap that helps
            </span>
            <span>Drag a seat onto another to swap.</span>
          </div>
          {c.notice && (
            <p className="text-center text-[13px] text-ink2" aria-live="polite">
              {c.notice}
            </p>
          )}
        </main>

        {/* Inspector */}
        <aside
          aria-label="Selected seat"
          className="flex max-w-[360px] flex-[1_1_300px] flex-col border-l border-rule bg-surface"
        >
          <h2 className="border-b border-rule px-5 py-4 font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
            Selected seat
          </h2>
          <div className="flex flex-col gap-6 p-5">
            {selected ? (
              <>
                <div className="flex items-center gap-3.5">
                  {selStudent && info ? (
                    <span className="flex-none">
                      <SubjectTileLarge info={info} />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="box-border h-11 w-11 flex-none rounded-[3px] border-[3px] border-accent"
                    />
                  )}
                  <div className="flex min-w-0 flex-col gap-[3px]">
                    <p className="text-[17px] leading-tight font-semibold">
                      {selStudent
                        ? `${c.codeOf(selStudent)} · ${selStudent.subject}`
                        : c.selUnusable
                          ? "Unusable seat"
                          : "Empty seat"}
                    </p>
                    <p className="text-[13px] text-ink2">
                      {selStudent && group ? `${group.label} · ` : ""}
                      {where}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[14px] leading-normal text-ink2">
                Select a seat to see who it clashes with and which swaps help.
                Or drag one seat onto another.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
                Clashes in this room
              </h3>
              {clashCount === 0 ? (
                <p className="border-t border-rule pt-2.5 text-[14px] text-ink2">
                  No clashes in this room.
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-col border-t border-rule p-0">
                  {c.clashList.map((cl) => {
                    const sa = c.grid[cl.a[0]][cl.a[1]];
                    return (
                      <li
                        key={`${key(cl.a)}-${key(cl.b)}`}
                        className="border-b border-rule"
                      >
                        <button
                          type="button"
                          onClick={() => c.setSelected(cl.a)}
                          className="w-full py-2.5 text-left text-[14px] leading-snug"
                        >
                          <strong className="font-semibold">
                            {codeAt(cl.a)}
                          </strong>{" "}
                          and{" "}
                          <strong className="font-semibold">
                            {codeAt(cl.b)}
                          </strong>
                          , {sa?.subject}. {clashPosition(cl.a, cl.b)}.
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {selected && selStudent && (
              <div className="flex flex-col gap-2">
                <h3 className="font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase">
                  Swap {c.codeOf(selStudent)} with
                </h3>
                {c.suggestions.length > 0 ? (
                  c.suggestions.slice(0, 5).map((s) => (
                    <button
                      key={key(s.seat)}
                      type="button"
                      onClick={() => {
                        c.trySwap(selected, s.seat);
                        c.clearSelection();
                      }}
                      className="flex min-h-14 flex-col gap-[3px] rounded-[3px] border-2 border-dashed border-accent bg-surface px-3 py-2 text-left"
                    >
                      <span className="text-[14px] font-medium">
                        {codeAt(s.seat)} · Row {s.seat[0] + 1}, seat{" "}
                        {s.seat[1] + 1}
                      </span>
                      <span className="text-[13px] text-ink3">
                        {suggestionEffect(clashCount, s.clashesAfter)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-[14px] leading-snug text-ink2">
                    {clashCount === 0
                      ? "Nothing to fix here. You can still swap by dragging."
                      : "No single swap clears these clashes. Try Rearrange this room."}
                  </p>
                )}
              </div>
            )}

            {c.error && (
              <p role="alert" className="text-[13px] font-medium text-alert">
                {c.error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {selected && selStudent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-ink"
                  disabled={
                    bestEmptySeat(snap, rules, room.id, selected) === null
                  }
                  onClick={c.moveToEmpty}
                >
                  Move to empty seat
                </Button>
              )}
              {selected && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-ink"
                  onClick={c.toggleUsable}
                >
                  {c.selUnusable ? "Make seat usable" : "Mark seat unusable"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-ink"
                onClick={() => c.setConfirmRearrange(true)}
              >
                Rearrange this room
              </Button>
              {selected && (
                <Button variant="text" onClick={c.clearSelection}>
                  Clear selection
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

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

/** 44px selected tile for the inspector. */
function SubjectTileLarge({
  info,
}: {
  info: { letter: string; tint: 1 | 2 | 3 };
}) {
  return (
    <span
      aria-hidden="true"
      style={{ background: `var(--tint-${info.tint})` }}
      className="box-border flex h-11 w-11 items-center justify-center rounded-[3px] border-[3px] border-accent text-[16px] font-semibold text-ink"
    >
      {info.letter}
    </span>
  );
}
