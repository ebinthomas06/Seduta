"use client";

import type { Plan } from "@/lib/db/types";
import type { Snapshot } from "@/lib/editor/ops";
import type { PaperSize } from "@/lib/export/pdf";
import { buildRoomSummary } from "@/lib/export/summary";

/** An HTML picture of the first page of the Word table. Always a white page. */
export function WordPagePreview({
  plan,
  snap,
  paper,
}: {
  plan: Plan;
  snap: Snapshot;
  paper: PaperSize;
}) {
  const summary = buildRoomSummary(snap.rooms, snap.layout, plan.groups);
  const first = summary.sections[0];
  if (!first) return null;
  const aspect = paper === "a4" ? "300 / 424" : "300 / 388";

  return (
    <figure className="m-0 flex flex-col gap-2.5">
      <div
        aria-hidden="true"
        style={{ aspectRatio: aspect }}
        className="box-border flex w-[300px] flex-col gap-3.5 overflow-hidden border border-[#8E887A] bg-white px-[18px] py-6 text-[#1B1F2A]"
      >
        <div className="truncate text-[14px] leading-tight font-semibold">
          {plan.name} · Room allocation
        </div>
        <div className="border border-[#1B1F2A] text-[10px] leading-snug">
          <div className="grid grid-cols-[44px_74px_1fr_30px] gap-1.5 border-b border-[#1B1F2A] bg-[#ECE8DD] p-1.5 font-mono text-[9px] font-medium uppercase">
            <span>Room</span>
            <span>Group</span>
            <span>Roll numbers</span>
            <span className="text-right">No.</span>
          </div>
          {first.rows.map((row, i) => (
            <div
              key={row.group}
              className="grid grid-cols-[44px_74px_1fr_30px] gap-1.5 border-b border-[#CFC9BB] px-1.5 py-[7px]"
            >
              <span className="truncate font-semibold">
                {i === 0 ? first.room : ""}
              </span>
              <span className="truncate">{row.group}</span>
              <span className="font-mono text-[9px] leading-snug break-words">
                {row.rolls}
              </span>
              <span className="text-right font-mono">{row.count}</span>
            </div>
          ))}
          <div className="grid grid-cols-[44px_74px_1fr_30px] gap-1.5 bg-[#F7F5F0] px-1.5 py-[7px]">
            <span />
            <span className="font-medium">{first.room} total</span>
            <span />
            <span className="text-right font-mono font-medium">
              {first.total}
            </span>
          </div>
          <div className="flex flex-col gap-[9px] p-2.5">
            {[70, 55, 64].map((w) => (
              <div
                key={w}
                style={{ width: `${w}%` }}
                className="h-1.5 bg-[#DAD5C8]"
              />
            ))}
          </div>
        </div>
      </div>
      <figcaption className="text-center font-mono text-[12px] font-medium tracking-[.04em] text-ink2">
        Word · page 1
      </figcaption>
    </figure>
  );
}
