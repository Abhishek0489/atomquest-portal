import type { GoalStatus, UoMType } from "@prisma/client";

export const UOM_LABELS: Record<UoMType, string> = {
  NUMERIC_MIN: "Numeric Min (Higher is better)",
  NUMERIC_MAX: "Numeric Max (Lower is better)",
  TIMELINE: "Timeline",
  ZERO: "Zero = Success",
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  RETURNED: "Returned",
  LOCKED: "Locked",
};

export function formatTarget(
  uomType: UoMType,
  target: number,
  targetDate?: string | Date | null
): string {
  if (uomType === "TIMELINE" && targetDate) {
    const d = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    return d.toLocaleDateString();
  }
  if (uomType === "ZERO") return "0 incidents";
  return target.toLocaleString();
}
