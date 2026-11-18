import { create } from "zustand";
import { commit, redo, startHistory, undo, type History } from "./history";
import type { Snapshot } from "./ops";

interface EditorState {
  /** Which plan is loaded, so a reload of the same plan does not wipe undo history. */
  planId: string | null;
  history: History<Snapshot> | null;
  load: (planId: string, snapshot: Snapshot) => void;
  edit: (next: Snapshot) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  planId: null,
  history: null,
  load: (planId, snapshot) => set({ planId, history: startHistory(snapshot) }),
  edit: (next) =>
    set((s) => (s.history ? { history: commit(s.history, next) } : s)),
  undo: () => set((s) => (s.history ? { history: undo(s.history) } : s)),
  redo: () => set((s) => (s.history ? { history: redo(s.history) } : s)),
}));
