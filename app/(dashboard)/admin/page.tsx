import Link from "next/link";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  Share2,
  BarChart3,
  ScrollText,
} from "lucide-react";

const cards = [
  {
    title: "Users",
    desc: "Create and assign managers",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Cycles",
    desc: "Configure goal-setting phases",
    href: "/admin/cycles",
    icon: Calendar,
  },
  {
    title: "Shared Goals",
    desc: "Push KPIs to employees",
    href: "/admin/shared-goals",
    icon: Share2,
  },
  {
    title: "Reports",
    desc: "Achievement and completion",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Audit Trail",
    desc: "Full action log",
    href: "/admin/audit",
    icon: ScrollText,
  },
];

export default function AdminHomePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Manage users, cycles, shared goals, and organization-wide reports.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <Icon className="h-8 w-8 text-[#1E40AF]" />
                <h2 className="mt-3 font-semibold text-[#0F172A]">{item.title}</h2>
                <p className="mt-1 text-sm text-[#64748B]">{item.desc}</p>
                <span
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "mt-3 h-auto p-0 text-[#1E40AF]"
                  )}
                >
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}

