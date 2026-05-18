"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UoMType } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExportButton } from "@/components/reports/ExportButton";
import { formatTarget } from "@/lib/goal-labels";
import { BarChart3 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton";

type AchievementRow = {
  goalId: string;
  employeeName: string;
  department: string | null;
  goalTitle: string;
  thrustArea: string;
  uomType: UoMType;
  target: number;
  targetDate: string | null;
  q1Actual: number | null;
  q2Actual: number | null;
  q3Actual: number | null;
  q4Actual: number | null;
  latestScore: number | null;
};

export function AchievementReport() {
  const [rows, setRows] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [thrustFilter, setThrustFilter] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/achievement");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load report");
      }
      const json = (await res.json()) as { rows: AchievementRow[] };
      setRows(json.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchEmployee =
        !employeeFilter ||
        r.employeeName.toLowerCase().includes(employeeFilter.toLowerCase());
      const matchThrust =
        !thrustFilter ||
        r.thrustArea.toLowerCase().includes(thrustFilter.toLowerCase());
      return matchEmployee && matchThrust;
    });
  }, [rows, employeeFilter, thrustFilter]);

  const exportRows = useMemo(
    () =>
      filtered.map((r) => ({
        Employee: r.employeeName,
        Department: r.department ?? "",
        Goal: r.goalTitle,
        "Thrust Area": r.thrustArea,
        Target: formatTarget(r.uomType, r.target, r.targetDate),
        "Q1 Actual": r.q1Actual ?? "",
        "Q2 Actual": r.q2Actual ?? "",
        "Q3 Actual": r.q3Actual ?? "",
        "Q4 Actual": r.q4Actual ?? "",
        "Latest Score": r.latestScore != null ? `${r.latestScore.toFixed(1)}%` : "",
      })),
    [filtered]
  );

  if (loading) {
    return <TableSkeleton rows={6} columns={8} />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <Label htmlFor="emp-filter" className="text-xs text-[#64748B]">
              Employee
            </Label>
            <Input
              id="emp-filter"
              placeholder="Filter by name..."
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="mt-1 w-48"
            />
          </div>
          <div>
            <Label htmlFor="thrust-filter" className="text-xs text-[#64748B]">
              Thrust area
            </Label>
            <Input
              id="thrust-filter"
              placeholder="Filter thrust area..."
              value={thrustFilter}
              onChange={(e) => setThrustFilter(e.target.value)}
              className="mt-1 w-48"
            />
          </div>
        </div>
        <ExportButton rows={exportRows} filename="atomquest-achievement-report" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No data"
          description="No goals match your filters for the active cycle."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Thrust Area</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Q1</TableHead>
                <TableHead>Q2</TableHead>
                <TableHead>Q3</TableHead>
                <TableHead>Q4</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.goalId}>
                  <TableCell className="font-medium">{row.employeeName}</TableCell>
                  <TableCell>{row.goalTitle}</TableCell>
                  <TableCell className="text-[#64748B]">{row.thrustArea}</TableCell>
                  <TableCell>
                    {formatTarget(row.uomType, row.target, row.targetDate)}
                  </TableCell>
                  <TableCell>{row.q1Actual ?? "—"}</TableCell>
                  <TableCell>{row.q2Actual ?? "—"}</TableCell>
                  <TableCell>{row.q3Actual ?? "—"}</TableCell>
                  <TableCell>{row.q4Actual ?? "—"}</TableCell>
                  <TableCell>
                    {row.latestScore != null
                      ? `${row.latestScore.toFixed(1)}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
