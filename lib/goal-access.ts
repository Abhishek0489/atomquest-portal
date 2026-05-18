import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function canAccessGoal(
  userId: string,
  role: Role,
  goalId: string
): Promise<boolean> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { owner: { select: { id: true, managerId: true } } },
  });

  if (!goal) return false;
  if (role === "ADMIN") return true;
  if (goal.ownerId === userId) return true;
  if (role === "MANAGER" && goal.owner.managerId === userId) return true;
  return false;
}

export async function isGoalOwner(userId: string, goalId: string): Promise<boolean> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { ownerId: true },
  });
  return goal?.ownerId === userId;
}
