import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "Remira",
    short_name: "Remira",
    description: "Personal reminders and notes for medical students.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0F766E",
    background_color: "#F7FAF9",
    categories: ["productivity", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "New reminder", url: "/reminders/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "New note", url: "/notes/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
