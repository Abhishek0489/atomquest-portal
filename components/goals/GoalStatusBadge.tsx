import type { GoalStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/goal-labels";

const statusStyles: Record<GoalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  RETURNED: "bg-orange-100 text-orange-700",
  LOCKED: "bg-green-100 text-green-800",
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
