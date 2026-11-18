"use client";

import { useState } from "react";
import { SavedRoomsSheet } from "@/components/rooms/SavedRoomsSheet";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";
import { cx } from "@/lib/cx";
import { mutatePlanInputs } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import {
  MAX_BENCHES,
  MAX_ROWS,
  benchCount,
  clampDisabled,
  moveItem,
  newRoom,
  usableSeats,
} from "@/lib/rooms";
import type { Room } from "@/lib/seating/seating";
import { fieldLabelClass, SectionHeading } from "./SectionHeading";
import { routes } from "@/lib/routes";

const GRID =
  "grid grid-cols-[minmax(0,1.5fr)_minmax(0,.6fr)_minmax(0,.8fr)_minmax(0,.9fr)_minmax(0,.9fr)_minmax(0,.6fr)_110px_88px] gap-2.5";

const input =
  "h-11 w-full rounded-[3px] border border-rule2 bg-surface px-2.5 text-ink";

export function RoomsTable({ plan }: { plan: Plan }) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  const changeRoom = (id: string, patch: Partial<Room>) =>
    void mutatePlanInputs(plan.id, (p) => ({
      rooms: p.rooms.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        return {
          ...next,
          disabled: clampDisabled(next.disabled, next.rows, next.cols),
        };
      }),
    }));

  const move = (from: number, to: number) =>
    void mutatePlanInputs(plan.id, (p) => ({
      rooms: moveItem(p.rooms, from, to),
    }));

  const add = (room: Room) =>
    void mutatePlanInputs(plan.id, (p) => ({ rooms: [...p.rooms, room] }));

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        number="03"
        title="Rooms"
        note="Filled in the order shown."
      />
      <div className="overflow-x-auto">
        <div className="flex min-w-[820px] flex-col gap-2">
          <div className={cx(GRID, fieldLabelClass)}>
            <div>Name</div>
            <div>Rows</div>
            <div>Benches</div>
            <div>Seats per bench</div>
            <div>Unusable</div>
            <div>Seats</div>
            <div />
            <div />
          </div>
          {plan.rooms.map((r, i) => (
            <RoomRow
              key={r.id}
              room={r}
              planId={plan.id}
              isFirst={i === 0}
              isLast={i === plan.rooms.length - 1}
              onChange={changeRoom}
              onMove={(dir) => move(i, i + dir)}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="dashed"
          size="sm"
          onClick={() => add(newRoom(`Room ${plan.rooms.length + 1}`))}
        >
          <PlusIcon size={16} /> New room
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLibraryOpen(true)}
        >
          From saved rooms
        </Button>
      </div>
      <SavedRoomsSheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={(room) => {
          add(room);
          setLibraryOpen(false);
        }}
      />
    </section>
  );
}

function RoomRow({
  room,
  planId,
  isFirst,
  isLast,
  onChange,
  onMove,
}: {
  room: Room;
  planId: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (id: string, patch: Partial<Room>) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [name, setName] = useState(room.name);
  const [rows, setRows] = useState(String(room.rows));
  const [benches, setBenches] = useState(String(benchCount(room)));
  const [per, setPer] = useState(String(room.seatsPerBench));

  const num = (s: string, min: number, max: number) =>
    /^\d+$/.test(s) && Number(s) >= min && Number(s) <= max ? Number(s) : null;
  const bad = (s: string, min: number, max: number) =>
    num(s, min, max) === null;

  /** Commit rows/benches/seats-per-bench together once all three are valid. */
  function commitShape(next: { rows: string; benches: string; per: string }) {
    const r = num(next.rows, 1, MAX_ROWS);
    const b = num(next.benches, 1, MAX_BENCHES);
    const p = num(next.per, 1, 3);
    if (r && b && p)
      onChange(room.id, { rows: r, cols: b * p, seatsPerBench: p });
  }

  const unusable = room.rows * room.cols - usableSeats(room);
  const field = (invalid: boolean) =>
    cx(input, "font-mono text-[14px]", invalid && "border-2 border-alert");

  return (
    <div className={cx(GRID, "items-center")}>
      <input
        aria-label={`Room name, ${room.name}`}
        aria-invalid={!name.trim() || undefined}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (e.target.value.trim())
            onChange(room.id, { name: e.target.value.trim() });
        }}
        className={cx(
          input,
          "text-[15px]",
          !name.trim() && "border-2 border-alert",
        )}
      />
      <input
        aria-label={`Rows, ${room.name}`}
        aria-invalid={bad(rows, 1, MAX_ROWS) || undefined}
        inputMode="numeric"
        value={rows}
        onChange={(e) => {
          setRows(e.target.value);
          commitShape({ rows: e.target.value, benches, per });
        }}
        className={field(bad(rows, 1, MAX_ROWS))}
      />
      <input
        aria-label={`Benches per row, ${room.name}`}
        aria-invalid={bad(benches, 1, MAX_BENCHES) || undefined}
        inputMode="numeric"
        value={benches}
        onChange={(e) => {
          setBenches(e.target.value);
          commitShape({ rows, benches: e.target.value, per });
        }}
        className={field(bad(benches, 1, MAX_BENCHES))}
      />
      <input
        aria-label={`Seats per bench, ${room.name}`}
        aria-invalid={bad(per, 1, 3) || undefined}
        inputMode="numeric"
        value={per}
        onChange={(e) => {
          setPer(e.target.value);
          commitShape({ rows, benches, per: e.target.value });
        }}
        className={field(bad(per, 1, 3))}
      />
      <div className="font-mono text-[15px]">{unusable}</div>
      <div className="font-mono text-[15px] font-medium">
        {usableSeats(room)}
      </div>
      <Button
        href={routes.room(planId, room.id)}
        variant="outline"
        size="sm"
        aria-label={`Edit seats, ${room.name}`}
        className="px-2"
      >
        Edit seats
      </Button>
      <div className="flex">
        <button
          type="button"
          aria-label={`Move ${room.name} up`}
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className="h-11 w-11 text-[18px] text-ink2 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`Move ${room.name} down`}
          disabled={isLast}
          onClick={() => onMove(1)}
          className="h-11 w-11 text-[18px] text-ink2 disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
