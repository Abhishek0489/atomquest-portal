import { NextResponse } from "next/server";
import type { CheckinPeriod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { getReporteeIds } from "@/lib/manager-access";

const CHECKIN_PERIODS: CheckinPeriod[] = ["Q1", "Q2", "Q3", "Q4_ANNUAL"];

export async function GET(request: Request) {
  const { error, session } = await requireSession(["ADMIN", "MANAGER"]);
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const cycleIdParam = searchParams.get("cycleId");

  const activeCycle = await getActiveCycle();
  const cycleId = cycleIdParam || activeCycle?.id;

  if (!cycleId) {
    return NextResponse.json({ employees: [], rollup: null, cycle: null });
  }

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });

  let employeeWhere: { role: "EMPLOYEE"; id?: { in: string[] } } = {
    role: "EMPLOYEE",
  };

  if (session.user.role === "MANAGER") {
    const reporteeIds = await getReporteeIds(session.user.id);
    employeeWhere = { role: "EMPLOYEE", id: { in: reporteeIds } };
  }

  const employees = await prisma.user.findMany({
    where: employeeWhere,
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      manager: { select: { id: true, name: true } },
      goals: {
        where: { cycleId, sharedFromId: null },
        select: {
          id: true,
          status: true,
          checkins: { select: { period: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const employeeRows = employees.map((emp) => {
    const goals = emp.goals;
    const approvedGoals = goals.filter(
      (g) => g.status === "APPROVED" || g.status === "LOCKED"
    );
    const goalsSet =
      goals.length > 0 &&
      goals.reduce((sum, g) => sum + (g.status !== "DRAFT" ? 1 : 0), 0) > 0;

    const periodDone: Record<CheckinPeriod, boolean> = {
      Q1: false,
      Q2: false,
      Q3: false,
      Q4_ANNUAL: false,
    };

    for (const period of CHECKIN_PERIODS) {
      if (approvedGoals.length === 0) {
        periodDone[period] = false;
        continue;
      }
      const goalsWithPeriod = approvedGoals.filter((g) =>
        g.checkins.some((c) => c.period === period)
      );
      periodDone[period] = goalsWithPeriod.length === approvedGoals.length;
    }

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      managerName: emp.manager?.name ?? null,
      goalsCount: goals.length,
      goalsSet,
      q1Done: periodDone.Q1,
      q2Done: periodDone.Q2,
      q3Done: periodDone.Q3,
      q4Done: periodDone.Q4_ANNUAL,
    };
  });

  const total = employeeRows.length;
  const rollup =
    total > 0
      ? {
          goalsSetPct: Math.round(
            (employeeRows.filter((e) => e.goalsSet).length / total) * 100
          ),
          q1Pct: Math.round(
            (employeeRows.filter((e) => e.q1Done).length / total) * 100
          ),
          q2Pct: Math.round(
            (employeeRows.filter((e) => e.q2Done).length / total) * 100
          ),
          q3Pct: Math.round(
            (employeeRows.filter((e) => e.q3Done).length / total) * 100
          ),
          q4Pct: Math.round(
            (employeeRows.filter((e) => e.q4Done).length / total) * 100
          ),
          totalEmployees: total,
        }
      : null;

  return NextResponse.json({ employees: employeeRows, rollup, cycle });
}
