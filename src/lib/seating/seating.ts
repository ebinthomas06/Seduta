// seating.ts — data model + placement algorithm for the exam seating app.
// Pure functions, no UI, no dependencies. Works for schools and colleges alike.

/* ───────────────────────── Data model ───────────────────────── */

/** A batch of students sharing one exam subject. School: "8-B". College: "2nd yr CSE". */
export interface Group {
  id: string;
  label: string; // shown to the user
  subject: string; // exam subject; conflicts are decided on this
  prefix?: string; // e.g. "KTE24CS" -> KTE24CS001
  from: number; // first roll number
  to: number; // last roll number (inclusive)
  exclude?: number[]; // absentees / numbers that don't exist
  pad?: number; // zero-pad width, e.g. 3 -> 001
  // UI metadata so a group can be edited again. The engine never reads these.
  primary?: string; // "2nd year" / "Class 8"
  secondary?: string; // "CSE" / "B"
}

/** A classroom as a grid of seats. Benches are a rendering concern: seatsPerBench just groups columns visually. */
export interface Room {
  id: string;
  name: string;
  rows: number;
  cols: number; // total seat columns (benches * seatsPerBench)
  seatsPerBench: number; // 1 for single desks, 2-3 for school benches
  disabled: string[]; // broken/unusable seats, as "row,col"
}

export interface Rules {
  frontBack: boolean; // students in the same column, adjacent rows
  diagonal: boolean; // diagonal neighbours
}

export interface Student {
  groupId: string;
  subject: string;
  roll: number;
  label: string; // formatted roll number
}

/** layout[roomId][row][col] -> student, or null for empty / disabled seat */
export type Layout = Record<string, (Student | null)[][]>;

export interface Result {
  layout: Layout;
  unplaced: Student[]; // couldn't be seated (not enough rooms, or constraints too tight)
  warnings: string[];
}

/* ───────────────────────── Helpers ───────────────────────── */

/** Formats a roll number: prefix + zero-padded number, e.g. ("KTE24CS", 7, 3) -> "KTE24CS007". */
export function formatRoll(
  prefix: string | undefined,
  n: number,
  pad?: number,
): string {
  const num = pad ? String(n).padStart(pad, "0") : String(n);
  return (prefix ?? "") + num;
}

/**
 * Parses a skip list such as "13, 44, 50-52" into sorted unique numbers [13, 44, 50, 51, 52].
 * Accepts commas, spaces or semicolons as separators and "-", "–" or "—" for ranges.
 * Anything that isn't a positive whole number or a valid range is ignored; use `invalid` to report it.
 */
export function parseSkipList(input: string): number[] {
  return parseSkipListDetailed(input).numbers;
}

/** Same as parseSkipList but also returns the tokens that could not be understood (for inline errors). */
export function parseSkipListDetailed(input: string): {
  numbers: number[];
  invalid: string[];
} {
  const numbers = new Set<number>();
  const invalid: string[] = [];
  for (const token of input.split(/[,;\s]+/).filter(Boolean)) {
    const range = /^(\d+)\s*[-–—]\s*(\d+)$/.exec(token);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (a > b || b - a > 10000) {
        invalid.push(token);
        continue;
      }
      for (let n = a; n <= b; n++) numbers.add(n);
    } else if (/^\d+$/.test(token)) {
      numbers.add(Number(token));
    } else {
      invalid.push(token);
    }
  }
  return { numbers: [...numbers].sort((x, y) => x - y), invalid };
}

export function expandGroup(g: Group): Student[] {
  const skip = new Set(g.exclude ?? []);
  const out: Student[] = [];
  for (let n = g.from; n <= g.to; n++) {
    if (skip.has(n)) continue;
    out.push({
      groupId: g.id,
      subject: g.subject,
      roll: n,
      label: formatRoll(g.prefix, n, g.pad),
    });
  }
  return out;
}

/** Neighbours that were already filled when walking row-major: left, up, and (optionally) up-left / up-right. */
function earlierNeighbours(
  r: number,
  c: number,
  rules: Rules,
): [number, number][] {
  const n: [number, number][] = [[r, c - 1]];
  if (rules.frontBack) n.push([r - 1, c]);
  if (rules.diagonal) n.push([r - 1, c - 1], [r - 1, c + 1]);
  return n;
}

