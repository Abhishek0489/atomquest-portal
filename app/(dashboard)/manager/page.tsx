import Link from "next/link";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckSquare, Users } from "lucide-react";

export default function ManagerHomePage() {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <section className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Manager Dashboard</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Review submitted goals, add check-in comments, and monitor your
            team&apos;s progress.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/manager/approvals"
            className={cn(
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
              "flex flex-col gap-3"
            )}
          >
            <CheckSquare className="h-8 w-8 text-[#1E40AF]" />
            <section>
              <h2 className="font-semibold text-[#0F172A]">Goal Approvals</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Bulk approve or return submitted goals from your reportees.
              </p>
            </section>
            <span className={cn(buttonVariants({ size: "sm" }), "w-fit bg-[#1E40AF]")}>
              Open approvals
            </span>
          </Link>

          <Link
            href="/manager/team"
            className={cn(
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
              "flex flex-col gap-3"
            )}
          >
            <Users className="h-8 w-8 text-[#7C3AED]" />
            <section>
              <h2 className="font-semibold text-[#0F172A]">Team Overview</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                View each employee&apos;s goals and check-in progress.
              </p>
            </section>
            <span
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
            >
              View team
            </span>
          </Link>
        </section>
      </section>
    </RoleGuard>
  );
}
