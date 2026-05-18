"use client";

import { useEffect, useState } from "react";
import type { PendingGoal } from "@/hooks/useManagerApprovals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { formatTarget, UOM_LABELS } from "@/lib/goal-labels";
import { Loader2 } from "lucide-react";

type GoalDetail = PendingGoal & {
  description: string | null;
};

type GoalReviewDialogProps = {
  goalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function GoalReviewDialog({
  goalId,
  open,
  onOpenChange,
  onUpdated,
}: GoalReviewDialogProps) {
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !goalId) {
      setGoal(null);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/goals/${goalId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load goal");
        }
        setGoal((await res.json()) as GoalDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load goal");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, goalId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review goal</DialogTitle>
          <DialogDescription>
            Review details before approving or returning this goal.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading goal...
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {goal && !loading && (
          <section className="space-y-4 text-sm">
            <section className="flex items-start justify-between gap-2">
              <section>
                <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
                <p className="text-xs text-[#64748B]">{goal.thrustArea}</p>
              </section>
              <GoalStatusBadge status={goal.status} />
            </section>

            {goal.description && (
              <p className="text-[#64748B]">{goal.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-3">
              <section>
                <dt className="text-xs text-[#64748B]">Employee</dt>
                <dd className="font-medium">{goal.owner?.name ?? "—"}</dd>
              </section>
              <section>
                <dt className="text-xs text-[#64748B]">UoM</dt>
                <dd className="font-medium">{UOM_LABELS[goal.uomType]}</dd>
              </section>
              <section>
                <dt className="text-xs text-[#64748B]">Target</dt>
                <dd className="font-medium">
                  {formatTarget(goal.uomType, goal.target, goal.targetDate)}
                </dd>
              </section>
              <section>
                <dt className="text-xs text-[#64748B]">Weightage</dt>
                <dd className="font-medium">{goal.weightage}%</dd>
              </section>
            </dl>
          </section>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {goal && onUpdated && (
            <Button
              className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
              onClick={() => {
                onUpdated();
                onOpenChange(false);
              }}
            >
              Refresh list
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
