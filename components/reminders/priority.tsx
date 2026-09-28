import { Flag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Priority } from "@/types/reminder";

const styles: Record<Priority, string> = {
  low: "text-prio-low",
  medium: "text-prio-medium",
  high: "text-prio-high",
};
export const PRIORITY_LABEL: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };

/** Subtle priority indicator: icon + text (never colour alone). */
export function PriorityTag({ priority, compact }: { priority: Priority; compact?: boolean }) {
  if (compact && priority === "medium") return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption font-semibold", styles[priority])}>
      <Flag className="size-3" fill={priority === "high" ? "currentColor" : "none"} aria-hidden />
      {PRIORITY_LABEL[priority]}
      {compact ? null : " priority"}
    </span>
  );
}
