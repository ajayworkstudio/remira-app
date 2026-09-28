import { CalendarDays, CircleUserRound, House, ListChecks, NotebookPen, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/reminders", label: "Reminders", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export function isActive(pathname: string, href: string) {
  if (href === "/profile") return pathname.startsWith("/profile") || pathname.startsWith("/settings");
  return pathname === href || pathname.startsWith(`${href}/`);
}
