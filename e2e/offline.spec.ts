import { expect, test } from "@playwright/test";

// This file needs the real service worker, which the other tests switch off.
test.use({ serviceWorkers: "allow" });

test("airplane mode: open the app, create a plan, generate and export", async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "one layout is enough for the offline check",
  );

  // First visit, online: the worker installs and saves every page.
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const names = await caches.keys();
          const cache = await caches.open(names[0]);
          return (await cache.keys()).map((r) => new URL(r.url).pathname);
        }),
      { timeout: 30_000 },
    )
    .toEqual(
      expect.arrayContaining(["/", "/setup", "/layout", "/review", "/rooms"]),
    );

  // Reload once so the page is controlled by the worker, then lose the network.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Seating plans", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);

  // Plans live on the device, so everything still works.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Seating plans", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New seating plan" }).click();
  await page.getByLabel("Plan name").fill("Offline exam");

  await page.getByRole("button", { name: "Add group" }).click();
  await page.locator('#groups [aria-label^="Branch"]').first().fill("CSE");
  await page
    .locator('#groups [aria-label^="Last roll number"]')
    .first()
    .fill("12");
  await page.locator('#groups [aria-label^="Subject"]').first().fill("Maths");
  await page.getByRole("button", { name: "Add group" }).click();
  await page.locator('#groups [aria-label^="Branch"]').nth(1).fill("ECE");
  await page
    .locator('#groups [aria-label^="Last roll number"]')
    .nth(1)
    .fill("12");
  await page.locator('#groups [aria-label^="Subject"]').nth(1).fill("Physics");
  await page.getByRole("button", { name: "New room" }).click();

  await page.getByRole("button", { name: "Generate seating" }).click();
  await expect(page).toHaveURL(/\/layout\?plan=/);
  await expect(
    page.getByRole("button", { name: /^Row 1, seat 1,/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Export" }).click();
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page
    .getByRole("dialog", { name: "Export" })
    .getByRole("button", { name: "Export 2 files" })
    .click();
  await expect.poll(() => downloads.length, { timeout: 15_000 }).toBe(2);
});
