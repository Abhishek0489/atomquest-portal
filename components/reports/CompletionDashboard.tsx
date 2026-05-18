"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Check, X, ClipboardList } from "lucide-react";
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton";
type EmployeeCompletion = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  managerName: string | null;
  goalsCount: number;
  goalsSet: boolean;
  q1Done: boolean;
  q2Done: boolean;
  q3Done: boolean;
  q4Done: boolean;
};

type Rollup = {
  goalsSetPct: number;
  q1Pct: number;
  q2Pct: number;
  q3Pct: number;
  q4Pct: number;
  totalEmployees: number;
};

function StatusIcon({ done }: { done: boolean }) {
  return done ? (
    <Check className="mx-auto h-4 w-4 text-[#16A34A]" aria-label="Done" />
  ) : (
    <X className="mx-auto h-4 w-4 text-[#64748B]" aria-label="Not done" />
  );
}

export function CompletionDashboard() {
  const [employees, setEmployees] = useState<EmployeeCompletion[]>([]);
  const [rollup, setRollup] = useState<Rollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/completion");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load completion data");
      }
      const json = (await res.json()) as {
        employees: EmployeeCompletion[];
        rollup: Rollup | null;
      };
      setEmployees(json.employees);
      setRollup(json.rollup);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load completion data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No employees"
        description="Employee completion data will appear here for the active cycle."
      />
    );
  }

  return (
    <section className="space-y-6">
      {rollup && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Goals set", pct: rollup.goalsSetPct },
            { label: "Q1 complete", pct: rollup.q1Pct },
            { label: "Q2 complete", pct: rollup.q2Pct },
            { label: "Q3 complete", pct: rollup.q3Pct },
            { label: "Q4 complete", pct: rollup.q4Pct },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-[#64748B]">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#1E40AF]">
                {item.pct}%
              </p>
              <p className="text-xs text-[#64748B]">
                of {rollup.totalEmployees} employees
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead className="text-center">Goals set</TableHead>
              <TableHead className="text-center">Q1</TableHead>
              <TableHead className="text-center">Q2</TableHead>
              <TableHead className="text-center">Q3</TableHead>
              <TableHead className="text-center">Q4</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <p className="font-medium text-[#0F172A]">{emp.name}</p>
                  <p className="text-xs text-[#64748B]">{emp.email}</p>
                </TableCell>
                <TableCell className="text-[#64748B]">
                  {emp.department ?? "—"}
                </TableCell>
                <TableCell className="text-[#64748B]">
                  {emp.managerName ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon done={emp.goalsSet} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon done={emp.q1Done} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon done={emp.q2Done} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon done={emp.q3Done} />
                </TableCell>
                <TableCell className="text-center">
                  <StatusIcon done={emp.q4Done} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
