"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle, Goal, GoalStatus } from "@prisma/client";

export type PendingGoal = Goal & {
  owner: { id: string; name: string; email: string; department: string | null };
  cycle: { id: string; year: number; phase: string };
};

export type PendingGoalsResponse = {
  goals: PendingGoal[];
  cycle: Cycle | null;
  filters: {
    employees: { id: string; name: string }[];
    thrustAreas: string[];
  };
};

export function useManagerApprovals(filters?: {
  employeeId?: string;
  thrustArea?: string;
  status?: GoalStatus;
}) {
  const [data, setData] = useState<PendingGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.set("employeeId", filters.employeeId);
      if (filters?.thrustArea) params.set("thrustArea", filters.thrustArea);
      if (filters?.status) params.set("status", filters.status);
      else params.set("status", "SUBMITTED");

      const res = await fetch(`/api/goals/pending?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load pending goals");
      }
      const json = (await res.json()) as PendingGoalsResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pending goals");
    } finally {
      setLoading(false);
    }
  }, [filters?.employeeId, filters?.thrustArea, filters?.status]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return { data, loading, error, refetch: fetchPending };
}
