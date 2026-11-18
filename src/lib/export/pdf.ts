import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { distinctSubjects } from "@/lib/groups";
import { usableSeats } from "@/lib/rooms";
import type { Group, Layout, Room } from "@/lib/seating/seating";
import { buildSubjectMap } from "@/lib/subjects";

export type PaperSize = "a4" | "letter";

/** Page size in PostScript points (1/72 inch). */
export const PAPER: Record<PaperSize, readonly [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

/*
 * Print palette. The light tints stay light on purpose: on a black-and-white printer the
 * subject letter and the cell borders carry the meaning, never the colour.
 */
const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return rgb((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const INK = hex("#1B1F2A");
const INK2 = hex("#5A5F6B");
const RULE2 = hex("#8E887A");
const WHITE = hex("#FFFFFF");
const TINTS = [hex("#DDE4F3"), hex("#EFD3A0"), hex("#BFC8B8")];

export interface PdfInput {
  planName: string;
  rooms: Room[];
  layout: Layout;
  groups: Group[];
  paper: PaperSize;
}

/** The built-in fonts only cover Latin text; anything else would throw, so it becomes "?". */
function safe(font: PDFFont, text: string): string {
  let out = "";
  for (const ch of text) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

/** Draws text with extra space between letters (pdf-lib has no letter-spacing). */
function spaced(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  centerX: number,
  y: number,
  spacing: number,
) {
  const chars = [...text];
  const widths = chars.map((c) => font.widthOfTextAtSize(c, size));
  const total =
    widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  chars.forEach((c, i) => {
    page.drawText(c, { x, y, size, font, color: INK });
    x += widths[i] + spacing;
  });
}

export async function buildSeatingPdf(input: PdfInput): Promise<Uint8Array> {
  const { planName, rooms, layout, groups, paper } = input;
  const doc = await PDFDocument.create();
  doc.setTitle(`${planName}, seating layout`);
  doc.setCreator("Seduta");
  doc.setProducer("Seduta");

  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);

  const subjects = buildSubjectMap(distinctSubjects(groups));
  const [W, H] = PAPER[paper];
  const M = 40;
  const total = rooms.length;

  rooms.forEach((room, index) => {
    const grid = layout[room.id] ?? [];
    const page = doc.addPage([W, H]);
    const disabled = new Set(room.disabled);
    const seated = grid.flat().filter(Boolean).length;

    // Header: plan name left, room count right
    page.drawText(safe(mono, planName), {
      x: M,
      y: H - M - 8,
      size: 9,
      font: mono,
      color: INK2,
      maxWidth: W - 2 * M - 80,
    });
    const rightText = `${total} ${total === 1 ? "room" : "rooms"}`;
    page.drawText(rightText, {
      x: W - M - mono.widthOfTextAtSize(rightText, 9),
      y: H - M - 8,
      size: 9,
      font: mono,
      color: INK2,
    });

    // Room title and counts
    page.drawText(safe(sansBold, room.name), {
      x: M,
      y: H - M - 44,
      size: 24,
      font: sansBold,
      color: INK,
    });
    page.drawText(
      `${room.rows} ${room.rows === 1 ? "row" : "rows"} · ${usableSeats(room)} seats · ${seated} students`,
      { x: M, y: H - M - 64, size: 10.5, font: mono, color: INK2 },
    );

    // Grid geometry: shrink the cells until the whole room fits the page
    const gridTop = H - M - 100;
    const footerY = M;
    const availW = W - 2 * M;
    const availH = gridTop - (footerY + 40) - 26; // board bar and spacing
    const spb = Math.max(1, room.seatsPerBench);
    const gapBefore = (c: number) => (c === 0 ? 0 : c % spb === 0 ? 8 : 2);
    let gaps = 0;
    for (let c = 0; c < room.cols; c++) gaps += gapBefore(c);
    const rowGap = 5;
    const cellW = Math.max(
      10,
      Math.min(64, Math.floor((availW - gaps) / room.cols)),
    );
    const cellH = Math.max(
      12,
      Math.min(cellW * 0.85, (availH - (room.rows - 1) * rowGap) / room.rows),
    );
    const gridW = room.cols * cellW + gaps;
    const gridX = (W - gridW) / 2;

    // Board bar
    const boardY = gridTop - 18;
    page.drawRectangle({
      x: gridX,
      y: boardY,
      width: gridW,
      height: 18,
      borderColor: INK,
      borderWidth: 1,
      color: WHITE,
    });
    spaced(page, monoBold, "BOARD", 8, W / 2, boardY + 6, 2.4);

    // Seats
    const longest = Math.max(
      1,
      ...grid.flat().map((s) => (s ? s.label.length : 0)),
    );
    const codeSize = Math.min(9, (cellW - 4) / (longest * 0.6));
    const showCode = codeSize >= 5.5 && cellH >= 22;
    const letterSize = Math.min(12, cellH * 0.34);

    for (let r = 0; r < room.rows; r++) {
      const y = boardY - 12 - (r + 1) * cellH - r * rowGap;
      let x = gridX;
      for (let c = 0; c < room.cols; c++) {
        x += gapBefore(c);
        const student = grid[r]?.[c] ?? null;
        const off = disabled.has(`${r},${c}`);
        if (off) {
          page.drawRectangle({
            x,
            y,
            width: cellW,
            height: cellH,
            borderColor: INK2,
            borderWidth: 0.8,
            borderDashArray: [2, 2],
            color: WHITE,
          });
          const w = mono.widthOfTextAtSize("×", 10);
          page.drawText("×", {
            x: x + (cellW - w) / 2,
            y: y + cellH / 2 - 3.5,
            size: 10,
            font: mono,
            color: INK2,
          });
        } else if (student) {
          const info = subjects.get(student.subject);
          page.drawRectangle({
            x,
            y,
            width: cellW,
            height: cellH,
            borderColor: RULE2,
            borderWidth: 0.8,
            color: info ? TINTS[info.tint - 1] : WHITE,
          });
          const letter = safe(sansBold, info?.letter ?? "?");
          const lw = sansBold.widthOfTextAtSize(letter, letterSize);
          const letterY = showCode
            ? y + cellH * 0.55
            : y + (cellH - letterSize * 0.7) / 2;
          page.drawText(letter, {
            x: x + (cellW - lw) / 2,
            y: letterY,
            size: letterSize,
            font: sansBold,
            color: INK,
          });
          if (showCode) {
            const code = safe(monoBold, student.label);
            const cw = monoBold.widthOfTextAtSize(code, codeSize);
            page.drawText(code, {
              x: x + (cellW - cw) / 2,
              y: y + cellH * 0.18,
              size: codeSize,
              font: monoBold,
              color: INK,
            });
          }
        } else {
          page.drawRectangle({
            x,
            y,
            width: cellW,
            height: cellH,
            borderColor: RULE2,
            borderWidth: 0.6,
            color: WHITE,
          });
        }
        x += cellW;
      }
    }

    // Footer: legend left, page number right
    const pageText = `${index + 1} / ${total}`;
    const pw = mono.widthOfTextAtSize(pageText, 9);
    page.drawText(pageText, {
      x: W - M - pw,
      y: footerY,
      size: 9,
      font: mono,
      color: INK2,
    });
    const legend = safe(
      mono,
      [...subjects].map(([name, info]) => `${info.letter} ${name}`).join(" · "),
    );
    let legendSize = 9;
    const maxLegend = W - 2 * M - pw - 16;
    while (
      legendSize > 6 &&
      mono.widthOfTextAtSize(legend, legendSize) > maxLegend
    )
      legendSize -= 0.5;
    page.drawText(legend, {
      x: M,
      y: footerY,
      size: legendSize,
      font: mono,
      color: INK2,
      maxWidth: maxLegend,
    });
  });

  return doc.save();
}
