import Link from "next/link";
import type { Goal, GoalStatus } from "@prisma/client";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { formatTarget, UOM_LABELS } from "@/lib/goal-labels";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, History, GitBranch, Eye } from "lucide-react";

export type GoalWithCycle = Goal & {
  cycle?: { phase: string };
};

type GoalCardProps = {
  goal: GoalWithCycle;
};

function canEdit(status: GoalStatus) {
  return status === "DRAFT" || status === "RETURNED";
}

export function GoalCard({ goal }: GoalCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
          <p className="mt-0.5 text-xs text-[#64748B]">{goal.thrustArea}</p>
        </div>
        <GoalStatusBadge status={goal.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-[#64748B]">UoM</dt>
          <dd className="font-medium text-[#0F172A]">{UOM_LABELS[goal.uomType]}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#64748B]">Target</dt>
          <dd className="font-medium text-[#0F172A]">
            {formatTarget(goal.uomType, goal.target, goal.targetDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#64748B]">Weightage</dt>
          <dd className="font-medium text-[#0F172A]">{goal.weightage}%</dd>
        </div>
        <div>
          <dt className="text-xs text-[#64748B]">Updated</dt>
          <dd className="font-medium text-[#0F172A]">
            {new Date(goal.updatedAt).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      {goal.description && (
        <p className="mt-3 text-sm text-[#64748B] line-clamp-2">{goal.description}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link
          href={`/employee/goals/${goal.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View
        </Link>
        {canEdit(goal.status) && (
          <Link
            href={`/employee/goals/${goal.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Link>
        )}
        <Button variant="outline" size="sm" disabled title="Available in Phase 6">
          <History className="mr-1 h-3.5 w-3.5" />
          History
        </Button>
        <Link
          href="/employee/dependencies"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <GitBranch className="mr-1 h-3.5 w-3.5" />
          Dependency
        </Link>
      </div>
    </article>
  );
}
