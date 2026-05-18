import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { canAccessGoal } from "@/lib/goal-access";

export async function canAccessCheckin(
  userId: string,
  role: Role,
  checkinId: string
): Promise<boolean> {
  const checkin = await prisma.checkin.findUnique({
    where: { id: checkinId },
    select: { goalId: true },
  });

  if (!checkin) return false;
  return canAccessGoal(userId, role, checkin.goalId);
}
