"use client";

import Link from "next/link";
import { useState } from "react";
import { SavedRoomsSheet } from "@/components/rooms/SavedRoomsSheet";
import { StepScreen } from "@/components/plan/StepScreen";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/Icons";
import { updatePlanInputs } from "@/lib/db/plans";
import type { Plan } from "@/lib/db/types";
import { usePlan } from "@/lib/db/usePlan";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { Workspace } from "@/components/workspace/Workspace";
import { studentCount } from "@/lib/plan-utils";
import { moveItem, roomMeta, roomsCapacity, usableSeats } from "@/lib/rooms";
import type { Room } from "@/lib/seating/seating";
import { routes } from "@/lib/routes";
import { usePlanId } from "@/lib/useRouteParams";

export function RoomsScreen() {
  const id = usePlanId();
  const plan = usePlan(id);
  const desktop = useIsDesktop();

  if (plan === undefined) return null;
  if (plan === null) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
        <h1 className="text-[24px] font-semibold">Plan not found</h1>
        <Link href="/" className="text-[15px] font-medium">
          Back to saved plans
        </Link>
      </div>
    );
  }
  return desktop ? <Workspace plan={plan} /> : <RoomsList plan={plan} />;
}

/** Tiny seat map: filled square = usable, hollow = unusable. */
function MiniMap({ room }: { room: Room }) {
  const dot = Math.max(
    2,
    Math.min(6, Math.floor((52 - (room.cols - 1) * 2) / room.cols)),
  );
  const off = new Set(room.disabled);
  return (
    <div
      aria-hidden="true"
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${room.cols}, ${dot}px)` }}
    >
      {Array.from({ length: room.rows * room.cols }, (_, i) => {
        const key = `${Math.floor(i / room.cols)},${i % room.cols}`;
        return (
          <div
            key={i}
            style={{ width: dot, height: dot }}
            className={
              off.has(key) ? "box-border border border-ink2" : "bg-ink"
            }
          />
        );
      })}
    </div>
  );
}

function RoomsList({ plan }: { plan: Plan }) {
  const [reordering, setReordering] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const seats = roomsCapacity(plan.rooms);
  const students = studentCount(plan);

  const move = (from: number, to: number) =>
    updatePlanInputs(plan.id, { rooms: moveItem(plan.rooms, from, to) });

  async function addSaved(room: Room) {
    await updatePlanInputs(plan.id, { rooms: [...plan.rooms, room] });
    setLibraryOpen(false);
  }

  return (
    <StepScreen
      step={3}
      stepName="Rooms"
      backHref={routes.groups(plan.id)}
      backLabel="Back to groups"
      footer={
        <BottomBar>
          <div className="flex justify-between font-mono text-[12px] font-medium tracking-[.04em] text-ink2">
            <span>{seats} seats</span>
            <span>{students} students</span>
          </div>
          <Button href={routes.review(plan.id)}>Next: Review</Button>
        </BottomBar>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[24px] leading-tight font-semibold">
          Where are they writing?
        </h2>
        <p className="text-[14px] leading-snug text-ink2">
          Rooms fill in the order shown. Tap a room to change its layout.
        </p>
      </div>

      {plan.rooms.length > 0 && (
        <div className="flex flex-col gap-1">
          {plan.rooms.length > 1 && (
            <button
              type="button"
              aria-pressed={reordering}
              onClick={() => setReordering((v) => !v)}
              className="-mb-2 self-end text-[14px] font-medium text-accent"
              style={{ minHeight: 44 }}
            >
              {reordering ? "Done" : "Reorder"}
            </button>
          )}
          <ul className="m-0 flex list-none flex-col border-t border-ink p-0">
            {plan.rooms.map((r, i) => {
              const content = (
                <>
                  <span className="flex w-[52px] flex-none justify-center">
                    <MiniMap room={r} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[17px] leading-tight font-medium">
                      {r.name}
                    </span>
                    <span className="font-mono text-[13px] leading-snug text-ink2">
                      {roomMeta(r)}
                    </span>
                  </span>
                  <span className="flex-none text-right">
                    <span className="block font-mono text-[20px] leading-tight font-medium">
                      {usableSeats(r)}
                    </span>
                    <span className="block font-mono text-[12px] text-ink2">
                      seats
                    </span>
                  </span>
                </>
              );
              return (
                <li
                  key={r.id}
                  className="flex min-h-20 items-center border-b border-rule"
                >
                  {reordering ? (
                    <div className="flex min-w-0 flex-1 items-center gap-4 py-2.5">
                      {content}
                    </div>
                  ) : (
                    <Link
                      href={routes.room(plan.id, r.id)}
                      className="flex min-w-0 flex-1 items-center gap-4 py-2.5 text-ink no-underline"
                    >
                      {content}
                    </Link>
                  )}
                  {reordering && (
                    <div className="flex flex-none">
                      <button
                        type="button"
                        aria-label={`Move ${r.name} up`}
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        className="h-11 w-11 text-[18px] disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${r.name} down`}
                        disabled={i === plan.rooms.length - 1}
                        onClick={() => move(i, i + 1)}
                        className="h-11 w-11 text-[18px] disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          href={routes.room(plan.id, "new")}
          variant="dashed"
          className="h-13 flex-1 text-[15px]"
        >
          <PlusIcon size={18} /> New room
        </Button>
        <Button
          variant="outline"
          className="h-13 flex-1 text-[15px]"
          onClick={() => setLibraryOpen(true)}
        >
          From saved rooms
        </Button>
      </div>

      <SavedRoomsSheet
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={addSaved}
      />
    </StepScreen>
  );
}
