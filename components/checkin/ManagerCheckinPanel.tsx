"use client";

import { useState } from "react";
import { useCheckins } from "@/hooks/useCheckins";
import { CheckinComment } from "@/components/checkin/CheckinComment";
import { EmptyState } from "@/components/shared/EmptyState";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Loader2 } from "lucide-react";

export function ManagerCheckinPanel() {
  const [employeeFilter, setEmployeeFilter] = useState("");
  const { data, loading, error, refetch } = useCheckins({
    employeeId: employeeFilter || undefined,
  });

  const itemsWithCheckins = (data?.items ?? []).filter((item) => item.checkin);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Team Check-in Review</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Review employee achievements and add manager comments.
          {data?.periodLabel && (
            <span className="ml-1">· {data.periodLabel}</span>
          )}
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <section className="space-y-1">
          <Label htmlFor="checkin-employee">Employee</Label>
          <select
            id="checkin-employee"
            className="flex h-9 min-w-[200px] rounded-md border border-input bg-transparent px-3 text-sm"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All employees</option>
            {data?.employees?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </section>
      </section>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading check-ins...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && itemsWithCheckins.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title="No check-ins to review"
          description="Submitted employee check-ins will appear here for manager feedback."
        />
      )}

      <section className="grid gap-4">
        {itemsWithCheckins.map((item) => (
          <CheckinComment
            key={item.goal.id}
            item={item}
            onSaved={refetch}
          />
        ))}
      </section>

      {!loading &&
        (data?.items ?? []).length > 0 &&
        itemsWithCheckins.length < (data?.items ?? []).length && (
          <p className="text-sm text-[#64748B]">
            Some goals do not have a check-in yet — only submitted check-ins can
            receive comments.
          </p>
        )}
    </section>
  );
}
