"use client";

import Link from "next/link";
import { useManagerTeam } from "@/hooks/useManagerTeam";
import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Loader2, ChevronRight } from "lucide-react";

export function TeamDashboard() {
  const { data, loading, error } = useManagerTeam();

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading team...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  const members = data?.members ?? [];

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No team members"
        description="Employees assigned to you as manager will appear here."
      />
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <article
          key={member.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <header className="flex items-start justify-between">
            <section>
              <h3 className="font-semibold text-[#0F172A]">{member.name}</h3>
              <p className="text-xs text-[#64748B]">{member.department}</p>
              <p className="text-xs text-[#64748B]">{member.email}</p>
            </section>
          </header>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <section>
              <dt className="text-xs text-[#64748B]">Total goals</dt>
              <dd className="font-semibold text-[#0F172A]">{member.goalsTotal}</dd>
            </section>
            <section>
              <dt className="text-xs text-[#64748B]">Pending approval</dt>
              <dd className="font-semibold text-[#D97706]">
                {member.goalsPending}
              </dd>
            </section>
            <section>
              <dt className="text-xs text-[#64748B]">Approved</dt>
              <dd className="font-semibold text-[#16A34A]">
                {member.goalsApproved}
              </dd>
            </section>
            <section>
              <dt className="text-xs text-[#64748B]">Check-ins</dt>
              <dd className="font-semibold text-[#0F172A]">
                {member.checkinsDone}/{member.checkinsExpected}
              </dd>
            </section>
          </dl>

          <footer className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href={`/manager/team/${member.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-between"
              )}
            >
              View goals
              <ChevronRight className="h-4 w-4" />
            </Link>
          </footer>
        </article>
      ))}
    </section>
  );
}
