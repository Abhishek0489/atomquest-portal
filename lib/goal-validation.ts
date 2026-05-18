import { prisma } from "@/lib/prisma";
import type { GoalStatus } from "@prisma/client";

export const MAX_GOALS_PER_CYCLE = 8;
export const MIN_GOAL_WEIGHTAGE = 10;
export const MAX_GOAL_WEIGHTAGE = 100;
export const REQUIRED_TOTAL_WEIGHTAGE = 100;

export async function getActiveCycle() {
  return prisma.cycle.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGoalsWeightageTotal(
  ownerId: string,
  cycleId: string,
  excludeGoalId?: string
): Promise<number> {
  const goals = await prisma.goal.findMany({
    where: {
      ownerId,
      cycleId,
      ...(excludeGoalId ? { id: { not: excludeGoalId } } : {}),
    },
    select: { weightage: true },
  });

  return goals.reduce((sum, g) => sum + g.weightage, 0);
}

export function validateWeightageBounds(weightage: number): string | null {
  if (weightage < MIN_GOAL_WEIGHTAGE || weightage > MAX_GOAL_WEIGHTAGE) {
    return `Weightage must be between ${MIN_GOAL_WEIGHTAGE}% and ${MAX_GOAL_WEIGHTAGE}%`;
  }
  return null;
}

export async function validateTotalWeightage(
  ownerId: string,
  cycleId: string,
  newWeightage: number,
  excludeGoalId?: string
): Promise<string | null> {
  const existingTotal = await getGoalsWeightageTotal(
    ownerId,
    cycleId,
    excludeGoalId
  );
  const total = existingTotal + newWeightage;

  if (total !== REQUIRED_TOTAL_WEIGHTAGE) {
    return `Total weightage must equal ${REQUIRED_TOTAL_WEIGHTAGE}% (currently ${total}% with this change)`;
  }
  return null;
}

export function canEmployeeEditStatus(status: GoalStatus): boolean {
  return status === "DRAFT" || status === "RETURNED";
}

export function serializeGoalSnapshot(goal: {
  id: string;
  ownerId: string;
  cycleId: string;
  thrustArea: string;
  title: string;
  description: string | null;
  uomType: string;
  target: number;
  targetDate: Date | null;
  weightage: number;
  status: string;
  isShared: boolean;
  sharedFromId: string | null;
}) {
  return {
    id: goal.id,
    ownerId: goal.ownerId,
    cycleId: goal.cycleId,
    thrustArea: goal.thrustArea,
    title: goal.title,
    description: goal.description,
    uomType: goal.uomType,
    target: goal.target,
    targetDate: goal.targetDate?.toISOString() ?? null,
    weightage: goal.weightage,
    status: goal.status,
    isShared: goal.isShared,
    sharedFromId: goal.sharedFromId,
  };
}
