import {
  findConflicts,
  rearrangeRoom,
  swap,
  type Group,
  type Layout,
  type Room,
  type Rules,
  type Student,
} from "@/lib/seating/seating";

/** Everything the editor changes: who sits where, and which seats are unusable. */
export interface Snapshot {
  layout: Layout;
  rooms: Room[];
}

export type Seat = [number, number];
export const key = (s: Seat) => `${s[0]},${s[1]}`;

const roomOf = (snap: Snapshot, roomId: string) =>
  snap.rooms.find((r) => r.id === roomId);

/* ───────────────────────── Clashes ───────────────────────── */

export function roomClashes(snap: Snapshot, rules: Rules, roomId: string) {
  const room = roomOf(snap, roomId);
  if (!room || !snap.layout[roomId]) return [];
  return findConflicts(snap.layout, [room], rules);
}

/** Seats ("row,col") that clash with a neighbour. */
export function clashSeats(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
): Set<string> {
  const set = new Set<string>();
  for (const c of roomClashes(snap, rules, roomId)) {
    set.add(key(c.a));
    set.add(key(c.b));
  }
  return set;
}

export type Direction =
  | "beside"
  | "in front"
  | "behind"
  | "diagonally in front"
  | "diagonally behind";

export interface ClashNeighbour {
  seat: Seat;
  student: Student;
  where: Direction;
}

/** Row 1 is nearest the board, so a lower row number is in front. */
function direction(from: Seat, to: Seat): Direction {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  if (dr === 0) return "beside";
  if (dc === 0) return dr < 0 ? "in front" : "behind";
  return dr < 0 ? "diagonally in front" : "diagonally behind";
}

/** The neighbours a seat clashes with, for the "Clashes with EC07 in the seat behind" message. */
export function clashNeighbours(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
  seat: Seat,
): ClashNeighbour[] {
  const grid = snap.layout[roomId];
  const me = grid?.[seat[0]]?.[seat[1]];
  if (!me) return [];
  const out: ClashNeighbour[] = [];
  for (const c of roomClashes(snap, rules, roomId)) {
    const other =
      key(c.a) === key(seat) ? c.b : key(c.b) === key(seat) ? c.a : null;
    if (!other) continue;
    const student = grid[other[0]][other[1]];
    if (student)
      out.push({ seat: other, student, where: direction(seat, other) });
  }
  return out;
}

/** Short seat code for the grid: group letters without the year, plus the roll ("24EC" + 5 -> "EC05"). */
export function shortCode(student: Student, groups: Group[]): string {
  const g = groups.find((x) => x.id === student.groupId);
  const letters = (g?.prefix ?? "").replace(/^\d+/, "");
  return letters + String(student.roll).padStart(letters ? 2 : 0, "0");
}

/* ───────────────────────── Edits (all pure) ───────────────────────── */

export function swapSeats(
  snap: Snapshot,
  roomId: string,
  a: Seat,
  b: Seat,
): Snapshot {
  return { ...snap, layout: swap(snap.layout, roomId, a, b) };
}

/**
 * The empty usable seat where `seat`'s student would cause the fewest clashes
 * (nearest first on ties). Null when the room has no empty seat.
 */
export function bestEmptySeat(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
  seat: Seat,
): Seat | null {
  const room = roomOf(snap, roomId);
  const grid = snap.layout[roomId];
  if (!room || !grid?.[seat[0]]?.[seat[1]]) return null;
  const disabled = new Set(room.disabled);
  let best: { seat: Seat; clashes: number; dist: number } | null = null;
  for (let r = 0; r < room.rows; r++)
    for (let c = 0; c < room.cols; c++) {
      if (grid[r][c] || disabled.has(`${r},${c}`)) continue;
      const moved = swapSeats(snap, roomId, seat, [r, c]);
      const clashes = roomClashes(moved, rules, roomId).length;
      const dist = Math.abs(r - seat[0]) + Math.abs(c - seat[1]);
      if (
        !best ||
        clashes < best.clashes ||
        (clashes === best.clashes && dist < best.dist)
      )
        best = { seat: [r, c], clashes, dist };
    }
  return best?.seat ?? null;
}

export function moveToBestEmpty(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
  seat: Seat,
): Snapshot | null {
  const target = bestEmptySeat(snap, rules, roomId, seat);
  return target ? swapSeats(snap, roomId, seat, target) : null;
}

export type UsableResult =
  { ok: true; snapshot: Snapshot } | { ok: false; error: string };

/** Marks a seat unusable (moving its student to an empty seat first) or usable again. */
export function setSeatUsable(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
  seat: Seat,
  usable: boolean,
): UsableResult {
  const room = roomOf(snap, roomId);
  if (!room) return { ok: false, error: "Room not found." };
  const k = key(seat);
  let working = snap;

  if (usable) {
    const disabled = room.disabled.filter((d) => d !== k);
    return { ok: true, snapshot: withDisabled(working, roomId, disabled) };
  }

  if (snap.layout[roomId][seat[0]][seat[1]]) {
    const moved = moveToBestEmpty(snap, rules, roomId, seat);
    if (!moved)
      return {
        ok: false,
        error: "There is no empty seat to move this student to.",
      };
    working = moved;
  }
  const disabled = room.disabled.includes(k)
    ? room.disabled
    : [...room.disabled, k];
  return { ok: true, snapshot: withDisabled(working, roomId, disabled) };
}

function withDisabled(
  snap: Snapshot,
  roomId: string,
  disabled: string[],
): Snapshot {
  return {
    ...snap,
    rooms: snap.rooms.map((r) => (r.id === roomId ? { ...r, disabled } : r)),
  };
}

/** Re-runs the engine for one room. Null if it can't seat everyone there. */
export function rearrange(
  snap: Snapshot,
  rules: Rules,
  roomId: string,
): Snapshot | null {
  const layout = rearrangeRoom(snap.layout, snap.rooms, rules, roomId);
  return layout ? { ...snap, layout } : null;
}
