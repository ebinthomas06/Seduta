import { buildServiceWorker } from "@/lib/serviceWorker";

const BUILD_ID = Date.now().toString(36);

export function GET() {
  return new Response(buildServiceWorker(BUILD_ID), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    },
  });
}
