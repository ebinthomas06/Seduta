import type { Group, Layout, Room, Rules } from "@/lib/seating/seating";

export type Institution = "school" | "college";
export type PlanStatus = "draft" | "ready";

/** Side-by-side is always enforced, so it is not stored. */
export type PlanRules = Pick<Rules, "frontBack" | "diagonal">;

export interface Plan {
  id: string;
  name: string;
  institution: Institution;
  rules: PlanRules;
  groups: Group[];
  rooms: Room[];
  /** null until generated */
  layout: Layout | null;
  status: PlanStatus;
  createdAt: number;
  updatedAt: number;
}

/** A reusable classroom kept in the library across plans. */
export interface SavedRoom {
  id: string;
  name: string;
  rows: number;
  cols: number;
  seatsPerBench: number;
  /** "row,col" */
  disabled: string[];
}
