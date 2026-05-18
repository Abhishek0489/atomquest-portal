"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle, Goal } from "@prisma/client";

export type GoalsResponse = {
  goals: Goal[];
  cycle: Cycle | null;
  totalWeightage: number;
};

export function useGoals() {
  const [data, setData] = useState<GoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load goals");
      }
      const json = (await res.json()) as GoalsResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { data, loading, error, refetch: fetchGoals };
}
