"use client";

import type { PendingGoal } from "@/hooks/useManagerApprovals";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { formatTarget } from "@/lib/goal-labels";
import { Eye } from "lucide-react";

type ApprovalTableProps = {
  goals: PendingGoal[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onReview: (goal: PendingGoal) => void;
};

export function ApprovalTable({
  goals,
  selectedIds,
  onToggle,
  onToggleAll,
  onReview,
}: ApprovalTableProps) {
  const allSelected =
    goals.length > 0 && goals.every((g) => selectedIds.has(g.id));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Goal Title</TableHead>
            <TableHead>Thrust Area</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Weightage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal) => (
            <TableRow
              key={goal.id}
              data-state={selectedIds.has(goal.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(goal.id)}
                  onCheckedChange={() => onToggle(goal.id)}
                  aria-label={`Select ${goal.title}`}
                />
              </TableCell>
              <TableCell>
                <p className="font-medium text-[#0F172A]">{goal.owner.name}</p>
                <p className="text-xs text-[#64748B]">{goal.owner.department}</p>
              </TableCell>
              <TableCell className="max-w-[200px] truncate font-medium">
                {goal.title}
              </TableCell>
              <TableCell>{goal.thrustArea}</TableCell>
              <TableCell>
                {formatTarget(goal.uomType, goal.target, goal.targetDate)}
              </TableCell>
              <TableCell>{goal.weightage}%</TableCell>
              <TableCell>
                <GoalStatusBadge status={goal.status} />
              </TableCell>
              <TableCell className="text-[#64748B]">
                {new Date(goal.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(goal)}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
