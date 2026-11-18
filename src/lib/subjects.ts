/**
 * Subject letter and tint are derived from the subject list, never stored per student.
 * Every seat shows the letter, so colour is never the only signal.
 */
export type SubjectTint = 1 | 2 | 3;

export interface SubjectInfo {
  letter: string;
  tint: SubjectTint;
}

/**
 * Distinct subjects (in first-seen order) -> letter + tint.
 * The letter is the first character of the name not already taken by an
 * earlier subject; tints rotate through the three palette colours.
 */
export function buildSubjectMap(subjects: string[]): Map<string, SubjectInfo> {
  const map = new Map<string, SubjectInfo>();
  const usedLetters = new Set<string>();
  for (const raw of subjects) {
    const name = raw.trim();
    if (!name || map.has(name)) continue;
    const candidates = [...name.toUpperCase()].filter((ch) =>
      /[\p{L}\p{N}]/u.test(ch),
    );
    let letter = candidates.find((ch) => !usedLetters.has(ch));
    if (!letter) {
      let n = 1;
      while (usedLetters.has(String(n))) n++;
      letter = String(n);
    }
    usedLetters.add(letter);
    map.set(name, {
      letter,
      tint: ((map.size % 3) + 1) as SubjectTint,
    });
  }
  return map;
}

export function tintVar(tint: SubjectTint): string {
  return `var(--tint-${tint})`;
}
