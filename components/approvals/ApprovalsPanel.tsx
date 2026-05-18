"use client";

import { useState } from "react";
import { useManagerApprovals } from "@/hooks/useManagerApprovals";
import { ApprovalTable } from "@/components/approvals/ApprovalTable";
import { BulkActionBar } from "@/components/approvals/BulkActionBar";
import { GoalReviewDialog } from "@/components/approvals/GoalReviewDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PendingGoal } from "@/hooks/useManagerApprovals";
import { CheckSquare, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export function ApprovalsPanel() {
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [thrustFilter, setThrustFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewGoalId, setReviewGoalId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, loading, error, refetch } = useManagerApprovals({
    employeeId: employeeFilter || undefined,
    thrustArea: thrustFilter || undefined,
  });

  const filteredGoals = data?.goals ?? [];

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(filteredGoals.map((g) => g.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  async function bulkAction(action: "APPROVE" | "RETURN", comment?: string) {
    const goalIds = Array.from(selectedIds);
    const res = await fetch("/api/goals/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalIds, action, comment }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "Bulk action failed");
    }
    setMessage({
      type: "success",
      text: `${body.processed} goal(s) ${action === "APPROVE" ? "approved" : "returned"}.`,
    });
    setSelectedIds(new Set());
    await refetch();
  }

  function handleReview(goal: PendingGoal) {
    setReviewGoalId(goal.id);
  }

  return (
    <section className="space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Goal Approvals</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Review and bulk-approve submitted goals from your team.
          {data?.cycle && (
            <span className="ml-1">
              Cycle {data.cycle.year} · {data.cycle.phase.replace(/_/g, " ")}
            </span>
          )}
        </p>
      </header>

      <section className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <section className="space-y-1">
          <Label htmlFor="filter-employee">Employee</Label>
          <select
            id="filter-employee"
            className="flex h-9 min-w-[180px] rounded-md border border-input bg-transparent px-3 text-sm"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setSelectedIds(new Set());
            }}
          >
            <option value="">All employees</option>
            {data?.filters.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </section>
        <section className="space-y-1">
          <Label htmlFor="filter-thrust">Thrust area</Label>
          <select
            id="filter-thrust"
            className="flex h-9 min-w-[180px] rounded-md border border-input bg-transparent px-3 text-sm"
            value={thrustFilter}
            onChange={(e) => {
              setThrustFilter(e.target.value);
              setSelectedIds(new Set());
            }}
          >
            <option value="">All areas</option>
            {data?.filters.thrustAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </section>
      </section>

      {message && (
        <p
          className={`rounded-lg px-4 py-2 text-sm ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {loading && (
        <p className="flex items-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pending goals...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && filteredGoals.length === 0 && (
        <EmptyState
          icon={CheckSquare}
          title="No goals awaiting approval"
          description="When employees submit goals, they will appear here for review."
        />
      )}

      {!loading && filteredGoals.length > 0 && (
        <ApprovalTable
          goals={filteredGoals}
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onReview={handleReview}
        />
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        onApprove={() => bulkAction("APPROVE")}
        onReturn={(comment) => bulkAction("RETURN", comment)}
      />

      <GoalReviewDialog
        goalId={reviewGoalId}
        open={!!reviewGoalId}
        onOpenChange={(open) => !open && setReviewGoalId(null)}
        onUpdated={refetch}
      />
    </section>
  );
}
