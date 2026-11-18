/**
 * Every screen is a static page that takes the plan in the query string (`/setup?plan=abc`)
 * instead of a dynamic path. Static pages can be saved by the service worker, so the whole app
 * works offline and can be hosted on any static host.
 */
export const routes = {
  home: "/",
  setup: (planId: string) => `/setup?plan=${encodeURIComponent(planId)}`,
  groups: (planId: string) => `/groups?plan=${encodeURIComponent(planId)}`,
  rooms: (planId: string) => `/rooms?plan=${encodeURIComponent(planId)}`,
  /** roomId may be "new" to add a room. */
  room: (planId: string, roomId: string) =>
    `/room?plan=${encodeURIComponent(planId)}&room=${encodeURIComponent(roomId)}`,
  review: (planId: string) => `/review?plan=${encodeURIComponent(planId)}`,
  layout: (planId: string) => `/layout?plan=${encodeURIComponent(planId)}`,
} as const;
