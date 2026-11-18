import { cx } from "@/lib/cx";
import { tintVar, type SubjectInfo } from "@/lib/subjects";
import type { Student } from "@/lib/seating/seating";

export type SeatKey = `${number},${number}`;
export const seatKey = (r: number, c: number): SeatKey => `${r},${c}`;

interface SeatGridProps {
  /** grid[row][col] -> student, or null for an empty seat. */
  grid: (Student | null)[][];
  /** Seats that cannot be used, as "row,col". Drawn dashed with a ×. */
  disabled?: ReadonlySet<string>;
  /** Seats per bench: a wider gap is drawn between benches. */
  seatsPerBench: number;
  subjects: ReadonlyMap<string, SubjectInfo>;
  /** Cell width in px. 52 = editor, 48 = room editor, 28 = PDF preview. */
  cellSize?: number;
  /** Cell height in px. Defaults to the width. */
  cellHeight?: number;
  /** Currently selected seat: solid accent border. */
  selected?: [number, number] | null;
  /** Seats that clash with a neighbour: thick alert border. */
  clashes?: ReadonlySet<string>;
  /** Valid swap targets: dashed accent border. */
  targets?: ReadonlySet<string>;
  /** When set, seats are buttons. Without it they are static (previews). */
  onSeatClick?: (row: number, col: number) => void;
  /** Show the roll code under the subject letter. */
  showCode?: boolean;
  codeOf?: (s: Student) => string;
  /** Draw the Board bar above the grid. */
  showBoard?: boolean;
  className?: string;
}

/**
 * The one seat grid used by the room editor, layout editor, desktop inspector
 * and PDF preview. Every seat shows the subject letter, so colour is never the
 * only signal.
 */
export function SeatGrid({
  grid,
  disabled,
  seatsPerBench,
  subjects,
  cellSize = 52,
  cellHeight,
  selected,
  clashes,
  targets,
  onSeatClick,
  showCode = true,
  codeOf = (s) => s.label,
  showBoard = true,
  className,
}: SeatGridProps) {
  const h = cellHeight ?? cellSize;
  const small = cellSize < 40;
  const benchGap = small ? 8 : 12;
  const seatGap = 2;
  const cols = grid[0]?.length ?? 0;
  const gapBefore = (c: number) =>
    c === 0 ? 0 : c % Math.max(1, seatsPerBench) === 0 ? benchGap : seatGap;
  const width = Array.from(
    { length: cols },
    (_, c) => cellSize + gapBefore(c),
  ).reduce((a, b) => a + b, 0);

  return (
    <div className={cx("flex flex-col items-center gap-2", className)}>
      {showBoard && (
        <div
          style={{ width, height: small ? 16 : 22 }}
          className={cx(
            "box-border flex items-center justify-center border border-ink font-mono font-medium tracking-[.2em] text-ink uppercase",
            small ? "text-[8px]" : "text-[10px]",
          )}
        >
          Board
        </div>
      )}
      <div
        className="flex flex-col"
        style={{ gap: small ? 4 : 6 }}
        role="group"
        aria-label="Seat grid"
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((student, c) => {
              const key = seatKey(r, c);
              const off = disabled?.has(key) ?? false;
              const info = student ? subjects.get(student.subject) : undefined;
              const isSelected =
                !!selected && selected[0] === r && selected[1] === c;
              const isTarget = !!targets?.has(key);
              const isClash = !!clashes?.has(key);

              let border = "border border-rule2";
              let note = "";
              if (isClash) {
                border = "border-[3px] border-alert";
                note = ", clashes with a neighbour";
              }
              if (isTarget) {
                border = "border-[3px] border-dashed border-accent";
                note = ", swap target";
              }
              if (isSelected) {
                border = "border-[3px] border-accent";
                note = ", selected";
              }

              const where = `Row ${r + 1}, seat ${c + 1}`;
              const label = off
                ? `${where}, unusable`
                : student
                  ? `${where}, ${student.subject}, ${codeOf(student)}${note}`
                  : `${where}, usable${note}`;

              const style: React.CSSProperties = {
                width: cellSize,
                height: h,
                marginLeft: gapBefore(c),
                background: info ? tintVar(info.tint) : undefined,
              };
              const cls = cx(
                "box-border flex flex-none flex-col items-center justify-center gap-1 rounded-[3px] p-0 text-ink",
                off
                  ? "border border-dashed border-ink2 bg-transparent text-ink2"
                  : cx(border, !info && "bg-surface"),
              );
              const content = off ? (
                <span
                  className="font-mono text-[16px] font-medium"
                  aria-hidden="true"
                >
                  ×
                </span>
              ) : student && info ? (
                <>
                  <span
                    className={cx(
                      "leading-none font-semibold",
                      small ? "text-[10px]" : "text-[12px]",
                    )}
                    aria-hidden="true"
                  >
                    {info.letter}
                  </span>
                  {showCode && !small && (
                    <span
                      className="font-mono text-[12px] leading-none font-medium"
                      aria-hidden="true"
                    >
                      {codeOf(student)}
                    </span>
                  )}
                </>
              ) : null;

              if (!onSeatClick) {
                return (
                  <div
                    key={c}
                    role="img"
                    aria-label={label}
                    style={style}
                    className={cls}
                  >
                    {content}
                  </div>
                );
              }
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  style={style}
                  className={cls}
                  onClick={() => onSeatClick(r, c)}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
