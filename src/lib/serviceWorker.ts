/** Pages the app saves for offline use. Each must be a static page under src/app. */
export const OFFLINE_PAGES = [
  "/",
  "/setup",
  "/groups",
  "/rooms",
  "/room",
  "/review",
  "/layout",
] as const;

/** Files that are always saved alongside the pages. */
export const OFFLINE_FILES = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
] as const;

/**
 * The service worker, as source text served at /sw.js. It has no dependencies, so it can be
 * served by a static host.
 *
 * - On install it saves every page and the scripts, styles and fonts those pages use.
 * - Page loads try the network first (so updates arrive) and fall back to the saved copy.
 *   Every plan page is the same static shell (the plan comes from the address), so one saved
 *   copy per page serves every plan.
 * - Hashed build files are served from the saved copy first.
 * - Data requests used for in-app navigation are left alone. When they fail offline the app
 *   falls back to loading the page normally, which the worker answers from its saved copy.
 */
export function buildServiceWorker(buildId: string): string {
  return String.raw`/* Seduta service worker, build ${buildId} */
const CACHE = "seduta-${buildId}";
const PAGES = ${JSON.stringify(OFFLINE_PAGES)};
const FILES = ${JSON.stringify(OFFLINE_FILES)};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("seduta-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function precache() {
  const cache = await caches.open(CACHE);
  const assets = new Set(FILES);
  for (const page of PAGES) {
    try {
      const res = await fetch(page, { cache: "reload" });
      if (!res.ok) continue;
      await cache.put(page, res.clone());
      const html = await res.text();
      for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)<>]+/g)) assets.add(m[0]);
      // Chunk lists inside the page data are written without the /_next/ prefix.
      for (const m of html.matchAll(/static\/(?:chunks|css|media)\/[^"'\\\s)<>]+/g)) assets.add("/_next/" + m[0]);
    } catch (e) { /* offline during install: the page is saved on its first visit instead */ }
  }
  await Promise.all([...assets].map(async (asset) => {
    try {
      const res = await fetch(asset);
      if (res.ok) await cache.put(asset, res);
    } catch (e) { /* ignore */ }
  }));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(navigate(req, url));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(req));
  }
});

async function navigate(req, url) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") cache.put(url.pathname, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(url.pathname)) || (await cache.match("/")) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
`;
}
