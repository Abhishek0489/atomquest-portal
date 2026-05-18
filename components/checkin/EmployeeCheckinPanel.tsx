"use client";

import { useRef, useState } from "react";
import { useCheckins } from "@/hooks/useCheckins";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Loader2, Save } from "lucide-react";
import { toast } from "@/lib/toast";
import { CardGridSkeleton } from "@/components/shared/skeletons/CardGridSkeleton";

export function EmployeeCheckinPanel() {
  const { data, loading, error, refetch } = useCheckins();
  const saveFns = useRef<Record<string, () => Promise<void>>>({});
  const [savingAll, setSavingAll] = useState(false);
  async function saveAll() {
    setSavingAll(true);
    try {
      const fns = Object.values(saveFns.current);
      for (const fn of fns) {
        await fn();
      }
      toast.success("All check-ins saved");
      await refetch();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Some check-ins failed to save"
      );
    } finally {
      setSavingAll(false);
    }
  }

  const period = data?.period;
  const items = data?.items ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <section>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Quarterly Check-in</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {data?.periodLabel
              ? `${data.periodLabel}${data.cycle ? ` · Cycle ${data.cycle.year}` : ""}`
              : "Record achievement against your approved goals."}
          </p>
        </section>
        {items.length > 0 && period && (
          <Button
            className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
            disabled={savingAll || !data?.checkinOpen}
            onClick={saveAll}
          >
            {savingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save All
          </Button>
        )}
      </header>

      {loading && <CardGridSkeleton count={2} columns={1} />}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && data?.message && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {data.message}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title="No goals ready for check-in"
          description="Approved goals for the active cycle will appear here."
        />
      )}

      <section className="grid gap-4">
        {period &&
          items.map((item) => (
            <CheckinForm
              key={item.goal.id}
              goal={item.goal}
              checkin={item.checkin}
              period={period}
              disabled={!data?.checkinOpen}
              onSaved={refetch}
              onRegisterSave={(fn) => {
                saveFns.current[item.goal.id] = fn;
              }}
            />
          ))}
      </section>
    </section>
  );
}
