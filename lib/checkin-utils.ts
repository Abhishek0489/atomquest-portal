import type { CheckinPeriod, Goal } from "@prisma/client";
import { computeScore } from "@/lib/scoring";

export function resolveComputedScore(
  goal: Pick<Goal, "uomType" | "target" | "targetDate">,
  actualValue: number | null | undefined,
  actualDate: Date | null | undefined
): number | null {
  if (actualValue == null && !actualDate) return null;

  const actual = actualValue ?? 0;
  return Math.round(
    computeScore(
      goal.uomType,
      goal.target,
      actual,
      goal.targetDate ?? undefined,
      actualDate ?? undefined
    ) * 10
  ) / 10;
}

export function parseCheckinPeriod(
  value: string | null
): CheckinPeriod | undefined {
  if (
    value === "Q1" ||
    value === "Q2" ||
    value === "Q3" ||
    value === "Q4_ANNUAL"
  ) {
    return value;
  }
  return undefined;
}
