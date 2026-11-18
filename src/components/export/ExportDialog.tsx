"use client";

import { useState } from "react";
import { PdfPagePreview } from "@/components/export/PdfPagePreview";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { exportFileName, downloadBytes } from "@/lib/export/files";
import { buildSeatingPdf, type PaperSize } from "@/lib/export/pdf";
import type { Plan } from "@/lib/db/types";
import type { Snapshot } from "@/lib/editor/ops";
import { useIsDesktop } from "@/lib/useIsDesktop";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
  /** The editor's current rooms and layout, so unsaved moves are included. */
  snap: Snapshot;
}

/** M10 (bottom sheet) and D4 (dialog with previews). */
export function ExportDialog({ open, onClose, plan, snap }: ExportDialogProps) {
  const desktop = useIsDesktop();
  const [pdf, setPdf] = useState(true);
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = pdf ? 1 : 0;
  const pdfName = exportFileName(plan.name, "layout", "pdf");
  const wordName = exportFileName(plan.name, "rooms", "docx");

  async function run() {
    if (count === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (pdf) {
        const bytes = await buildSeatingPdf({
          planName: plan.name,
          rooms: snap.rooms,
          layout: snap.layout,
          groups: plan.groups,
          paper,
        });
        downloadBytes(bytes, pdfName, "application/pdf");
      }
      onClose();
    } catch {
      setError("Something went wrong while making the file. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const note = `Files are made on this ${desktop ? "computer" : "device"} and saved to your downloads.`;
  const exportLabel = (
    <>
      <DownloadIcon size={desktop ? 18 : 20} />
      Export {count} {count === 1 ? "file" : "files"}
    </>
  );

  const options = (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col border-t border-ink">
        <label className="flex items-start gap-3.5 border-b border-rule py-4">
          <input
            type="checkbox"
            checked={pdf}
            onChange={(e) => setPdf(e.target.checked)}
            aria-label="Include PDF"
            className="mt-0.5 h-6 w-6 flex-none accent-accent"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[16px] leading-tight font-semibold">
              PDF · Seating layout
            </span>
            <span className="text-[14px] leading-normal text-ink2">
              One page per room with the seat grid and roll numbers. For the
              door and the invigilator.
            </span>
            {desktop && (
              <span className="font-mono text-[12px] text-ink2">{pdfName}</span>
            )}
          </span>
          {!desktop && <PdfThumb />}
        </label>

        <label className="flex items-start gap-3.5 border-b border-rule py-4 opacity-60">
          <input
            type="checkbox"
            checked={false}
            disabled
            aria-label="Include Word document"
            className="mt-0.5 h-6 w-6 flex-none accent-accent"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[16px] leading-tight font-semibold">
              Word · Room-wise ranges
            </span>
            <span className="text-[14px] leading-normal text-ink2">
              A table of the roll number ranges sitting in each room. Editable,
              for the notice board.
            </span>
            <span className="font-mono text-[12px] text-ink2">
              {desktop ? `${wordName} · ` : ""}Coming in the next update
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[16px]" aria-hidden="true">
          Paper size
        </span>
        <SegmentedControl<PaperSize>
          legend="Paper size"
          size="sm"
          value={paper}
          onChange={setPaper}
          options={[
            { value: "a4", label: "A4" },
            { value: "letter", label: "Letter" },
          ]}
        />
      </div>

      {error && (
        <p role="alert" className="text-[14px] font-medium text-alert">
          {error}
        </p>
      )}
    </div>
  );

  if (!desktop) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Export"
        footer={
          <BottomBar>
            <Button onClick={run} disabled={count === 0 || busy}>
              {exportLabel}
            </Button>
            <p className="text-center text-[13px] leading-snug text-ink2">
              {note}
            </p>
          </BottomBar>
        }
      >
        <div className="pt-2 pb-4">{options}</div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export"
      variant="dialog"
      maxWidth={1000}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-6 py-4">
          <p className="text-[13px] text-ink2">{note}</p>
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button size="md" onClick={run} disabled={count === 0 || busy}>
              {exportLabel}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-8">
        <div className="max-w-[340px] min-w-[280px] flex-[1_1_280px]">
          {options}
        </div>
        <div className="flex min-w-0 flex-[999_1_300px] justify-center">
          <PdfPagePreview plan={plan} snap={snap} paper={paper} />
        </div>
      </div>
    </Modal>
  );
}

/** Small page icon used in the phone sheet. Always light, like the paper it stands for. */
function PdfThumb() {
  return (
    <svg
      width="44"
      height="58"
      viewBox="0 0 44 58"
      fill="none"
      aria-hidden="true"
      className="flex-none"
    >
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="57"
        fill="#FBFAF6"
        stroke="#8E887A"
      />
      <rect x="7" y="7" width="30" height="4" fill="none" stroke="#1B1F2A" />
      <g fill="#BFC8B8" stroke="#8E887A" strokeWidth="0.6">
        {[16, 24, 32, 40].flatMap((y) =>
          [7, 15, 23, 31].map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" />
          )),
        )}
      </g>
    </svg>
  );
}
