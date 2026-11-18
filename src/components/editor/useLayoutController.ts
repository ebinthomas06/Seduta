"use client";

import { useMemo, useState } from "react";
import type { Plan } from "@/lib/db/types";
import {
  clashSeats,
  key,
  moveToBestEmpty,
  rearrange,
  roomClashes,
  setSeatUsable,
  shortCode,
  swapSeats,
  type Seat,
  type Snapshot,
} from "@/lib/editor/ops";
import { useEditorStore } from "@/lib/editor/store";
import { distinctSubjects } from "@/lib/groups";
import { unplacedStudents } from "@/lib/review";
import { suggestSwaps, type Student } from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";

/**
 * Everything the layout editor does, independent of how it is drawn. The phone and desktop
 * views share it, so tap-to-swap, drag-to-swap, the inspector buttons and undo all go through
 * the same functions.
 */
export function useLayoutController(
  plan: Plan,
  snap: Snapshot,
  canUndo: boolean,
  canRedo: boolean,
) {
  const { edit, undo, redo } = useEditorStore.getState();
  const rules = plan.rules;

  const [roomId, setRoomId] = useState(snap.rooms[0]?.id ?? "");
  const [selected, setSelected] = useState<Seat | null>(null);
  const [fixCursor, setFixCursor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRearrange, setConfirmRearrange] = useState(false);

  const room = snap.rooms.find((r) => r.id === roomId) ?? snap.rooms[0];
  const grid = snap.layout[room.id];
  const subjects = useMemo(
    () => buildSubjectMap(distinctSubjects(plan.groups)),
    [plan.groups],
  );
  const codeOf = (s: Student) => shortCode(s, plan.groups);

  const clashList = roomClashes(snap, rules, room.id);
  const clashes = useMemo(
    () => clashSeats(snap, rules, room.id),
    [snap, rules, room.id],
  );
  const disabled = useMemo(() => new Set(room.disabled), [room.disabled]);
  const unplaced = useMemo(
    () => unplacedStudents(plan.groups, snap.layout),
    [plan.groups, snap.layout],
  );

  const selStudent = selected ? grid[selected[0]][selected[1]] : null;
  const selUnusable = selected ? disabled.has(key(selected)) : false;
  const suggestions = useMemo(
    () =>
      selected && selStudent
        ? suggestSwaps(snap.layout, snap.rooms, rules, room.id, selected)
        : [],
    [selected, selStudent, snap, rules, room.id],
  );
  const targets = useMemo(
    () => new Set(suggestions.map((s) => key(s.seat))),
    [suggestions],
  );

  function clearSelection() {
    setSelected(null);
    setError(null);
    setNotice(null);
  }

  function chooseRoom(id: string) {
    setRoomId(id);
    setFixCursor(0);
    clearSelection();
  }

  /** Swap (or move into an empty seat). Unusable seats are never swapped into. */
  function trySwap(a: Seat, b: Seat): boolean {
    if (disabled.has(key(a)) || disabled.has(key(b))) return false;
    if (!grid[a[0]][a[1]] && !grid[b[0]][b[1]]) return false;
    edit(swapSeats(snap, room.id, a, b));
    return true;
  }

  /** Tap or click: select, or swap with the selected seat. */
  function onSeat(r: number, c: number) {
    setError(null);
    setNotice(null);
    const here: Seat = [r, c];
    if (!selected) return setSelected(here);
    if (selected[0] === r && selected[1] === c) return setSelected(null);
    if (trySwap(selected, here)) setSelected(null);
    else setSelected(here);
  }

  /** Drag a seat onto another. */
  function onDragSwap(a: Seat, b: Seat) {
    setError(null);
    setNotice(null);
    if (trySwap(a, b)) setSelected(null);
  }

  /** Select the first seat of the next clash in this room. */
  function fix() {
    if (clashList.length === 0) return;
    const clash = clashList[fixCursor % clashList.length];
    setFixCursor(fixCursor + 1);
    setError(null);
    setNotice(null);
    setSelected(clash.a);
  }

  function moveToEmpty() {
    if (!selected) return;
    const next = moveToBestEmpty(snap, rules, room.id, selected);
    if (next) edit(next);
    setSelected(null);
  }

  function toggleUsable() {
    if (!selected) return;
    const res = setSeatUsable(snap, rules, room.id, selected, selUnusable);
    if (!res.ok) return setError(res.error);
    edit(res.snapshot);
    setSelected(null);
    setError(null);
  }

  function doRearrange() {
    setConfirmRearrange(false);
    const next = rearrange(snap, rules, room.id);
    if (next) {
      edit(next);
      setNotice(`${room.name} was seated again.`);
    } else {
      setNotice(
        `Couldn't seat ${room.name} again without leaving someone out, so nothing changed.`,
      );
    }
    setSelected(null);
  }

  const doUndo = () => {
    undo();
    clearSelection();
  };
  const doRedo = () => {
    redo();
    clearSelection();
  };

  return {
    plan,
    snap,
    rules,
    room,
    grid,
    subjects,
    codeOf,
    clashList,
    clashes,
    disabled,
    unplaced,
    selected,
    selStudent,
    selUnusable,
    suggestions,
    targets,
    error,
    notice,
    confirmRearrange,
    setConfirmRearrange,
    canUndo,
    canRedo,
    chooseRoom,
    clearSelection,
    onSeat,
    onDragSwap,
    trySwap,
    setSelected,
    fix,
    moveToEmpty,
    toggleUsable,
    doRearrange,
    doUndo,
    doRedo,
  };
}

export type LayoutController = ReturnType<typeof useLayoutController>;
