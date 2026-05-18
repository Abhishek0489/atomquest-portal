import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { isGoalOwner } from "@/lib/goal-access";

type RouteContext = { params: { id: string } };

export async function DELETE(_request: Request, context: RouteContext) {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const { id } = context.params;

  const dependency = await prisma.goalDependency.findUnique({
    where: { id },
    include: { dependentGoal: { select: { ownerId: true } } },
  });

  if (!dependency) {
    return NextResponse.json({ error: "Dependency not found" }, { status: 404 });
  }

  if (
    !(await isGoalOwner(session.user.id, dependency.dependentGoalId)) &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.goalDependency.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: dependency.dependentGoalId,
      action: "DEPENDENCY_REMOVED",
      details: {
        dependentGoalId: dependency.dependentGoalId,
        requiredGoalId: dependency.requiredGoalId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