/** All neighbours, used for validating manual edits in the editor. */
function allNeighbours(r: number, c: number, rules: Rules): [number, number][] {
  const n: [number, number][] = [
    [r, c - 1],
    [r, c + 1],
  ];
  if (rules.frontBack) n.push([r - 1, c], [r + 1, c]);
  if (rules.diagonal)
    n.push([r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]);
  return n;
}

/* ───────────────────────── Feasibility pre-check ───────────────────────── */

/** Upper bound on how many students of ONE subject a room can hold under the rules. */
export function maxSameSubject(room: Room, rules: Rules): number {
  const usable = room.rows * room.cols - room.disabled.length;
  let bound: number;
  if (rules.diagonal)
    bound = Math.ceil(room.rows / 2) * Math.ceil(room.cols / 2); // every other row AND column
  else if (rules.frontBack)
    bound = Math.ceil((room.rows * room.cols) / 2); // checkerboard
  else bound = room.rows * Math.ceil(room.cols / 2); // alternate within each row
  return Math.min(bound, usable);
}

export function precheck(
  groups: Group[],
  rooms: Room[],
  rules: Rules,
): string[] {
  const warnings: string[] = [];
  const students = groups.flatMap(expandGroup);
  const capacity = rooms.reduce(
    (s, r) => s + r.rows * r.cols - r.disabled.length,
    0,
  );
  if (students.length > capacity)
    warnings.push(
      `${students.length} students but only ${capacity} usable seats. Add rooms.`,
    );

  const bySubject = new Map<string, number>();
  for (const s of students)
    bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + 1);
  const subjectCap = rooms.reduce((s, r) => s + maxSameSubject(r, rules), 0);
  for (const [subject, count] of bySubject)
    if (count > subjectCap)
      warnings.push(
        `${subject} has ${count} students, but these rooms can seat at most ~${subjectCap} of one subject ` +
          `without neighbours clashing. Add rooms or relax the diagonal/front-back rule.`,
      );
  return warnings;
}

/* ───────────────────────── Placement ───────────────────────── */

/**
 * Greedy: walk seats row by row. At each seat, among subjects that don't clash with already-placed
 * neighbours, pick the one with the MOST students remaining (keeps big subjects from getting stranded),
 * preferring the subject different from the left neighbour on ties. Students are drawn in roll order from
 * the group queues, so each group's roll numbers stay in ascending order within a room.
 * If nothing fits, the seat is left empty rather than breaking a rule.
 */
export function place(groups: Group[], rooms: Room[], rules: Rules): Result {
  const warnings = precheck(groups, rooms, rules);

  // subject -> queue of students (groups of the same subject are concatenated in input order)
  const queues = new Map<string, Student[]>();
  for (const g of groups) {
    const q = queues.get(g.subject) ?? [];
    q.push(...expandGroup(g));
    queues.set(g.subject, q);
  }
  const position = new Map<string, number>(); // subject -> next index in queue
  const remaining = (s: string) =>
    queues.get(s)!.length - (position.get(s) ?? 0);

  const layout: Layout = {};
  for (const room of rooms) {
    const grid: (Student | null)[][] = Array.from({ length: room.rows }, () =>
      Array(room.cols).fill(null),
    );
    const disabled = new Set(room.disabled);

    for (let r = 0; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        if (disabled.has(`${r},${c}`)) continue;
        const blocked = new Set<string>();
        for (const [nr, nc] of earlierNeighbours(r, c, rules)) {
          const s = grid[nr]?.[nc];
          if (s) blocked.add(s.subject);
        }
        const left = grid[r][c - 1]?.subject;

        let best: string | null = null;
        for (const subject of queues.keys()) {
          if (blocked.has(subject) || remaining(subject) === 0) continue;
          if (
            best === null ||
            remaining(subject) > remaining(best) ||
            (remaining(subject) === remaining(best) && best === left)
          )
            best = subject;
        }
        if (best === null) continue; // leave empty
        const i = position.get(best) ?? 0;
        grid[r][c] = queues.get(best)![i];
        position.set(best, i + 1);
      }
    }
    layout[room.id] = grid;
  }

  const unplaced: Student[] = [];
  for (const [subject, q] of queues)
    unplaced.push(...q.slice(position.get(subject) ?? 0));
  if (unplaced.length)
    warnings.push(
      `${unplaced.length} students could not be seated without breaking the rules.`,
    );
  return { layout, unplaced, warnings };
}

