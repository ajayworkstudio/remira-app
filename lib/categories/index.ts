import type { CSSProperties } from "react";

export const CATEGORY_COLORS = [
  "teal", "cyan", "sky", "indigo", "violet", "pink",
  "rose", "orange", "amber", "lime", "emerald", "slate",
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const CATEGORY_ICONS = [
  "book-open", "stethoscope", "clipboard-list", "graduation-cap", "flask-conical", "users",
  "user", "bone", "pill", "heart-pulse", "brain", "microscope", "hospital", "syringe",
  "calendar-check", "star", "folder", "lightbulb",
] as const;

/** Mirrors the defaults created by the handle_new_user() trigger in the migration. */
export const DEFAULT_CATEGORIES: Array<{ name: string; icon: string; color: CategoryColor }> = [
  { name: "Study", icon: "book-open", color: "teal" },
  { name: "Clinical", icon: "stethoscope", color: "cyan" },
  { name: "Assignment", icon: "clipboard-list", color: "sky" },
  { name: "Exam", icon: "graduation-cap", color: "indigo" },
  { name: "Research", icon: "flask-conical", color: "violet" },
  { name: "Organization", icon: "users", color: "amber" },
  { name: "Personal", icon: "user", color: "slate" },
  { name: "Anatomy", icon: "bone", color: "orange" },
  { name: "Pharmacology", icon: "pill", color: "emerald" },
  { name: "Cardiology", icon: "heart-pulse", color: "rose" },
  { name: "Neurology", icon: "brain", color: "pink" },
  { name: "Pathology", icon: "microscope", color: "lime" },
  { name: "Clinical Rotation", icon: "hospital", color: "cyan" },
];

/** CSS custom-property style for a category color (tokens defined in globals.css). */
export function categoryStyle(color: string | null | undefined): CSSProperties {
  const safe = CATEGORY_COLORS.includes(color as CategoryColor) ? color : "teal";
  return { ["--cat" as string]: `var(--cat-${safe})` } as CSSProperties;
}
