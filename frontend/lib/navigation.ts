import {
  BookOpen,
  BookOpenText,
  ChartNoAxesColumnIncreasing,
  House,
  Library,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const primaryNavigation: readonly NavigationItem[] = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/guides", icon: BookOpen, label: "Perspectives" },
  { href: "/companion", icon: MessageCircle, label: "Companion" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/journal", icon: BookOpenText, label: "Journal" },
  { href: "/insights", icon: ChartNoAxesColumnIncreasing, label: "Insights" },
];

export function isNavigationItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