/* ───────────────────────── Editor support ───────────────────────── */

/** Every clashing pair in the layout. The editor uses this to highlight seats red after manual swaps. */
export function findConflicts(layout: Layout, rooms: Room[], rules: Rules) {
  const conflicts: {
    roomId: string;
    a: [number, number];
    b: [number, number];
  }[] = [];
  for (const room of rooms) {
    const grid = layout[room.id];
    for (let r = 0; r < room.rows; r++)
      for (let c = 0; c < room.cols; c++) {
        const s = grid[r][c];
        if (!s) continue;
        for (const [nr, nc] of allNeighbours(r, c, rules)) {
          if (nr < r || (nr === r && nc < c)) continue; // count each pair once
          const t = grid[nr]?.[nc];
          if (t && t.subject === s.subject)
            conflicts.push({ roomId: room.id, a: [r, c], b: [nr, nc] });
        }
      }
  }
  return conflicts;
}

/** Swap two seats (used by tap-to-select, tap-to-swap). Returns a new layout. */
export function swap(
  layout: Layout,
  roomId: string,
  a: [number, number],
  b: [number, number],
): Layout {
  const grid = layout[roomId].map((row) => row.slice());
  [grid[a[0]][a[1]], grid[b[0]][b[1]]] = [grid[b[0]][b[1]], grid[a[0]][a[1]]];
  return { ...layout, [roomId]: grid };
}

export interface SwapSuggestion {
  seat: [number, number];
  /** true when the target is an empty usable seat (a move rather than a swap) */
  empty: boolean;
  /** clash count of the room after the swap/move */
  clashesAfter: number;
}

/**
 * Seats in the same room that, if swapped with `seat`, lower the room's clash count.
 * Best first (fewest clashes after). Disabled seats are never suggested.
 * Returns [] when `seat` is empty/disabled or nothing improves things.
 */
export function suggestSwaps(
  layout: Layout,
  rooms: Room[],
  rules: Rules,
  roomId: string,
  seat: [number, number],
): SwapSuggestion[] {
  const room = rooms.find((r) => r.id === roomId);
  const grid = layout[roomId];
  if (!room || !grid || !grid[seat[0]]?.[seat[1]]) return [];

  const countClashes = (l: Layout) => findConflicts(l, [room], rules).length;
  const before = countClashes(layout);
  if (before === 0) return [];

  const disabled = new Set(room.disabled);
  const out: SwapSuggestion[] = [];
  for (let r = 0; r < room.rows; r++)
    for (let c = 0; c < room.cols; c++) {
      if ((r === seat[0] && c === seat[1]) || disabled.has(`${r},${c}`))
        continue;
      const after = countClashes(swap(layout, roomId, seat, [r, c]));
      if (after < before)
        out.push({
          seat: [r, c],
          empty: grid[r][c] === null,
          clashesAfter: after,
        });
    }
  return out.sort(
    (x, y) => x.clashesAfter - y.clashesAfter || +x.empty - +y.empty,
  );
}

/* ───────────────────────── Word-export data ───────────────────────── */

export function toRanges(rolls: number[]): string[] {
  if (rolls.length === 0) return [];
  const sorted = [...rolls].sort((x, y) => x - y);
  const out: string[] = [];
  let start = sorted[0],
    prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    out.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = n;
  }
  return out;
}

/** Rows for the .docx table: room -> group -> subject -> compressed roll ranges. */
export function roomSummary(layout: Layout, rooms: Room[], groups: Group[]) {
  const byId = new Map(groups.map((g) => [g.id, g]));
  return rooms.map((room) => {
    const perGroup = new Map<string, number[]>();
    for (const row of layout[room.id])
      for (const s of row)
        if (s)
          perGroup.set(s.groupId, [...(perGroup.get(s.groupId) ?? []), s.roll]);
    return {
      room: room.name,
      entries: [...perGroup].map(([gid, rolls]) => {
        const g = byId.get(gid)!;
        return {
          group: g.label,
          subject: g.subject,
          prefix: g.prefix ?? "",
          ranges: toRanges(rolls).join(", "),
          count: rolls.length,
        };
      }),
    };
  });
}
