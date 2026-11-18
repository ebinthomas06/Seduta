import { expect, test, type Page } from "@playwright/test";

/**
 * The whole job, as a teacher does it: make a plan, add who is writing and where, generate,
 * break the seating on purpose, repair it, export. Run once on a phone and once on a desktop.
 * Both layouts are driven through the real screens; nothing is seeded behind the scenes.
 */

const PLAN = "E2E mid-semester";

/** The plan list renders a phone list and a desktop table; only one is visible. */
const visibleText = (page: Page, text: string) =>
  page.getByText(text).locator("visible=true").first();

const seat = (page: Page, row: number, col: number) =>
  page.getByRole("button", { name: new RegExp(`^Row ${row}, seat ${col},`) });

/** Phone: one step per screen. */
async function buildPlanOnPhone(page: Page) {
  await page.getByRole("button", { name: "New seating plan" }).click();
  await page.getByLabel("Plan name").fill(PLAN);
  await page.getByRole("link", { name: "Next: Groups" }).click();

  const groups: [string, string, string][] = [
    ["CSE", "12", "Maths"],
    ["ECE", "12", "Physics"],
  ];
  for (const [branch, to, subject] of groups) {
    await page.getByRole("button", { name: "Add group" }).click();
    const sheet = page.getByRole("dialog", { name: "Add group" });
    await sheet.getByLabel("Branch", { exact: true }).fill(branch);
    await sheet.getByLabel("Roll to").fill(to);
    await sheet.getByLabel("Exam subject").fill(subject);
    await sheet.getByRole("button", { name: "Save group" }).click();
    await expect(page.getByText(`${to} students`).first()).toBeVisible();
  }
  await page.getByRole("link", { name: "Next: Rooms" }).click();

  await page.getByRole("link", { name: "New room" }).click();
  await page.getByRole("button", { name: "Save room" }).click();
  await expect(page.getByText("36 seats").first()).toBeVisible();
  await page.getByRole("link", { name: "Next: Review" }).click();

  await page.getByRole("button", { name: "Generate seating" }).click();
}

/** Desktop: everything on one page. */
async function buildPlanOnDesktop(page: Page) {
  await page.getByRole("button", { name: "New seating plan" }).click();
  await page.getByLabel("Plan name").fill(PLAN);

  const groups: [string, string, string][] = [
    ["CSE", "12", "Maths"],
    ["ECE", "12", "Physics"],
  ];
  for (const [i, [branch, to, subject]] of groups.entries()) {
    await page.getByRole("button", { name: "Add group" }).click();
    await page.locator('#groups [aria-label^="Branch"]').nth(i).fill(branch);
    await page
      .locator('#groups [aria-label^="Last roll number"]')
      .nth(i)
      .fill(to);
    await page.locator('#groups [aria-label^="Subject"]').nth(i).fill(subject);
  }
  await page.getByRole("button", { name: "New room" }).click();
  await expect(
    page.getByLabel("Summary").getByText("36", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Generate seating" }).click();
}

test("create a plan, generate, break and fix the seating, export", async ({
  page,
}, testInfo) => {
  const phone = testInfo.project.name === "phone";
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Seating plans", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No seating plans yet")).toBeVisible();

  await (phone ? buildPlanOnPhone(page) : buildPlanOnDesktop(page));

  // Generated: the editor opens with a clean room.
  await expect(page).toHaveURL(/\/layout\?plan=/);
  await expect(seat(page, 1, 1)).toBeVisible();
  await expect(
    page.getByText(/No clashes in this room|0 clashes/).first(),
  ).toBeVisible();

  // Break it: swap seat 2 with seat 3 in the first row, which puts equal subjects together.
  await seat(page, 1, 2).click();
  await seat(page, 1, 3).click();
  await expect(page.getByText(/[1-9]\d* clash(es)?/).first()).toBeVisible();
  await expect(seat(page, 1, 2)).toHaveAccessibleName(
    /clashes with a neighbour/,
  );

  // Fix it: rearrange the room (it asks first), and the clashes go.
  await page.getByRole("button", { name: "Rearrange this room" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Rearrange" })
    .click();
  await expect(page.getByText("No clashes in this room").first()).toBeVisible();

  // Undo brings the clash back, so the history works.
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText(/[1-9]\d* clash(es)?/).first()).toBeVisible();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.getByText("No clashes in this room").first()).toBeVisible();

  // Autosave: a reload keeps the layout.
  await page.reload();
  await expect(seat(page, 1, 1)).toBeVisible();
  await expect(page.getByText("No clashes in this room").first()).toBeVisible();

  // Export both files.
  await page.getByRole("button", { name: "Export" }).click();
  const dialog = page.getByRole("dialog", { name: "Export" });
  await expect(
    dialog.getByRole("button", { name: "Export 2 files" }),
  ).toBeVisible();
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await dialog.getByRole("button", { name: "Export 2 files" }).click();
  await expect.poll(() => downloads.length, { timeout: 15_000 }).toBe(2);
  expect(downloads.sort()).toEqual([
    `${PLAN}, layout.pdf`,
    `${PLAN}, rooms.docx`,
  ]);

  // The plan is listed as ready.
  await page.goto("/");
  await expect(visibleText(page, PLAN)).toBeVisible();
  await expect(visibleText(page, "Ready")).toBeVisible();
});

test("desktop: dragging one seat onto another swaps them", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "drag is a desktop feature");
  await page.goto("/");
  await buildPlanOnDesktop(page);
  await expect(page.getByText("No clashes in this room").first()).toBeVisible();

  const a = await seat(page, 1, 2).boundingBox();
  const b = await seat(page, 1, 3).boundingBox();
  if (!a || !b) throw new Error("seats not found");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 20, b.y + b.height / 2, {
    steps: 8,
  });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.mouse.up();

  await expect(page.getByText(/[1-9]\d* clash(es)?/).first()).toBeVisible();
});

test("backup downloads a file and restore brings a plan back", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "same code on both layouts");
  await page.goto("/");
  await page.getByRole("button", { name: "New seating plan" }).click();
  await page.getByLabel("Plan name").fill("Backup me");
  await page.goto("/");
  await expect(visibleText(page, "Backup me")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download backup" }).click(),
  ]);
  const path = await download.path();
  expect(download.suggestedFilename()).toMatch(
    /^Seduta backup \d{4}-\d{2}-\d{2}\.json$/,
  );

  // Delete the plan, then restore it from the file.
  await page.getByRole("button", { name: "Delete Backup me" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete plan" })
    .click();
  await expect(page.getByText("No seating plans yet")).toBeVisible();

  await page.getByLabel("Choose a backup file").setInputFiles(path);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore" })
    .click();
  await expect(visibleText(page, "Backup me")).toBeVisible();
});

test("the sun/moon button switches between light and dark and remembers it", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const html = page.locator("html");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("a first visit is light even when the device prefers dark", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 241, 234)",
  );

  // From then on it follows their choice.
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(20, 22, 27)",
  );
});
