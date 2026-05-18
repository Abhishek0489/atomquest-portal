"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Checkin, CheckinPeriod, UoMType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressScore } from "@/components/checkin/ProgressScore";
import { formatTarget, PROGRESS_STATUS_LABELS } from "@/lib/goal-labels";
import { computeScore } from "@/lib/scoring";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/lib/toast";

type CheckinFormProps = {
  goal: {
    id: string;
    title: string;
    uomType: UoMType;
    target: number;
    targetDate: Date | string | null;
  };
  checkin: Checkin | null;
  period: CheckinPeriod;
  onSaved?: () => void;
  onRegisterSave?: (saveFn: () => Promise<void>) => void;
  disabled?: boolean;
};

export function CheckinForm({
  goal,
  checkin,
  period,
  onSaved,
  onRegisterSave,
  disabled,
}: CheckinFormProps) {
  const [progressStatus, setProgressStatus] = useState(
    checkin?.progressStatus ?? "NOT_STARTED"
  );
  const [actualValue, setActualValue] = useState<string>(
    checkin?.actualValue != null ? String(checkin.actualValue) : ""
  );
  const [actualDate, setActualDate] = useState(
    checkin?.actualDate
      ? new Date(checkin.actualDate).toISOString().slice(0, 10)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProgressStatus(checkin?.progressStatus ?? "NOT_STARTED");
    setActualValue(
      checkin?.actualValue != null ? String(checkin.actualValue) : ""
    );
    setActualDate(
      checkin?.actualDate
        ? new Date(checkin.actualDate).toISOString().slice(0, 10)
        : ""
    );
  }, [checkin]);

  const liveScore = useMemo(() => {
    if (progressStatus === "NOT_STARTED") return null;
    const actual = goal.uomType === "TIMELINE" ? 1 : Number(actualValue) || 0;
    const targetDate = goal.targetDate
      ? new Date(goal.targetDate)
      : undefined;
    const achievedDate =
      goal.uomType === "TIMELINE" && actualDate
        ? new Date(actualDate)
        : undefined;
    return Math.round(
      computeScore(
        goal.uomType,
        goal.target,
        actual,
        targetDate,
        achievedDate
      ) * 10
    ) / 10;
  }, [goal, progressStatus, actualValue, actualDate]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        goalId: goal.id,
        period,
        progressStatus,
        actualValue:
          progressStatus === "NOT_STARTED"
            ? null
            : goal.uomType === "ZERO"
              ? Number(actualValue) || 0
              : goal.uomType === "TIMELINE"
                ? 1
                : Number(actualValue),
        actualDate:
          goal.uomType === "TIMELINE" && progressStatus !== "NOT_STARTED"
            ? actualDate || null
            : null,
      };

      const url = checkin ? `/api/checkins/${checkin.id}` : "/api/checkins";
      const method = checkin ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to save check-in");
      }
      toast.success("Check-in saved");
      onSaved?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [
    goal,
    period,
    checkin,
    progressStatus,
    actualValue,
    actualDate,
    onSaved,
  ]);

  useEffect(() => {
    onRegisterSave?.(save);
  }, [save, onRegisterSave]);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <section>
          <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
          <p className="text-xs text-[#64748B]">
            Target: {formatTarget(goal.uomType, goal.target, goal.targetDate)}
          </p>
        </section>
        <ProgressScore score={liveScore} />
      </header>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="space-y-2">
          <Label htmlFor={`status-${goal.id}`}>Progress status</Label>
          <select
            id={`status-${goal.id}`}
            disabled={disabled || saving}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={progressStatus}
            onChange={(e) =>
              setProgressStatus(
                e.target.value as "NOT_STARTED" | "ON_TRACK" | "COMPLETED"
              )
            }
          >
            {Object.entries(PROGRESS_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>

        {goal.uomType === "TIMELINE" ? (
          <section className="space-y-2">
            <Label htmlFor={`date-${goal.id}`}>Actual completion date</Label>
            <Input
              id={`date-${goal.id}`}
              type="date"
              disabled={disabled || saving || progressStatus === "NOT_STARTED"}
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
            />
          </section>
        ) : goal.uomType !== "ZERO" ? (
          <section className="space-y-2">
            <Label htmlFor={`actual-${goal.id}`}>Actual achievement</Label>
            <Input
              id={`actual-${goal.id}`}
              type="number"
              step="any"
              disabled={disabled || saving || progressStatus === "NOT_STARTED"}
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
            />
          </section>
        ) : (
          <section className="space-y-2">
            <Label htmlFor={`actual-${goal.id}`}>Incidents count</Label>
            <Input
              id={`actual-${goal.id}`}
              type="number"
              min={0}
              step={1}
              disabled={disabled || saving || progressStatus === "NOT_STARTED"}
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
            />
          </section>
        )}
      </section>

      {checkin?.managerComment && (
        <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-[#64748B]">
          <span className="font-medium text-[#0F172A]">Manager: </span>
          {checkin.managerComment}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      <footer className="mt-4 border-t border-slate-100 pt-4">
        <Button
          size="sm"
          className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
          disabled={disabled || saving}
          onClick={save}
        >
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          Save
        </Button>
      </footer>
    </article>
  );
}
