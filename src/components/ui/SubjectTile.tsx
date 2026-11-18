import { cx } from "@/lib/cx";
import { tintVar, type SubjectInfo } from "@/lib/subjects";

interface SubjectTileProps {
  info: SubjectInfo;
  /** 20 = legend, 32 = list row, 36 = selected-seat panel. */
  size?: 20 | 32 | 36;
  /** Accent outline, used for the selected seat's tile. */
  selected?: boolean;
}

export function SubjectTile({ info, size = 32, selected }: SubjectTileProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, background: tintVar(info.tint) }}
      className={cx(
        "box-border inline-flex flex-none items-center justify-center font-sans font-semibold text-ink",
        size === 20 ? "rounded-sm text-[11px]" : "rounded-[3px] text-[14px]",
        selected ? "border-[3px] border-accent" : "border border-rule2",
      )}
    >
      {info.letter}
    </span>
  );
}
