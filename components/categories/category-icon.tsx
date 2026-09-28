import { createElement } from "react";
import {
  BookOpen, Bone, Brain, CalendarCheck, ClipboardList, FlaskConical, Folder, GraduationCap, HeartPulse,
  Hospital, Lightbulb, Microscope, Pill, Star, Stethoscope, Syringe, Tag, User, Users, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { categoryStyle } from "@/lib/categories";
import type { Category } from "@/types/category";

const ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen, stethoscope: Stethoscope, "clipboard-list": ClipboardList, "graduation-cap": GraduationCap,
  "flask-conical": FlaskConical, users: Users, user: User, bone: Bone, pill: Pill, "heart-pulse": HeartPulse,
  brain: Brain, microscope: Microscope, hospital: Hospital, syringe: Syringe, "calendar-check": CalendarCheck,
  star: Star, folder: Folder, lightbulb: Lightbulb,
};

/** Renders a category icon by name (stable module-level components, no per-render component creation). */
export function CategoryGlyph({ name, className }: { name: string | null | undefined; className?: string }) {
  return createElement((name && ICONS[name]) || Tag, { className, "aria-hidden": true });
}

export function CategoryBadge({ category, className }: { category: Category | null | undefined; className?: string }) {
  if (!category) return null;
  return (
    <span
      style={categoryStyle(category.color)}
      className={cn("cat-tint inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold", className)}
    >
      <CategoryGlyph name={category.icon} className="size-3 shrink-0" />
      <span className="truncate">{category.name}</span>
    </span>
  );
}

export function CategoryAvatar({ category, className }: { category: Category | null | undefined; className?: string }) {
  return (
    <span style={categoryStyle(category?.color)} className={cn("cat-tint grid size-10 shrink-0 place-items-center rounded-2xl", className)}>
      <CategoryGlyph name={category?.icon} className="size-5" />
    </span>
  );
}
