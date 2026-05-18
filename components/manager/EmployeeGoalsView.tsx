"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Checkin, Cycle, Goal, User } from "@prisma/client";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { formatTarget } from "@/lib/goal-labels";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

type GoalWithCheckins = Goal & { checkins: Checkin[] };

type EmployeeDetailResponse = {
  employee: Pick<User, "id" | "name" | "email" | "department">;
  goals: GoalWithCheckins[];
  cycle: Cycle | null;
};

const PERIODS = ["Q1", "Q2", "Q3", "Q4_ANNUAL"] as const;

export function EmployeeGoalsView({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<EmployeeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/manager/team/${employeeId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load employee");
      }
      setData((await res.json()) as EmployeeDetailResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading employee goals...
      </p>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error ?? "Employee not found"}
      </p>
    );
  }

  const { employee, goals, cycle } = data;

  function checkinValue(goal: GoalWithCheckins, period: (typeof PERIODS)[number]) {
    const c = goal.checkins.find((x) => x.period === period);
    if (!c) return "—";
    if (goal.uomType === "TIMELINE" && c.actualDate) {
      return new Date(c.actualDate).toLocaleDateString();
    }
    if (c.actualValue != null) return c.actualValue.toLocaleString();
    return c.progressStatus.replace(/_/g, " ");
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <Link
          href="/manager/team"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to team
        </Link>
        <section>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{employee.name}</h1>
          <p className="text-sm text-[#64748B]">
            {employee.department} · {employee.email}
            {cycle && (
              <span className="ml-2">
                · Cycle {cycle.year} ({cycle.phase.replace(/_/g, " ")})
              </span>
            )}
          </p>
        </section>
      </header>

      <section className="grid gap-4">
        {goals.map((goal) => (
          <article
            key={goal.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <section className="flex flex-wrap items-start justify-between gap-2">
              <section>
                <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
                <p className="text-xs text-[#64748B]">{goal.thrustArea}</p>
              </section>
              <GoalStatusBadge status={goal.status} />
            </section>
            <p className="mt-2 text-sm text-[#64748B]">
              Target: {formatTarget(goal.uomType, goal.target, goal.targetDate)}{" "}
              · {goal.weightage}%
            </p>
          </article>
        ))}
      </section>

      {goals.some((g) => g.checkins.length > 0) && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">
            Planned vs actual
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Target</TableHead>
                {PERIODS.map((p) => (
                  <TableHead key={p}>{p.replace("_", " ")}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell className="max-w-[160px] truncate font-medium">
                    {goal.title}
                  </TableCell>
                  <TableCell>
                    {formatTarget(goal.uomType, goal.target, goal.targetDate)}
                  </TableCell>
                  {PERIODS.map((p) => (
                    <TableCell key={p}>{checkinValue(goal, p)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </section>
  );
}
