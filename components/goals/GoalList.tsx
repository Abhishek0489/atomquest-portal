"use client";

import Link from "next/link";
import { useGoals } from "@/hooks/useGoals";
import { GoalCard } from "@/components/goals/GoalCard";
import { WeightageBar } from "@/components/goals/WeightageBar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_GOALS_PER_CYCLE } from "@/lib/goal-validation";
import { Loader2, Plus } from "lucide-react";

export function GoalList() {
  const { data, loading, error } = useGoals();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#64748B]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading goals…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const goals = data?.goals ?? [];
  const cycle = data?.cycle;
  const totalWeightage = data?.totalWeightage ?? 0;
  const canCreate =
    cycle?.phase === "GOAL_SETTING" && goals.length < MAX_GOALS_PER_CYCLE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">My Goals</h1>
          {cycle && (
            <p className="mt-1 text-sm text-[#64748B]">
              {cycle.year} cycle · {cycle.phase.replace(/_/g, " ")}
            </p>
          )}
        </div>
        {canCreate ? (
          <Link
            href="/employee/goals/new"
            className={cn(
              buttonVariants(),
              "bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90"
            )}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Link>
        ) : (
          <Button disabled className="bg-[#1E40AF]/50">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        )}
      </div>

      {!canCreate && cycle && cycle.phase !== "GOAL_SETTING" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Goal setting is closed for this cycle phase.
        </p>
      )}

      {canCreate === false && goals.length >= MAX_GOALS_PER_CYCLE && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Maximum {MAX_GOALS_PER_CYCLE} goals reached for this cycle.
        </p>
      )}

      <WeightageBar total={totalWeightage} />

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-[#64748B]">No goals yet. Create your first goal.</p>
          {canCreate && (
            <Link
              href="/employee/goals/new"
              className={cn(
                buttonVariants(),
                "mt-4 inline-flex bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90"
              )}
            >
              Create goal
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
