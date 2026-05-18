import { NextResponse } from "next/server";
import type { CheckinPeriod, GoalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { getReporteeIds } from "@/lib/manager-access";
import {
  getPeriodLabel,
  isCheckinPhaseOpen,
  phaseToCheckinPeriod,
} from "@/lib/cycle-period";
import { checkinUpsertSchema } from "@/lib/validations/checkin.schema";
import { resolveComputedScore, parseCheckinPeriod } from "@/lib/checkin-utils";
const CHECKIN_ELIGIBLE: GoalStatus[] = ["APPROVED", "LOCKED"];

export async function GET(request: Request) {
  const { error, session } = await requireSession([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
  ]);
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goalId");
  const employeeId = searchParams.get("employeeId");
  const periodParam = searchParams.get("period");

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({
      period: null,
      periodLabel: null,
      cycle: null,
      items: [],
      employees: [],
    });
  }

  const period: CheckinPeriod | null =
    parseCheckinPeriod(periodParam) ?? phaseToCheckinPeriod(activeCycle.phase);

  if (!period) {
    return NextResponse.json({
      period: null,
      periodLabel: null,
      cycle: activeCycle,
      items: [],
      employees: [],
      message: "Check-ins are not open for the current cycle phase",
    });
  }

  let ownerIds: string[] | undefined;

  if (session.user.role === "EMPLOYEE") {
    ownerIds = [session.user.id];
  } else if (session.user.role === "MANAGER") {
    ownerIds = await getReporteeIds(session.user.id);
    if (employeeId) {
      if (!ownerIds.includes(employeeId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      ownerIds = [employeeId];
    }
  } else if (employeeId) {
    ownerIds = [employeeId];
  }

  const goals = await prisma.goal.findMany({
    where: {
      cycleId: activeCycle.id,
      status: { in: CHECKIN_ELIGIBLE },
      ...(ownerIds ? { ownerId: { in: ownerIds } } : {}),
      ...(goalId ? { id: goalId } : {}),
    },
    orderBy: { title: "asc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      checkins: { where: { period } },
    },
  });

  const items = goals.map((goal) => ({
    goal: {
      id: goal.id,
      title: goal.title,
      thrustArea: goal.thrustArea,
      uomType: goal.uomType,
      target: goal.target,
      targetDate: goal.targetDate,
      weightage: goal.weightage,
      status: goal.status,
      owner: goal.owner,
    },
    checkin: goal.checkins[0] ?? null,
  }));

  let employees: { id: string; name: string }[] = [];
  if (session.user.role === "MANAGER") {
    employees = await prisma.user.findMany({
      where: { managerId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else if (session.user.role === "ADMIN") {
    employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  return NextResponse.json({
    period,
    periodLabel: getPeriodLabel(period),
    cycle: activeCycle,
    checkinOpen: isCheckinPhaseOpen(activeCycle.phase),
    items,
    employees,
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json(
      { error: "No active cycle configured" },
      { status: 400 }
    );
  }

  const period = phaseToCheckinPeriod(activeCycle.phase);
  if (!period || !isCheckinPhaseOpen(activeCycle.phase)) {
    return NextResponse.json(
      { error: "Check-ins are not open for the current cycle phase" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = checkinUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.period !== period) {
    return NextResponse.json(
      { error: `Only ${period} check-ins are accepted in the current phase` },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.findUnique({
    where: { id: data.goalId },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.ownerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!CHECKIN_ELIGIBLE.includes(goal.status)) {
    return NextResponse.json(
      { error: "Check-ins are only allowed for approved goals" },
      { status: 400 }
    );
  }

  if (goal.cycleId !== activeCycle.id) {
    return NextResponse.json(
      { error: "Goal is not in the active cycle" },
      { status: 400 }
    );
  }

  const actualDate =
    data.actualDate && goal.uomType === "TIMELINE"
      ? new Date(data.actualDate)
      : null;

  let actualValue: number | null =
    data.progressStatus === "NOT_STARTED"
      ? null
      : goal.uomType === "ZERO"
        ? (data.actualValue ?? 0)
        : (data.actualValue ?? null);

  if (goal.uomType === "TIMELINE" && data.progressStatus !== "NOT_STARTED") {
    actualValue = 1;
  }

  const computedScore =
    data.progressStatus === "NOT_STARTED"
      ? null
      : resolveComputedScore(goal, actualValue, actualDate);

  const checkin = await prisma.checkin.upsert({
    where: {
      goalId_period: { goalId: goal.id, period: data.period },
    },
    create: {
      goalId: goal.id,
      period: data.period,
      actualValue,
      actualDate,
      progressStatus: data.progressStatus,
      computedScore,
    },
    update: {
      actualValue,
      actualDate,
      progressStatus: data.progressStatus,
      computedScore,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: goal.id,
      action: "CHECKIN_SUBMITTED",
      details: {
        period: data.period,
        actualValue,
        progressStatus: data.progressStatus,
        computedScore,
      },
    },
  });

  return NextResponse.json(checkin, { status: 201 });
}
