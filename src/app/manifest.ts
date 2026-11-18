import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${APP_NAME}: exam seating plans`,
    short_name: APP_NAME,
    description:
      "Seat students in exam rooms so nobody sits next to the same subject. Works offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#F4F1EA",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
