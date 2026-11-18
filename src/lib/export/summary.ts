import {
  formatRoll,
  type Group,
  type Layout,
  type Room,
} from "@/lib/seating/seating";

export interface SummaryRow {
  /** "2nd yr · CSE" */
  group: string;
  subject: string;
  /** "24CS001–24CS012, 24CS014–24CS025" */
  rolls: string;
  count: number;
}

export interface RoomSection {
  room: string;
  rows: SummaryRow[];
  total: number;
}

export interface RoomSummary {
  sections: RoomSection[];
  grandTotal: number;
}

/** Consecutive numbers collapse into [from, to] runs: [1,2,3,5] -> [[1,3],[5,5]]. */
export function toRuns(numbers: number[]): [number, number][] {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const n of sorted) {
    const last = runs[runs.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  return runs;
}

/** "24CS001–24CS012, 24CS014" using the group's prefix and zero padding. */
export function formatRuns(runs: [number, number][], group: Group): string {
  const f = (n: number) => formatRoll(group.prefix, n, group.pad);
  return runs.map(([a, b]) => (a === b ? f(a) : `${f(a)}–${f(b)}`)).join(", ");
}

/** For each room, which roll number ranges of each group sit in it. Feeds the Word table. */
export function buildRoomSummary(
  rooms: Room[],
  layout: Layout,
  groups: Group[],
): RoomSummary {
  let grandTotal = 0;
  const sections = rooms.map((room) => {
    const rollsByGroup = new Map<string, number[]>();
    for (const row of layout[room.id] ?? [])
      for (const s of row)
        if (s)
          rollsByGroup.set(s.groupId, [
            ...(rollsByGroup.get(s.groupId) ?? []),
            s.roll,
          ]);

    const rows: SummaryRow[] = groups
      .filter((g) => rollsByGroup.has(g.id))
      .map((g) => {
        const rolls = rollsByGroup.get(g.id)!;
        return {
          group: g.label,
          subject: g.subject,
          rolls: formatRuns(toRuns(rolls), g),
          count: rolls.length,
        };
      });
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    grandTotal += total;
    return { room: room.name, rows, total };
  });
  return { sections, grandTotal };
}
