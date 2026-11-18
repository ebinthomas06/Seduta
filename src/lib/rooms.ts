import type { SavedRoom } from "@/lib/db/types";
import type { Room } from "@/lib/seating/seating";

export const MAX_ROWS = 20;
export const MAX_BENCHES = 8;

export const totalSeats = (room: Pick<Room, "rows" | "cols">) =>
  room.rows * room.cols;

/** Seats that can actually be used: every seat minus the disabled ones inside the grid. */
export function usableSeats(
  room: Pick<Room, "rows" | "cols" | "disabled">,
): number {
  const inside = new Set(clampDisabled(room.disabled, room.rows, room.cols));
  return totalSeats(room) - inside.size;
}

export const benchCount = (room: Pick<Room, "cols" | "seatsPerBench">) =>
  Math.round(room.cols / room.seatsPerBench);

/** "6 rows · 3 benches of 2" */
export function roomMeta(
  room: Pick<Room, "rows" | "cols" | "seatsPerBench">,
): string {
  const rows = `${room.rows} ${room.rows === 1 ? "row" : "rows"}`;
  const benches = benchCount(room);
  return `${rows} · ${benches} ${benches === 1 ? "bench" : "benches"} of ${room.seatsPerBench}`;
}

export function roomsCapacity(rooms: Room[]): number {
  return rooms.reduce((sum, r) => sum + usableSeats(r), 0);
}

/** Drops disabled seats that no longer exist after the grid shrinks. */
export function clampDisabled(
  disabled: string[],
  rows: number,
  cols: number,
): string[] {
  return disabled.filter((key) => {
    const [r, c] = key.split(",").map(Number);
    return r >= 0 && r < rows && c >= 0 && c < cols;
  });
}

export function toggleDisabled(disabled: string[], key: string): string[] {
  return disabled.includes(key)
    ? disabled.filter((k) => k !== key)
    : [...disabled, key];
}

export function newRoom(name: string): Room {
  return {
    id: crypto.randomUUID(),
    name,
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  };
}

/** A plan's own copy of a library room: new id, arrays not shared. */
export function roomFromSaved(saved: SavedRoom): Room {
  return {
    id: crypto.randomUUID(),
    name: saved.name,
    rows: saved.rows,
    cols: saved.cols,
    seatsPerBench: saved.seatsPerBench,
    disabled: [...saved.disabled],
  };
}

/** A library copy of a plan's room. */
export function savedFromRoom(room: Room): SavedRoom {
  return {
    id: crypto.randomUUID(),
    name: room.name,
    rows: room.rows,
    cols: room.cols,
    seatsPerBench: room.seatsPerBench,
    disabled: [...room.disabled],
  };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function validateRoom(room: Room): string | null {
  if (!room.name.trim()) return "Enter a room name.";
  if (usableSeats(room) < 1) return "At least one seat must be usable.";
  return null;
}
