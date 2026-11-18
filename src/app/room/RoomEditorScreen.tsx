"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SeatGrid } from "@/components/ui/SeatGrid";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/Stepper";
import { TextField, monoLabelClass } from "@/components/ui/TextField";
import { TopBar } from "@/components/ui/TopBar";
import { updatePlanInputs } from "@/lib/db/plans";
import { saveRoomToLibrary } from "@/lib/db/savedRooms";
import type { Plan } from "@/lib/db/types";
import { usePlan } from "@/lib/db/usePlan";
import {
  MAX_BENCHES,
  MAX_ROWS,
  benchCount,
  clampDisabled,
  newRoom,
  toggleDisabled,
  usableSeats,
  validateRoom,
} from "@/lib/rooms";
import type { Room } from "@/lib/seating/seating";
import { routes } from "@/lib/routes";
import { usePlanId, useRoomId } from "@/lib/useRouteParams";

export function RoomEditorScreen() {
  const id = usePlanId();
  const roomId = useRoomId();
  const plan = usePlan(id);

  if (plan === undefined) return null;
  const existing = plan?.rooms.find((r) => r.id === roomId);
  if (plan === null || (roomId !== "new" && !existing)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start gap-3 px-4 pt-10">
        <h1 className="text-[24px] font-semibold">Room not found</h1>
        <Link
          href={plan ? routes.rooms(plan.id) : routes.home}
          className="text-[15px] font-medium"
        >
          Back
        </Link>
      </div>
    );
  }
  return (
    <RoomEditor
      key={existing?.id ?? "new"}
      plan={plan}
      room={existing ?? newRoom(`Room ${plan.rooms.length + 1}`)}
      isNew={!existing}
    />
  );
}

type SeatsPerBench = "1" | "2" | "3";

function RoomEditor({
  plan,
  room: initial,
  isNew,
}: {
  plan: Plan;
  room: Room;
  isNew: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [rows, setRows] = useState(initial.rows);
  const [benches, setBenches] = useState(benchCount(initial));
  const [spb, setSpb] = useState<SeatsPerBench>(
    String(initial.seatsPerBench) as SeatsPerBench,
  );
  const [disabled, setDisabled] = useState(initial.disabled);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const seatsPerBench = Number(spb);
  const cols = benches * seatsPerBench;
  const liveDisabled = useMemo(
    () => clampDisabled(disabled, rows, cols),
    [disabled, rows, cols],
  );
  const draft: Room = {
    id: initial.id,
    name,
    rows,
    cols,
    seatsPerBench,
    disabled: liveDisabled,
  };
  const grid = useMemo(
    () => Array.from({ length: rows }, () => Array<null>(cols).fill(null)),
    [rows, cols],
  );
  const disabledSet = useMemo(() => new Set(liveDisabled), [liveDisabled]);
  const roomsHref = routes.rooms(plan.id);

  async function save() {
    const problem = validateRoom(draft);
    setError(problem);
    if (problem) return;
    const finalRoom = { ...draft, name: name.trim() };
    const rooms = isNew
      ? [...plan.rooms, finalRoom]
      : plan.rooms.map((r) => (r.id === finalRoom.id ? finalRoom : r));
    await updatePlanInputs(plan.id, { rooms });
    router.push(roomsHref);
  }

  async function remove() {
    await updatePlanInputs(plan.id, {
      rooms: plan.rooms.filter((r) => r.id !== initial.id),
    });
    router.push(roomsHref);
  }

  async function saveToLibrary() {
    const problem = validateRoom(draft);
    setError(problem);
    if (problem) return;
    await saveRoomToLibrary({ ...draft, name: name.trim() });
    setSavedNote(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <TopBar
        title={isNew ? "New room" : "Edit room"}
        backHref={roomsHref}
        backLabel="Back to rooms"
      />

      <main className="flex flex-1 flex-col gap-5 px-4 pt-5 pb-6">
        <TextField
          label="Room name"
          value={name}
          error={error?.includes("name") ? error : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setSavedNote(false);
          }}
        />

        <div className="flex flex-col border-t border-ink">
          <Stepper
            label="Rows"
            value={rows}
            min={1}
            max={MAX_ROWS}
            onChange={setRows}
          />
          <Stepper
            label="Benches per row"
            value={benches}
            min={1}
            max={MAX_BENCHES}
            onChange={setBenches}
          />
          <div className="flex min-h-14 items-center justify-between border-b border-rule">
            <span className="text-[16px]" aria-hidden="true">
              Seats per bench
            </span>
            <SegmentedControl<SeatsPerBench>
              legend="Seats per bench"
              size="sm"
              mono
              value={spb}
              onChange={setSpb}
              options={[
                { value: "1", label: "1", ariaLabel: "1 seat per bench" },
                { value: "2", label: "2", ariaLabel: "2 seats per bench" },
                { value: "3", label: "3", ariaLabel: "3 seats per bench" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className={monoLabelClass}>
              Tap seats that can&apos;t be used
            </span>
            <span
              className="font-mono text-[12px] font-medium text-ink2"
              aria-live="polite"
            >
              {usableSeats(draft)} usable
            </span>
          </div>
          <div className="overflow-x-auto pb-1">
            <SeatGrid
              className="mx-auto w-max"
              grid={grid}
              disabled={disabledSet}
              seatsPerBench={seatsPerBench}
              subjects={new Map()}
              cellSize={48}
              cellHeight={44}
              onSeatClick={(r, c) => {
                setDisabled(toggleDisabled(liveDisabled, `${r},${c}`));
                setSavedNote(false);
              }}
            />
          </div>
          {error && !error.includes("name") && (
            <p role="alert" className="text-[13px] font-medium text-alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" size="md" onClick={saveToLibrary}>
            Save to my rooms
          </Button>
          <p className="text-[13px] leading-snug text-ink2" aria-live="polite">
            {savedNote
              ? "Saved. You can add it to any plan with “From saved rooms”."
              : "Keep this layout to reuse it in other plans."}
          </p>
        </div>
      </main>

      <div className="sticky bottom-0 bg-bg">
        <BottomBar row>
          {!isNew && (
            <Button
              variant="danger"
              size="md"
              className="h-13 flex-1 text-[15px]"
              onClick={() => setConfirmDelete(true)}
            >
              Delete room
            </Button>
          )}
          <Button className={isNew ? "flex-1" : "flex-[2]"} onClick={save}>
            Save room
          </Button>
        </BottomBar>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this room?"
        message={`${initial.name} will be removed from this plan.`}
        confirmLabel="Delete room"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
}
