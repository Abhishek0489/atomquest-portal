import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { dependencyCreateSchema } from "@/lib/validations/dependency.schema";
import { wouldCreateCycle } from "@/lib/dependency-cycle";
import type { ProgressStatus } from "@prisma/client";

export async function GET() {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ goals: [], edges: [], cycle: null });
  }

  const ownerId = session.user.id;

  const goals = await prisma.goal.findMany({
    where: { ownerId, cycleId: activeCycle.id },
    orderBy: { title: "asc" },
    include: {
      checkins: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const goalIds = goals.map((g) => g.id);

  const edges = await prisma.goalDependency.findMany({
    where: {
      dependentGoalId: { in: goalIds },
      requiredGoalId: { in: goalIds },
    },
  });

  const nodes = goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    status: goal.status,
    progressStatus:
      (goal.checkins[0]?.progressStatus as ProgressStatus) ?? "NOT_STARTED",
  }));

  return NextResponse.json({
    cycle: activeCycle,
    goals: nodes,
    edges: edges.map((e) => ({
      id: e.id,
      dependentGoalId: e.dependentGoalId,
      requiredGoalId: e.requiredGoalId,
    })),
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = dependencyCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dependentGoalId, requiredGoalId } = parsed.data;

  const [dependent, required] = await Promise.all([
    prisma.goal.findUnique({ where: { id: dependentGoalId } }),
    prisma.goal.findUnique({ where: { id: requiredGoalId } }),
  ]);

  if (!dependent || !required) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (
    dependent.ownerId !== session.user.id ||
    required.ownerId !== session.user.id
  ) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (dependent.cycleId !== required.cycleId) {
    return NextResponse.json(
      { error: "Goals must belong to the same cycle" },
      { status: 400 }
    );
  }

  if (await wouldCreateCycle(dependentGoalId, requiredGoalId)) {
    return NextResponse.json(
      { error: "This dependency would create a circular reference" },
      { status: 400 }
    );
  }

  const existing = await prisma.goalDependency.findUnique({
    where: {
      dependentGoalId_requiredGoalId: { dependentGoalId, requiredGoalId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Dependency already exists" },
      { status: 400 }
    );
  }

  const dependency = await prisma.goalDependency.create({
    data: { dependentGoalId, requiredGoalId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: dependentGoalId,
      action: "DEPENDENCY_ADDED",
      details: { dependentGoalId, requiredGoalId },
    },
  });

  return NextResponse.json(dependency, { status: 201 });
}
