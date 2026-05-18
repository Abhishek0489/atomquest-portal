import { NextResponse } from "next/server";
import type { CheckinPeriod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { getReporteeIds } from "@/lib/manager-access";

const PERIODS: CheckinPeriod[] = ["Q1", "Q2", "Q3", "Q4_ANNUAL"];

export async function GET(request: Request) {
  const { error, session } = await requireSession(["ADMIN", "MANAGER"]);
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const cycleIdParam = searchParams.get("cycleId");

  const activeCycle = await getActiveCycle();
  const cycleId = cycleIdParam || activeCycle?.id;

  if (!cycleId) {
    return NextResponse.json({ rows: [], cycle: null });
  }

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } });

  let ownerFilter: { ownerId?: { in: string[] } } = {};

  if (session.user.role === "MANAGER") {
    const reporteeIds = await getReporteeIds(session.user.id);
    ownerFilter = { ownerId: { in: reporteeIds } };
  }

  const goals = await prisma.goal.findMany({
    where: {
      cycleId,
      sharedFromId: null,
      ...ownerFilter,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, department: true } },
      checkins: true,
    },
    orderBy: [{ owner: { name: "asc" } }, { title: "asc" }],
  });

  const rows = goals.map((goal) => {
    const byPeriod = Object.fromEntries(
      PERIODS.map((p) => {
        const c = goal.checkins.find((x) => x.period === p);
        return [p, c];
      })
    ) as Record<CheckinPeriod, (typeof goal.checkins)[0] | undefined>;

    const latestScore = [...goal.checkins]
      .filter((c) => c.computedScore != null)
      .sort((a, b) => PERIODS.indexOf(b.period) - PERIODS.indexOf(a.period))[0]
      ?.computedScore;

    return {
      goalId: goal.id,
      employeeId: goal.owner.id,
      employeeName: goal.owner.name,
      employeeEmail: goal.owner.email,
      department: goal.owner.department,
      goalTitle: goal.title,
      thrustArea: goal.thrustArea,
      uomType: goal.uomType,
      target: goal.target,
      targetDate: goal.targetDate,
      status: goal.status,
      q1Actual: byPeriod.Q1?.actualValue ?? null,
      q2Actual: byPeriod.Q2?.actualValue ?? null,
      q3Actual: byPeriod.Q3?.actualValue ?? null,
      q4Actual: byPeriod.Q4_ANNUAL?.actualValue ?? null,
      q1Score: byPeriod.Q1?.computedScore ?? null,
      q2Score: byPeriod.Q2?.computedScore ?? null,
      q3Score: byPeriod.Q3?.computedScore ?? null,
      q4Score: byPeriod.Q4_ANNUAL?.computedScore ?? null,
      latestScore: latestScore ?? null,
    };
  });

  return NextResponse.json({ rows, cycle });
}
