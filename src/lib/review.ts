import type { Plan } from "@/lib/db/types";
import { roomsCapacity } from "@/lib/rooms";
import {
  expandGroup,
  maxSameSubject,
  type Group,
  type Layout,
  type Student,
} from "@/lib/seating/seating";
import { studentCount } from "@/lib/plan-utils";

/** Which earlier step fixes a problem. */
export type FixStep = "setup" | "groups" | "rooms";

export interface ReviewCard {
  /** blocking stops Generate; warning is advice; ok is reassurance. */
  kind: "blocking" | "warning" | "ok";
  title: string;
  body: string;
  action?: { label: string; step: FixStep };
}

export interface ReviewResult {
  cards: ReviewCard[];
  blocked: boolean;
}

/** Seats left over at or below this count trigger the "almost no spare seats" warning. */
export const FEW_SPARE_SEATS = 2;

export function subjectCounts(groups: Group[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const g of groups)
    counts.set(g.subject, (counts.get(g.subject) ?? 0) + expandGroup(g).length);
  return counts;
}

/** Everything the review screen tells the teacher before they generate. */
export function reviewPlan(
  plan: Pick<Plan, "groups" | "rooms" | "rules">,
): ReviewResult {
  const cards: ReviewCard[] = [];
  const students = studentCount(plan);
  const seats = roomsCapacity(plan.rooms);

  if (plan.groups.length === 0 || students === 0)
    cards.push({
      kind: "blocking",
      title: "No students yet",
      body: "Add at least one group of students before generating.",
      action: { label: "Add a group", step: "groups" },
    });
  if (plan.rooms.length === 0)
    cards.push({
      kind: "blocking",
      title: "No rooms yet",
      body: "Add at least one room before generating.",
      action: { label: "Add a room", step: "rooms" },
    });
  if (plan.rooms.length > 0 && students > seats)
    cards.push({
      kind: "blocking",
      title: "Not enough seats",
      body: `${students} students but only ${seats} usable seats. Add ${students - seats} more ${students - seats === 1 ? "seat" : "seats"} to continue.`,
      action: { label: "Add a room", step: "rooms" },
    });

  const blocked = cards.some((c) => c.kind === "blocking");
  if (blocked) return { cards, blocked };

  if (seats - students <= FEW_SPARE_SEATS)
    cards.push({
      kind: "warning",
      title: "Almost no spare seats",
      body: `${seats} seats for ${students} students. Your rules can leave a few seats empty, so one or two students may not fit.`,
      action: { label: "Add a room", step: "rooms" },
    });

  const cap = plan.rooms.reduce(
    (sum, r) => sum + maxSameSubject(r, plan.rules),
    0,
  );
  const counts = subjectCounts(plan.groups);
  const tooBig = [...counts].filter(([, n]) => n > cap);
  for (const [subject, n] of tooBig)
    cards.push({
      kind: "warning",
      title: `Too many ${subject} students`,
      body: `${subject} has ${n} students, but these rooms can seat about ${cap} of one subject under your rules. Add rooms or relax a rule.`,
      action: { label: "Add a room", step: "rooms" },
    });

  if (tooBig.length === 0) {
    const [subject, n] = [...counts].sort((a, b) => b[1] - a[1])[0];
    cards.push({
      kind: "ok",
      title: "No subject is too large",
      body: `${subject} is the biggest at ${n} students. These rooms can hold about ${cap} of one subject under your rules.`,
    });
  }

  return { cards, blocked: false };
}

/** Students in the groups who have no seat in the layout. */
export function unplacedStudents(groups: Group[], layout: Layout): Student[] {
  const seated = new Set<string>();
  for (const grid of Object.values(layout))
    for (const row of grid)
      for (const s of row) if (s) seated.add(`${s.groupId}:${s.roll}`);
  return groups
    .flatMap(expandGroup)
    .filter((s) => !seated.has(`${s.groupId}:${s.roll}`));
}

/** "Side by side, in front and behind" */
export function rulesSummary(rules: Plan["rules"]): string {
  const parts = ["Side by side"];
  if (rules.frontBack) parts.push("in front and behind");
  if (rules.diagonal) parts.push("diagonally");
  return parts.join(", ");
}
