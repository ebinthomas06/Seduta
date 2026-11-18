import { expandGroup } from "@/lib/seating/seating";
import type { Plan } from "@/lib/db/types";
import { routes } from "@/lib/routes";

export function studentCount(plan: Pick<Plan, "groups">): number {
  return plan.groups.reduce((sum, g) => sum + expandGroup(g).length, 0);
}

export function institutionLabel(plan: Pick<Plan, "institution">): string {
  return plan.institution === "school" ? "School" : "College";
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Yesterday", "12 Nov" (this year) or "12 Nov 2025". */
export function formatEdited(
  timestamp: number,
  now: number = Date.now(),
): string {
  const d = new Date(timestamp);
  const days = Math.round(
    (startOfDay(new Date(now)) - startOfDay(d)) / 86_400_000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date(now).getFullYear()
    ? base
    : `${base} ${d.getFullYear()}`;
}

/** Where tapping a plan should go: finished plans open the editor, drafts resume setup. */
export function planHref(plan: Pick<Plan, "id" | "status">): string {
  return plan.status === "ready"
    ? routes.layout(plan.id)
    : routes.setup(plan.id);
}
