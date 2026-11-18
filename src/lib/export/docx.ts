import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ITableCellOptions,
} from "docx";
import type { Group, Layout, Room } from "@/lib/seating/seating";
import type { PaperSize } from "./pdf";
import { buildRoomSummary } from "./summary";

/** Page sizes in twips (1/1440 inch). */
const PAGE: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
};
const MARGIN = 1080; // 0.75 inch

const FONT = "Arial";
const MONO = "Courier New";
const WASH = "ECE8DD";
const SOFT = "F7F5F0";

export interface DocxInput {
  planName: string;
  rooms: Room[];
  layout: Layout;
  groups: Group[];
  paper: PaperSize;
}

const line = { style: BorderStyle.SINGLE, size: 4, color: "8E887A" };
const borders = { top: line, bottom: line, left: line, right: line };

function cell(
  width: number,
  children: Paragraph[],
  extra: Partial<ITableCellOptions> = {},
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children,
    ...extra,
  });
}

const text = (
  value: string,
  o: { bold?: boolean; mono?: boolean; size?: number; color?: string } = {},
) =>
  new TextRun({
    text: value,
    bold: o.bold,
    font: o.mono ? MONO : FONT,
    size: o.size ?? 20,
    color: o.color,
  });

const para = (runs: TextRun[], right = false) =>
  new Paragraph({
    children: runs,
    alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
  });

/** The room-wise ranges document: one table, a total per room and a grand total. */
export async function buildRoomsDocx(input: DocxInput): Promise<Uint8Array> {
  const { planName, rooms, layout, groups, paper } = input;
  const summary = buildRoomSummary(rooms, layout, groups);

  const page = PAGE[paper];
  const usable = page.width - 2 * MARGIN;
  const cols = [
    Math.round(usable * 0.17),
    Math.round(usable * 0.25),
    Math.round(usable * 0.46),
  ];
  cols.push(usable - cols[0] - cols[1] - cols[2]);

  const header = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: ["Room", "Group", "Roll numbers", "Count"].map((label, i) =>
      cell(cols[i], [para([text(label, { bold: true, size: 18 })], i === 3)], {
        shading: { type: ShadingType.CLEAR, fill: WASH, color: "auto" },
      }),
    ),
  });

  const body: TableRow[] = [];
  for (const section of summary.sections) {
    if (section.rows.length === 0) {
      body.push(
        new TableRow({
          cantSplit: true,
          children: [
            cell(cols[0], [para([text(section.room, { bold: true })])]),
            cell(cols[1], [
              para([text("No students seated", { color: "5A5F6B" })]),
            ]),
            cell(cols[2], [para([text("")])]),
            cell(cols[3], [para([text("0", { mono: true })], true)]),
          ],
        }),
      );
      continue;
    }
    section.rows.forEach((row, i) =>
      body.push(
        new TableRow({
          cantSplit: true,
          children: [
            cell(cols[0], [
              para([text(i === 0 ? section.room : "", { bold: true })]),
            ]),
            cell(cols[1], [
              para([text(row.group)]),
              para([text(row.subject, { size: 17, color: "5A5F6B" })]),
            ]),
            cell(cols[2], [para([text(row.rolls, { mono: true, size: 19 })])]),
            cell(cols[3], [
              para([text(String(row.count), { mono: true })], true),
            ]),
          ],
        }),
      ),
    );
    body.push(
      new TableRow({
        cantSplit: true,
        children: [
          cell(cols[0], [para([text("")])], {
            shading: { type: ShadingType.CLEAR, fill: SOFT, color: "auto" },
          }),
          cell(
            cols[1],
            [para([text(`${section.room} total`, { bold: true, size: 18 })])],
            { shading: { type: ShadingType.CLEAR, fill: SOFT, color: "auto" } },
          ),
          cell(cols[2], [para([text("")])], {
            shading: { type: ShadingType.CLEAR, fill: SOFT, color: "auto" },
          }),
          cell(
            cols[3],
            [
              para(
                [text(String(section.total), { bold: true, mono: true })],
                true,
              ),
            ],
            { shading: { type: ShadingType.CLEAR, fill: SOFT, color: "auto" } },
          ),
        ],
      }),
    );
  }

  const grand = new TableRow({
    cantSplit: true,
    children: [
      cell(cols[0], [para([text("Total", { bold: true })])], {
        shading: { type: ShadingType.CLEAR, fill: WASH, color: "auto" },
      }),
      cell(cols[1], [para([text("All rooms", { bold: true, size: 18 })])], {
        shading: { type: ShadingType.CLEAR, fill: WASH, color: "auto" },
      }),
      cell(cols[2], [para([text("")])], {
        shading: { type: ShadingType.CLEAR, fill: WASH, color: "auto" },
      }),
      cell(
        cols[3],
        [
          para(
            [text(String(summary.grandTotal), { bold: true, mono: true })],
            true,
          ),
        ],
        { shading: { type: ShadingType.CLEAR, fill: WASH, color: "auto" } },
      ),
    ],
  });

  const doc = new Document({
    creator: "Seduta",
    title: `${planName}, room allocation`,
    sections: [
      {
        properties: {
          page: {
            size: { width: page.width, height: page.height },
            margin: {
              top: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
              right: MARGIN,
            },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 240 },
            children: [
              text(`${planName} · Room allocation`, { bold: true, size: 32 }),
            ],
          }),
          new Table({
            width: { size: usable, type: WidthType.DXA },
            columnWidths: cols,
            rows: [header, ...body, grand],
          }),
        ],
      },
    ],
  });

  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
