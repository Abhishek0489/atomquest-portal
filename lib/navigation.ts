import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  GitBranch,
  CheckSquare,
  Users,
  Calendar,
  Share2,
  BarChart3,
  ScrollText,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const employeeNav: NavItem[] = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { label: "My Goals", href: "/employee/goals", icon: Target },
  { label: "Check-in", href: "/employee/checkin", icon: ClipboardCheck },
  { label: "Dependencies", href: "/employee/dependencies", icon: GitBranch },
];

const managerNav: NavItem[] = [
  { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { label: "Approvals", href: "/manager/approvals", icon: CheckSquare },
  { label: "Team", href: "/manager/team", icon: Users },
  { label: "Check-in", href: "/manager/checkin", icon: ClipboardCheck },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Cycles", href: "/admin/cycles", icon: Calendar },
  { label: "Shared Goals", href: "/admin/shared-goals", icon: Share2 },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Trail", href: "/admin/audit", icon: ScrollText },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  switch (role) {
    case "ADMIN":
      return adminNav;
    case "MANAGER":
      return managerNav;
    case "EMPLOYEE":
    default:
      return employeeNav;
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
      return "Employee";
    default:
      return role;
  }
}
