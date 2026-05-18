"use client";

import { useCallback, useEffect, useState } from "react";
import type { Checkin, CheckinPeriod, Cycle, UoMType } from "@prisma/client";

export type CheckinGoalItem = {
  goal: {
    id: string;
    title: string;
    thrustArea: string;
    uomType: UoMType;
    target: number;
    targetDate: Date | string | null;
    weightage: number;
    status: string;
    owner?: { id: string; name: string; email: string };
  };
  checkin: Checkin | null;
};

export type CheckinsResponse = {
  period: CheckinPeriod | null;
  periodLabel: string | null;
  cycle: Cycle | null;
  checkinOpen?: boolean;
  message?: string;
  items: CheckinGoalItem[];
  employees?: { id: string; name: string }[];
};

export function useCheckins(filters?: {
  employeeId?: string;
  period?: CheckinPeriod;
}) {
  const [data, setData] = useState<CheckinsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.set("employeeId", filters.employeeId);
      if (filters?.period) params.set("period", filters.period);

      const res = await fetch(`/api/checkins?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load check-ins");
      }
      setData((await res.json()) as CheckinsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  }, [filters?.employeeId, filters?.period]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  return { data, loading, error, refetch: fetchCheckins };
}
