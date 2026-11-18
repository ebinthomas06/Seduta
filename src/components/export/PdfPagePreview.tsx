"use client";

import { SeatGrid } from "@/components/ui/SeatGrid";
import type { Plan } from "@/lib/db/types";
import type { Snapshot } from "@/lib/editor/ops";
import type { PaperSize } from "@/lib/export/pdf";
import { distinctSubjects } from "@/lib/groups";
import { usableSeats } from "@/lib/rooms";
import { buildSubjectMap } from "@/lib/subjects";

/** Printed pages are white in both themes, so the preview pins the light palette. */
const lightVars = {
  "--ink": "#1B1F2A",
  "--ink2": "#5A5F6B",
  "--ink3": "#3A3F4B",
  "--rule": "#CFC9BB",
  "--rule2": "#8E887A",
  "--surface": "#FBFAF6",
  "--tint-1": "#DDE4F3",
  "--tint-2": "#EFD3A0",
  "--tint-3": "#BFC8B8",
  "--alert": "#B3401E",
} as React.CSSProperties;

/** An HTML picture of page 1 of the PDF (the first room), scaled to the chosen paper. */
export function PdfPagePreview({
  plan,
  snap,
  paper,
}: {
  plan: Plan;
  snap: Snapshot;
  paper: PaperSize;
}) {
  const room = snap.rooms[0];
  if (!room) return null;
  const grid = snap.layout[room.id] ?? [];
  const subjects = buildSubjectMap(distinctSubjects(plan.groups));
  const seated = grid.flat().filter(Boolean).length;
  const total = snap.rooms.length;
  const aspect = paper === "a4" ? "300 / 424" : "300 / 388";

  return (
    <figure className="m-0 flex flex-col gap-2.5">
      <div
        aria-hidden="true"
        style={{ ...lightVars, aspectRatio: aspect }}
        className="box-border flex w-[300px] flex-col items-center gap-2.5 border border-[#8E887A] bg-white px-5 py-6 text-[#1B1F2A]"
      >
        <div className="flex w-full justify-between font-mono text-[10px] text-[#5A5F6B]">
          <span className="truncate">{plan.name}</span>
          <span className="flex-none pl-2">
            {total} {total === 1 ? "room" : "rooms"}
          </span>
        </div>
        <div className="w-full text-[22px] leading-tight font-semibold">
          {room.name}
        </div>
        <div className="w-full font-mono text-[11px] text-[#5A5F6B]">
          {room.rows} {room.rows === 1 ? "row" : "rows"} · {usableSeats(room)}{" "}
          seats · {seated} students
        </div>
        <SeatGrid
          className="mt-1.5"
          grid={grid}
          disabled={new Set(room.disabled)}
          seatsPerBench={room.seatsPerBench}
          subjects={subjects}
          cellSize={Math.max(
            14,
            Math.min(28, Math.floor(250 / (room.cols + 1))),
          )}
        />
        <div className="mt-auto flex w-full justify-between gap-2 font-mono text-[10px] text-[#5A5F6B]">
          <span className="truncate">
            {[...subjects].map(([n, i]) => `${i.letter} ${n}`).join(" · ")}
          </span>
          <span className="flex-none">1 / {total}</span>
        </div>
      </div>
      <figcaption className="text-center font-mono text-[12px] font-medium tracking-[.04em] text-ink2">
        PDF · page 1 of {total}
      </figcaption>
    </figure>
  );
}
