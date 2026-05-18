"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle, Goal, UoMType } from "@prisma/client";

export type SharedGoalRow = Goal & {
  owner: { id: string; name: string };
  cycle: { id: string; year: number; phase: string };
  sharedRecipients: Array<{
    id: string;
    weightage: number;
    recipient: {
      id: string;
      name: string;
      email: string;
      department: string | null;
    };
  }>;
};

export function useSharedGoals() {
  const [sharedGoals, setSharedGoals] = useState<SharedGoalRow[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shared-goals");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load shared goals");
      }
      const json = (await res.json()) as {
        sharedGoals: SharedGoalRow[];
        cycle: Cycle | null;
      };
      setSharedGoals(json.sharedGoals);
      setCycle(json.cycle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shared goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedGoals();
  }, [fetchSharedGoals]);

  return { sharedGoals, cycle, loading, error, refetch: fetchSharedGoals };
}

export type UomTypeOption = UoMType;
