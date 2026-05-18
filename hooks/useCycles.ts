"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle, CyclePhase } from "@prisma/client";

export type CycleRow = Cycle & { _count?: { goals: number } };

export function useCycles() {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cycles");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load cycles");
      }
      const json = (await res.json()) as { cycles: CycleRow[] };
      setCycles(json.cycles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cycles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  return { cycles, loading, error, refetch: fetchCycles };
}

export const CYCLE_PHASE_LABELS: Record<CyclePhase, string> = {
  GOAL_SETTING: "Goal Setting",
  Q1_CHECKIN: "Q1 Check-in",
  Q2_CHECKIN: "Q2 Check-in",
  Q3_CHECKIN: "Q3 Check-in",
  Q4_ANNUAL: "Q4 / Annual",
  CLOSED: "Closed",
};
