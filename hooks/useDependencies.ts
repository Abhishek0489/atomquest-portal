"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle, GoalStatus, ProgressStatus } from "@prisma/client";

export type DependencyGoal = {
  id: string;
  title: string;
  status: GoalStatus;
  progressStatus: ProgressStatus;
};

export type DependencyEdge = {
  id: string;
  dependentGoalId: string;
  requiredGoalId: string;
};

export type DependenciesResponse = {
  cycle: Cycle | null;
  goals: DependencyGoal[];
  edges: DependencyEdge[];
};

export function useDependencies() {
  const [data, setData] = useState<DependenciesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDependencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dependencies");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load dependencies");
      }
      setData((await res.json()) as DependenciesResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dependencies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  return { data, loading, error, refetch: fetchDependencies };
}
