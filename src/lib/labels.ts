import type { Institution } from "@/lib/db/types";

/** Field labels that change with the institution. The data model underneath is identical. */
export interface InstitutionLabels {
  /** First group field: "Year" / "Class" */
  primary: string;
  /** Second group field: "Branch" / "Section" */
  secondary: string;
  /** Plural nouns used in sentences, e.g. "year, branch and roll number" */
  entry: string;
  /** What the other institution calls them, for the setup hint */
  otherEntry: string;
  otherName: string;
}

export function institutionLabels(institution: Institution): InstitutionLabels {
  return institution === "school"
    ? {
        primary: "Class",
        secondary: "Section",
        entry: "class, section and roll number",
        otherEntry: "year, branch and roll number",
        otherName: "college",
      }
    : {
        primary: "Year",
        secondary: "Branch",
        entry: "year, branch and roll number",
        otherEntry: "class, section and roll number",
        otherName: "school",
      };
}

/** The sentence under the School / College switch. */
export function institutionHint(institution: Institution): string {
  const l = institutionLabels(institution);
  return `Students are entered as ${l.entry}. For a ${l.otherName} this becomes ${l.otherEntry}.`;
}
