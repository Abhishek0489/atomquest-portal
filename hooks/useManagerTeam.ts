"use client";

import { useCallback, useEffect, useState } from "react";
import type { Cycle } from "@prisma/client";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  goalsTotal: number;
  goalsSubmitted: number;
  goalsApproved: number;
  goalsDraft: number;
  goalsReturned: number;
  goalsPending: number;
  checkinsDone: number;
  checkinsExpected: number;
};

export type TeamResponse = {
  members: TeamMember[];
  cycle: Cycle | null;
};

export function useManagerTeam() {
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manager/team");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load team");
      }
      const json = (await res.json()) as TeamResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return { data, loading, error, refetch: fetchTeam };
}
