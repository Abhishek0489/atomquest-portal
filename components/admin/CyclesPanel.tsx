"use client";

import { useState } from "react";
import type { CyclePhase } from "@prisma/client";
import { useCycles, CYCLE_PHASE_LABELS } from "@/hooks/useCycles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Loader2, Plus } from "lucide-react";

const PHASES = Object.keys(CYCLE_PHASE_LABELS) as CyclePhase[];

export function CyclesPanel() {
  const { cycles, loading, error, refetch } = useCycles();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      year: Number(fd.get("year")),
      phase: fd.get("phase") as CyclePhase,
      openDate: fd.get("openDate") as string,
      closeDate: fd.get("closeDate") as string,
      isActive: fd.get("isActive") === "on",
    };

    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create cycle");
      }
      setCreateOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create cycle");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(cycleId: string) {
    setActivatingId(cycleId);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to activate cycle");
      }
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to activate cycle");
    } finally {
      setActivatingId(null);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading cycles...
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
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Create cycle
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  required
                  defaultValue={new Date().getFullYear()}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phase">Phase</Label>
                <select
                  id="phase"
                  name="phase"
                  required
                  defaultValue="GOAL_SETTING"
                  className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {CYCLE_PHASE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="openDate">Open date</Label>
                <Input
                  id="openDate"
                  name="openDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="closeDate">Close date</Label>
                <Input
                  id="closeDate"
                  name="closeDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" className="rounded" />
                Set as active cycle
              </label>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cycles.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No cycles"
          description="Create a performance cycle to enable goal setting."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Open</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">{cycle.year}</TableCell>
                  <TableCell>{CYCLE_PHASE_LABELS[cycle.phase]}</TableCell>
                  <TableCell>
                    {new Date(cycle.openDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(cycle.closeDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{cycle._count?.goals ?? 0}</TableCell>
                  <TableCell>
                    {cycle.isActive ? (
                      <Badge className="bg-[#16A34A] text-white">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!cycle.isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={activatingId === cycle.id}
                        onClick={() => setActive(cycle.id)}
                      >
                        {activatingId === cycle.id ? "..." : "Set active"}
                      </Button>
                    )}
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
