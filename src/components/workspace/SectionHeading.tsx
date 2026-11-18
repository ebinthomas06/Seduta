export const fieldLabelClass =
  "font-mono text-[11px] font-medium tracking-[.08em] text-ink2 uppercase";

/** "01 Plan" style heading used for the three workspace sections. */
export function SectionHeading({
  number,
  title,
  note,
}: {
  number: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-ink pb-2">
      <span className="font-mono text-[12px] font-medium text-ink2">
        {number}
      </span>
      <h2 className="text-[20px] leading-tight font-semibold">{title}</h2>
      {note && <span className="text-[14px] text-ink2">{note}</span>}
    </div>
  );
}
