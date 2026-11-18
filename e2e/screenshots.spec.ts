import { test, type Page } from "@playwright/test";

/**
 * Makes the README pictures. Not part of the normal run:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
 */
test.skip(!process.env.SCREENSHOTS, "only when SCREENSHOTS=1");
test.use({ colorScheme: "light" });

const OUT = "docs/screenshots";

const groups = [
  {
    id: "g1",
    label: "2nd yr · CSE",
    primary: "2nd year",
    secondary: "CSE",
    subject: "Maths",
    prefix: "24CS",
    from: 1,
    to: 60,
    exclude: [13, 44],
    pad: 3,
  },
  {
    id: "g2",
    label: "2nd yr · ECE",
    primary: "2nd year",
    secondary: "ECE",
    subject: "Physics",
    prefix: "24EC",
    from: 1,
    to: 48,
    pad: 3,
  },
  {
    id: "g3",
    label: "2nd yr · ME",
    primary: "2nd year",
    secondary: "ME",
    subject: "Chemistry",
    prefix: "24ME",
    from: 1,
    to: 30,
    pad: 3,
  },
];
const rooms = [
  {
    id: "r1",
    name: "Room 101",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: ["0,0"],
  },
  {
    id: "r2",
    name: "Room 102",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
  {
    id: "r3",
    name: "Room 103",
    rows: 6,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
  {
    id: "r4",
    name: "Room 104",
    rows: 5,
    cols: 6,
    seatsPerBench: 2,
    disabled: [],
  },
];

/** Puts the sample plan straight into the app's database, then returns its id. */
async function seed(page: Page): Promise<string> {
  await page.goto("/");
  await page.getByRole("button", { name: "New seating plan" }).click();
  await page.waitForURL(/\/(setup|)\?plan=/);
  const id = new URL(page.url()).searchParams.get("plan")!;
  await page.evaluate(
    async ({ id, groups, rooms }) => {
      const db = await new Promise<IDBDatabase>((res, rej) => {
        const r = indexedDB.open("seduta");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      await new Promise<void>((res, rej) => {
        const tx = db.transaction("plans", "readwrite");
        const store = tx.objectStore("plans");
        const get = store.get(id);
        get.onsuccess = () => {
          store.put({
            ...get.result,
            name: "Mid-semester exam",
            groups,
            rooms,
          });
        };
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
      db.close();
    },
    { id, groups, rooms },
  );
  return id;
}

test("desktop pictures", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  const id = await seed(page);

  await page.goto(`/setup?plan=${id}`);
  await page.getByRole("button", { name: "Generate seating" }).waitFor();
  await page.screenshot({ path: `${OUT}/workspace.png` });

  await page.getByRole("button", { name: "Generate seating" }).click();
  await page.waitForURL(/\/layout/);
  const seat = (r: number, c: number) =>
    page.getByRole("button", { name: new RegExp(`^Row ${r}, seat ${c},`) });
  await seat(3, 1).waitFor();
  // one deliberate mistake, so the screenshot shows a clash and the suggestions
  await seat(3, 1).click();
  await seat(3, 2).click();
  await seat(3, 1).click();
  await page.screenshot({ path: `${OUT}/editor-desktop.png` });

  await page.getByRole("button", { name: "Export" }).click();
  await page.getByRole("dialog", { name: "Export" }).waitFor();
  await page.screenshot({ path: `${OUT}/export-desktop.png` });
});

test("phone pictures", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const id = await seed(page);

  await page.goto(`/review?plan=${id}`);
  await page.getByRole("button", { name: "Generate seating" }).waitFor();
  await page.screenshot({ path: `${OUT}/review-phone.png` });

  await page.getByRole("button", { name: "Generate seating" }).click();
  await page.waitForURL(/\/layout/);
  const seat = (r: number, c: number) =>
    page.getByRole("button", { name: new RegExp(`^Row ${r}, seat ${c},`) });
  await seat(3, 1).waitFor();
  await seat(3, 1).click();
  await seat(3, 2).click();
  await page.screenshot({ path: `${OUT}/editor-phone.png` });
  await seat(3, 1).click();
  await page.screenshot({ path: `${OUT}/editor-phone-selected.png` });
  await context.close();
});
