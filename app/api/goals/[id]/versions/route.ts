import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { canAccessGoal } from "@/lib/goal-access";
import { serializeGoalSnapshot } from "@/lib/goal-validation";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  const { error, session } = await requireSession([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
  ]);
  if (error || !session) return error;

  const { id } = context.params;

  if (!(await canAccessGoal(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const versions = await prisma.goalVersion.findMany({
    where: { goalId: id },
    orderBy: { changedAt: "desc" },
  });

  const userIds = Array.from(new Set(versions.map((v) => v.changedById)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const currentSnapshot = serializeGoalSnapshot(goal);

  return NextResponse.json({
    goal: { id: goal.id, title: goal.title },
    currentSnapshot,
    versions: versions.map((v) => ({
      id: v.id,
      changedAt: v.changedAt,
      changedById: v.changedById,
      changedByName: userMap.get(v.changedById) ?? "Unknown",
      changeNote: v.changeNote,
      snapshot: v.snapshot as Record<string, unknown>,
    })),
  });
}
