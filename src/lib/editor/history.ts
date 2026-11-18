/** Undo/redo history as plain functions, so it can be tested without React. */
export interface History<T> {
  present: T;
  past: T[];
  future: T[];
}

export const MAX_HISTORY = 100;

export const startHistory = <T>(present: T): History<T> => ({
  present,
  past: [],
  future: [],
});

/** A new edit: the old state goes onto the undo stack and redo is cleared. */
export function commit<T>(h: History<T>, next: T): History<T> {
  if (next === h.present) return h;
  return {
    present: next,
    past: [...h.past, h.present].slice(-MAX_HISTORY),
    future: [],
  };
}

export function undo<T>(h: History<T>): History<T> {
  if (h.past.length === 0) return h;
  return {
    present: h.past[h.past.length - 1],
    past: h.past.slice(0, -1),
    future: [h.present, ...h.future],
  };
}

export function redo<T>(h: History<T>): History<T> {
  if (h.future.length === 0) return h;
  return {
    present: h.future[0],
    past: [...h.past, h.present],
    future: h.future.slice(1),
  };
}
