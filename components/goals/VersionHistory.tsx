"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DiffViewer } from "@/components/goals/DiffViewer";
import { Loader2 } from "lucide-react";

type VersionItem = {
  id: string;
  changedAt: string;
  changedByName: string;
  changeNote: string | null;
  snapshot: Record<string, unknown>;
};

type VersionsResponse = {
  goal: { id: string; title: string };
  currentSnapshot: Record<string, unknown>;
  versions: VersionItem[];
};

type VersionHistoryProps = {
  goalId: string;
  goalTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VersionHistory({
  goalId,
  goalTitle,
  open,
  onOpenChange,
}: VersionHistoryProps) {
  const [data, setData] = useState<VersionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !goalId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/goals/${goalId}/versions`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load history");
        }
        const json = (await res.json()) as VersionsResponse;
        setData(json);
        setSelectedId(json.versions[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, goalId]);

  const diffPair = useMemo(() => {
    if (!data || !selectedId) return null;
    const index = data.versions.findIndex((v) => v.id === selectedId);
    if (index < 0) return null;
    const version = data.versions[index];
    const after =
      index === 0
        ? data.currentSnapshot
        : data.versions[index - 1].snapshot;
    return { before: version.snapshot, after };
  }, [data, selectedId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>{goalTitle}</SheetDescription>
        </SheetHeader>

        {loading && (
          <p className="mt-6 flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading versions…
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {data && !loading && data.versions.length === 0 && (
          <p className="mt-6 text-sm text-[#64748B]">
            No version history yet. Edits to this goal will appear here.
          </p>
        )}

        {data && data.versions.length > 0 && (
          <section className="mt-6 grid gap-6">
            <ul className="space-y-2 border-l-2 border-slate-200 pl-4">
              {data.versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(version.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedId === version.id
                        ? "bg-[#DBEAFE] text-[#1E40AF]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-medium">
                      {new Date(version.changedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {version.changedByName}
                      {version.changeNote ? ` · ${version.changeNote}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {diffPair && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#0F172A]">
                  Changes in this version
                </h3>
                <DiffViewer before={diffPair.before} after={diffPair.after} />
              </section>
            )}
          </section>
        )}
      </SheetContent>
    </Sheet>
  );
}
