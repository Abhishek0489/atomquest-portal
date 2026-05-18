import type { UoMType } from "@prisma/client";

export function computeScore(
  uomType: UoMType,
  target: number,
  actual: number,
  targetDate?: Date,
  actualDate?: Date
): number {
  switch (uomType) {
    case "NUMERIC_MIN":
      return Math.min((actual / target) * 100, 100);

    case "NUMERIC_MAX":
      if (actual === 0) return 100;
      return Math.min((target / actual) * 100, 100);

    case "TIMELINE":
      if (!targetDate || !actualDate) return 0;
      if (actualDate <= targetDate) return 100;
      const lateDays = actualDate.getTime() - targetDate.getTime();
      return Math.max(0, 100 - (lateDays / (1000 * 60 * 60 * 24)) * 2);

    case "ZERO":
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}
