import type { Institution } from "@/lib/db/types";
import { institutionLabels } from "@/lib/labels";
import {
  parseSkipListDetailed,
  toRanges,
  type Group,
} from "@/lib/seating/seating";

export const YEAR_OPTIONS = ["1st year", "2nd year", "3rd year", "4th year"];
export const CLASS_OPTIONS = Array.from(
  { length: 12 },
  (_, i) => `Class ${i + 1}`,
);

/**
 * Choices for the first group field. `current` is kept in the list even when it belongs to the
 * other institution (for example after switching College to School), so nothing is silently
 * changed on screen.
 */
export function primaryOptions(
  institution: Institution,
  current?: string,
): string[] {
  const base = institution === "school" ? CLASS_OPTIONS : YEAR_OPTIONS;
  return current && !base.includes(current) ? [current, ...base] : base;
}

/** Everything the add/edit sheet edits, as the strings typed into the fields. */
export interface GroupForm {
  primary: string;
  secondary: string;
  prefix: string;
  from: string;
  to: string;
  skip: string;
  subject: string;
}

export type GroupErrors = Partial<Record<keyof GroupForm, string>>;

export const MAX_ROLLS_PER_GROUP = 5000;

export function emptyForm(institution: Institution): GroupForm {
  return {
    primary: primaryOptions(institution)[0],
    secondary: "",
    prefix: "",
    from: "1",
    to: "",
    skip: "",
    subject: "",
  };
}

export function formFromGroup(g: Group, institution: Institution): GroupForm {
  return {
    primary: g.primary ?? primaryOptions(institution)[0],
    secondary: g.secondary ?? "",
    prefix: g.prefix ?? "",
    from: String(g.from),
    to: String(g.to),
    skip: toRanges(g.exclude ?? [])
      .join(", ")
      .replaceAll("–", "-"),
    subject: g.subject,
  };
}

/** "2nd year" + "CSE" -> "2nd yr · CSE". "Class 8" + "B" -> "Class 8 · B". */
export function groupLabel(primary: string, secondary: string): string {
  return `${primary.replace(/ year$/, " yr")} · ${secondary}`;
}

const wholeNumber = (s: string) => /^\d+$/.test(s.trim());

/**
 * Checks the form. When valid, `group` is ready to save (minus its id).
 * `knownSubjects` lets us reuse the spelling of a subject already in the plan,
 * so "maths" and "Maths" are never treated as two subjects.
 */
export function validateGroupForm(
  form: GroupForm,
  institution: Institution,
  knownSubjects: string[] = [],
): { errors: GroupErrors; group?: Omit<Group, "id"> } {
  const labels = institutionLabels(institution);
  const errors: GroupErrors = {};

  const secondary = form.secondary.trim();
  if (!secondary)
    errors.secondary = `Enter a ${labels.secondary.toLowerCase()}.`;

  let from = NaN;
  let to = NaN;
  if (!wholeNumber(form.from) || Number(form.from) < 1)
    errors.from = "Enter a whole number, 1 or more.";
  else from = Number(form.from);
  if (!wholeNumber(form.to) || Number(form.to) < 1)
    errors.to = "Enter a whole number, 1 or more.";
  else to = Number(form.to);

  if (!errors.from && !errors.to) {
    if (from > to) errors.to = "Roll to must be at least Roll from.";
    else if (to - from + 1 > MAX_ROLLS_PER_GROUP)
      errors.to = `A group can have at most ${MAX_ROLLS_PER_GROUP} rolls.`;
  }

  const { numbers: skipped, invalid } = parseSkipListDetailed(form.skip);
  if (invalid.length) {
    errors.skip = `Couldn't read “${invalid[0]}”. Use numbers like 13, 44 or 50-52.`;
  } else if (!errors.from && !errors.to && !errors.skip) {
    const outside = skipped.filter((n) => n < from || n > to);
    if (outside.length)
      errors.skip = `Skip numbers must be between ${from} and ${to}: ${outside.slice(0, 3).join(", ")}${outside.length > 3 ? "…" : ""}.`;
    else if (skipped.length >= to - from + 1)
      errors.skip = "Skipping every roll leaves no students.";
  }

  let subject = form.subject.trim();
  if (!subject) errors.subject = "Enter the exam subject.";
  else if (subject.length > 30)
    errors.subject = "Keep the subject under 30 characters.";
  else {
    const known = knownSubjects.find(
      (s) => s.toLowerCase() === subject.toLowerCase(),
    );
    if (known) subject = known;
  }

  if (Object.keys(errors).length) return { errors };

  const prefix = form.prefix.trim();
  return {
    errors,
    group: {
      label: groupLabel(form.primary, secondary),
      primary: form.primary,
      secondary,
      subject,
      prefix: prefix || undefined,
      from,
      to,
      exclude: skipped.length ? skipped : undefined,
      pad: prefix ? 3 : undefined,
    },
  };
}

/** "Rolls 1–60, skip 13, 44" */
export function rollSummary(g: Group): string {
  const skip = g.exclude?.length
    ? `, skip ${toRanges(g.exclude).join(", ")}`
    : "";
  return `Rolls ${g.from}–${g.to}${skip}`;
}

export function distinctSubjects(groups: Group[]): string[] {
  return [...new Set(groups.map((g) => g.subject))];
}
