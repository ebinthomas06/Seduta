"use client";

import { useMemo, useState } from "react";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { CheckboxRow } from "@/components/ui/CheckboxRow";
import { DownloadIcon, PlusIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { SeatGrid, seatKey } from "@/components/ui/SeatGrid";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusTag } from "@/components/ui/StatusTag";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Stepper } from "@/components/ui/Stepper";
import { SubjectTile } from "@/components/ui/SubjectTile";
import { monoLabelClass, TextField } from "@/components/ui/TextField";
import { TopBar } from "@/components/ui/TopBar";
import {
  findConflicts,
  place,
  suggestSwaps,
  swap,
  type Group,
  type Layout,
  type Room,
  type Rules,
} from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";

const rules: Rules = { frontBack: true, diagonal: false };
const groups: Group[] = [
  {
    id: "g1",
    label: "CSE",
    subject: "Maths",
    prefix: "CS",
    from: 1,
    to: 60,
    exclude: [13, 44],
    pad: 2,
  },
  {
    id: "g2",
    label: "ECE",
    subject: "Physics",
    prefix: "EC",
    from: 1,
    to: 48,
    pad: 2,
  },
  {
    id: "g3",
    label: "ME",
    subject: "Chemistry",
    prefix: "ME",
    from: 1,
    to: 30,
    pad: 2,
  },
];
const room: Room = {
  id: "r1",
  name: "Room 101",
  rows: 6,
  cols: 6,
  seatsPerBench: 2,
  disabled: ["0,0"],
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-ink pt-4">
      <h2 className={monoLabelClass}>{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentGallery() {
  const { theme, setTheme } = useTheme();
  const [inst, setInst] = useState<"school" | "college">("college");
  const [spb, setSpb] = useState<"1" | "2" | "3">("2");
  const [front, setFront] = useState(true);
  const [rows, setRows] = useState(6);
  const [name, setName] = useState("Mid-semester exam");
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);

  // Seat grid demo: tap a seat, then tap another to swap.
  const [layout, setLayout] = useState<Layout>(
    () => place(groups, [room], rules).layout,
  );
  const [sel, setSel] = useState<[number, number] | null>(null);
  const subjects = useMemo(
    () => buildSubjectMap(groups.map((g) => g.subject)),
    [],
  );
  const disabled = useMemo(() => new Set(room.disabled), []);
  const clashes = useMemo(() => {
    const set = new Set<string>();
    for (const c of findConflicts(layout, [room], rules)) {
      set.add(seatKey(...c.a));
      set.add(seatKey(...c.b));
    }
    return set;
  }, [layout]);
  const targets = useMemo(
    () =>
      sel
        ? new Set(
            suggestSwaps(layout, [room], rules, room.id, sel).map((s) =>
              seatKey(...s.seat),
            ),
          )
        : new Set<string>(),
    [layout, sel],
  );

  function onSeat(r: number, c: number) {
    if (disabled.has(seatKey(r, c))) return;
    if (!sel) return setSel([r, c]);
    if (sel[0] === r && sel[1] === c) return setSel(null);
    setLayout(swap(layout, room.id, sel, [r, c]));
    setSel(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-tight font-semibold">Components</h1>
        <p className="text-[14px] text-ink2">
          Every shared component, in both themes. Use Tab to check focus states.
        </p>
        <SegmentedControl<ThemePreference>
          legend="Theme"
          size="sm"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </header>

      <Section title="Top bar">
        <div className="border border-rule">
          <TopBar
            title="Mid-semester exam"
            backHref="/dev/components"
            backLabel="Back to saved plans"
            action={
              <Button
                href="/dev/components"
                variant="outline"
                size="sm"
                aria-label="Export"
              >
                <DownloadIcon /> Export
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Step indicator">
        <StepIndicator step={2} name="Groups" />
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-3">
          <Button>Next: Groups</Button>
          <Button variant="outline" size="md">
            Rearrange this room
          </Button>
          <Button variant="danger" size="md">
            Delete room
          </Button>
          <Button variant="dashed">
            <PlusIcon /> Add group
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="text">Cancel</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Text field">
        <TextField
          label="Plan name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Roll prefix · optional"
          mono
          defaultValue="24CS"
          hint="Printed before the number, so 1 becomes 24CS001."
        />
        <TextField
          label="Roll to"
          mono
          type="number"
          defaultValue="0"
          error="Roll to must be at least Roll from."
        />
      </Section>

      <Section title="Segmented control">
        <SegmentedControl
          legend="Institution"
          value={inst}
          onChange={setInst}
          options={[
            { value: "school", label: "School" },
            { value: "college", label: "College" },
          ]}
        />
        <div className="flex items-center justify-between">
          <span className="text-[16px]">Seats per bench</span>
          <SegmentedControl
            legend="Seats per bench"
            size="sm"
            mono
            value={spb}
            onChange={setSpb}
            options={[
              { value: "1", label: "1", ariaLabel: "1 seat per bench" },
              { value: "2", label: "2", ariaLabel: "2 seats per bench" },
              { value: "3", label: "3", ariaLabel: "3 seats per bench" },
            ]}
          />
        </div>
      </Section>

      <Section title="Checkbox rows">
        <div className="flex flex-col border-t border-rule">
          <CheckboxRow label="Side by side" note="always on" checked disabled />
          <CheckboxRow
            label="In front and behind"
            checked={front}
            onChange={setFront}
          />
          <CheckboxRow label="Diagonally" checked={false} />
        </div>
      </Section>

      <Section title="Stepper">
        <div className="flex flex-col border-t border-rule">
          <Stepper label="Rows" value={rows} onChange={setRows} />
        </div>
      </Section>

      <Section title="Status tags and subject tiles">
        <div className="flex flex-wrap items-center gap-3">
          <StatusTag status="ready" />
          <StatusTag status="draft" />
          {[...subjects.values()].map((s) => (
            <SubjectTile key={s.letter} info={s} />
          ))}
          {[...subjects.values()].map((s) => (
            <SubjectTile key={`s${s.letter}`} info={s} size={20} />
          ))}
          <SubjectTile info={[...subjects.values()][1]} size={36} selected />
        </div>
      </Section>

      <Section title="Seat grid (tap a seat, then another to swap)">
        <SeatGrid
          grid={layout[room.id]}
          disabled={disabled}
          seatsPerBench={room.seatsPerBench}
          subjects={subjects}
          selected={sel}
          clashes={clashes}
          targets={targets}
          onSeatClick={onSeat}
        />
        <p className="text-[14px] text-ink2" aria-live="polite">
          {clashes.size === 0
            ? "No clashes."
            : `${clashes.size / 2 === Math.floor(clashes.size / 2) ? "" : "≥ "}${findConflicts(layout, [room], rules).length} clash(es). Red = clash, dashed = swap target.`}
        </p>
        <p className={monoLabelClass}>
          Room editor cells (48 × 44) and print preview (28)
        </p>
        <SeatGrid
          grid={Array.from({ length: 3 }, () => Array(6).fill(null))}
          disabled={new Set(["0,0"])}
          seatsPerBench={2}
          subjects={subjects}
          cellSize={48}
          cellHeight={44}
          onSeatClick={() => {}}
        />
        <div
          className="self-center bg-page p-4"
          style={{ ["--ink" as string]: "#1B1F2A" }}
        >
          <SeatGrid
            grid={layout[room.id]}
            disabled={disabled}
            seatsPerBench={2}
            subjects={subjects}
            cellSize={28}
          />
        </div>
      </Section>

      <Section title="Bottom sheet and dialog">
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="outline" size="md" onClick={() => setDialog(true)}>
            Open dialog
          </Button>
        </div>
      </Section>

      <Section title="Bottom bar">
        <div className="border border-rule">
          <BottomBar>
            <div className="flex justify-between font-mono text-[12px] font-medium tracking-[.04em] text-ink2">
              <span>136 students</span>
              <span>3 subjects</span>
            </div>
            <Button>Next: Rooms</Button>
          </BottomBar>
        </div>
      </Section>

      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title="Add group"
        footer={
          <BottomBar>
            <Button onClick={() => setSheet(false)}>Save group</Button>
          </BottomBar>
        }
      >
        <div className="flex flex-col gap-4 pb-4">
          <TextField label="Exam subject" defaultValue="Maths" />
        </div>
      </Modal>
      <Modal
        open={dialog}
        onClose={() => setDialog(false)}
        title="Export"
        variant="dialog"
        maxWidth={560}
        footer={
          <BottomBar row className="justify-end">
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialog(false)}>
              <DownloadIcon /> Export 2 files
            </Button>
          </BottomBar>
        }
      >
        <p className="text-[14px] text-ink2">
          Files are made on this device and saved to your downloads.
        </p>
      </Modal>
    </div>
  );
}
