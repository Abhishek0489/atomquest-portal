"use client";

import { useEffect, useState } from "react";
import type { UoMType } from "@prisma/client";
import { useSharedGoals } from "@/hooks/useSharedGoals";
import { THRUST_AREAS } from "@/lib/constants/thrust-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTarget } from "@/lib/goal-labels";
import { Share2, Loader2, Plus } from "lucide-react";

const UOM_OPTIONS: { value: UoMType; label: string }[] = [
  { value: "NUMERIC_MIN", label: "Numeric (higher is better)" },
  { value: "NUMERIC_MAX", label: "Numeric (lower is better)" },
  { value: "TIMELINE", label: "Timeline" },
  { value: "ZERO", label: "Zero = success" },
];

type EmployeeOption = { id: string; name: string; email: string };

export function SharedGoalsPanel() {
  const { sharedGoals, cycle, loading, error, refetch } = useSharedGoals();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [uomType, setUomType] = useState<UoMType>("NUMERIC_MIN");
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: { users: Array<{ id: string; name: string; email: string; role: string }> }) => {
        setEmployees(
          data.users
            .filter((u) => u.role === "EMPLOYEE")
            .map((u) => ({ id: u.id, name: u.name, email: u.email }))
        );
      })
      .catch(() => {});
  }, []);

  function toggleRecipient(id: string) {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedRecipients.size === 0) {
      setFormError("Select at least one recipient");
      return;
    }
    setSaving(true);
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title") as string,
      thrustArea: fd.get("thrustArea") as string,
      description: (fd.get("description") as string) || null,
      uomType,
      target: uomType === "ZERO" ? 0 : Number(fd.get("target")),
      targetDate: uomType === "TIMELINE" ? (fd.get("targetDate") as string) : null,
      weightage: Number(fd.get("weightage")),
      recipientIds: Array.from(selectedRecipients),
    };

    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create shared goal");
      }
      setCreateOpen(false);
      setSelectedRecipients(new Set());
      refetch();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create shared goal"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading shared goals...
      </p>
    );
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
      {!cycle && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          No active cycle. Activate a cycle before pushing shared goals.
        </p>
      )}

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button disabled={!cycle} />}>
            <Plus className="mr-2 h-4 w-4" />
            Push shared KPI
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create shared goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="thrustArea">Thrust area</Label>
                <select
                  id="thrustArea"
                  name="thrustArea"
                  required
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  {THRUST_AREAS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="uomType">Unit of measure</Label>
                <select
                  id="uomType"
                  value={uomType}
                  onChange={(e) => setUomType(e.target.value as UoMType)}
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  {UOM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {uomType !== "ZERO" && uomType !== "TIMELINE" && (
                <div>
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    name="target"
                    type="number"
                    required
                    className="mt-1"
                  />
                </div>
              )}
              {uomType === "TIMELINE" && (
                <>
                  <div>
                    <Label htmlFor="target">Target value</Label>
                    <Input
                      id="target"
                      name="target"
                      type="number"
                      required
                      defaultValue={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetDate">Target date</Label>
                    <Input
                      id="targetDate"
                      name="targetDate"
                      type="date"
                      required
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="weightage">Default weightage (%)</Label>
                <Input
                  id="weightage"
                  name="weightage"
                  type="number"
                  min={10}
                  max={100}
                  required
                  defaultValue={20}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Recipients</Label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(emp.id)}
                        onChange={() => toggleRecipient(emp.id)}
                      />
                      <span>
                        {emp.name}{" "}
                        <span className="text-[#64748B]">({emp.email})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Pushing..." : "Push to recipients"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sharedGoals.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No shared goals"
          description="Push organization-wide KPIs to selected employees."
        />
      ) : (
        <div className="grid gap-4">
          {sharedGoals.map((goal) => (
            <article
              key={goal.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
                  <p className="text-sm text-[#64748B]">{goal.thrustArea}</p>
                </div>
                <p className="text-sm font-medium text-[#1E40AF]">
                  {formatTarget(
                    goal.uomType,
                    goal.target,
                    goal.targetDate?.toString() ?? null
                  )}
                </p>
              </header>
              {goal.description && (
                <p className="mt-2 text-sm text-[#64748B]">{goal.description}</p>
              )}
              <p className="mt-3 text-xs font-medium text-[#64748B]">
                Recipients ({goal.sharedRecipients.length})
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {goal.sharedRecipients.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-xs text-[#1E40AF]"
                  >
                    {r.recipient.name} ({r.weightage}%)
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

