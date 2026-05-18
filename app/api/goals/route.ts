import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { goalCreateSchema } from "@/lib/validations/goal.schema";
import {
  getActiveCycle,
  validateTotalWeightage,
  validateWeightageBounds,
  MAX_GOALS_PER_CYCLE,
} from "@/lib/goal-validation";

export async function GET() {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ goals: [], cycle: null });
  }

  const ownerId =
    session.user.role === "ADMIN"
      ? session.user.id
      : session.user.id;

  const goals = await prisma.goal.findMany({
    where: {
      ownerId,
      cycleId: activeCycle.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      cycle: { select: { id: true, year: true, phase: true, isActive: true } },
    },
  });

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

  return NextResponse.json({
    goals,
    cycle: activeCycle,
    totalWeightage,
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

  if (activeCycle.phase !== "GOAL_SETTING") {
    return NextResponse.json(
      { error: "Goals can only be created during the goal setting phase" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = goalCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const ownerId = session.user.id;

  const goalCount = await prisma.goal.count({
    where: { ownerId, cycleId: activeCycle.id },
  });

  if (goalCount >= MAX_GOALS_PER_CYCLE) {
    return NextResponse.json(
      { error: `Maximum ${MAX_GOALS_PER_CYCLE} goals allowed per cycle` },
      { status: 400 }
    );
  }

  const weightageError = validateWeightageBounds(data.weightage);
  if (weightageError) {
    return NextResponse.json({ error: weightageError }, { status: 400 });
  }

  const status = data.submit ? "SUBMITTED" : "DRAFT";

  if (status === "SUBMITTED") {
    const totalError = await validateTotalWeightage(
      ownerId,
      activeCycle.id,
      data.weightage
    );
    if (totalError) {
      return NextResponse.json({ error: totalError }, { status: 400 });
    }
  }

  const goal = await prisma.goal.create({
    data: {
      ownerId,
      cycleId: activeCycle.id,
      thrustArea: data.thrustArea,
      title: data.title,
      description: data.description || null,
      uomType: data.uomType,
      target: data.uomType === "ZERO" ? 0 : data.target,
      targetDate:
        data.uomType === "TIMELINE" && data.targetDate
          ? new Date(data.targetDate)
          : null,
      weightage: data.weightage,
      status,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: ownerId,
      goalId: goal.id,
      action: status === "SUBMITTED" ? "GOAL_SUBMITTED" : "GOAL_CREATED",
      details: { title: goal.title, status },
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
