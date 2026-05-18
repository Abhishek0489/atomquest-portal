"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GoalNode, type GoalNodeData } from "@/components/graph/GoalNode";
import { useDependencies } from "@/hooks/useDependencies";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { layoutGraph } from "@/lib/graph-layout";
import { Loader2, Trash2 } from "lucide-react";

const nodeTypes = { goal: GoalNode };

export function DependencyGraph() {
  const { data, loading, error, refetch } = useDependencies();
  const [dependentId, setDependentId] = useState("");
  const [requiredId, setRequiredId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const initialNodes: Node[] = useMemo(
    () =>
      (data?.goals ?? []).map((g) => ({
        id: g.id,
        type: "goal",
        position: { x: 0, y: 0 },
        data: {
          label: g.title,
          progressStatus: g.progressStatus,
        } satisfies GoalNodeData,
      })),
    [data?.goals]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      (data?.edges ?? []).map((e) => ({
        id: e.id,
        source: e.dependentGoalId,
        target: e.requiredGoalId,
        markerEnd: { type: MarkerType.ArrowClosed },
        label: "depends on",
        style: { stroke: "#64748B" },
      })),
    [data?.edges]
  );

  const goals = data?.goals ?? [];
  const apiEdges = data?.edges ?? [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const laidOut = layoutGraph(initialNodes, initialEdges);
    setNodes(laidOut);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const createDependency = useCallback(
    async (dependentGoalId: string, requiredGoalId: string) => {
      setSubmitting(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        const res = await fetch("/api/dependencies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dependentGoalId, requiredGoalId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || "Failed to add dependency");
        }
        setActionSuccess("Dependency added.");
        setDependentId("");
        setRequiredId("");
        await refetch();
        return true;
      } catch (e) {
        setActionError(
          e instanceof Error ? e.message : "Failed to add dependency"
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [refetch]
  );

  const addDependency = useCallback(async () => {
    if (!dependentId || !requiredId) {
      setActionError("Select both goals");
      return;
    }
    await createDependency(dependentId, requiredId);
  }, [dependentId, requiredId, createDependency]);

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const source = connection.source;
      const target = connection.target;
      if (!source || !target) return false;
      if (source === target) return false;
      return !apiEdges.some(
        (e) => e.dependentGoalId === source && e.requiredGoalId === target
      );
    },
    [apiEdges]
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;
      await createDependency(source, target);
    },
    [createDependency]
  );

  const removeDependency = useCallback(
    async (edgeId: string) => {
      setActionError(null);
      try {
        const res = await fetch(`/api/dependencies/${edgeId}`, {
          method: "DELETE",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || "Failed to remove dependency");
        }
        await refetch();
      } catch (e) {
        setActionError(
          e instanceof Error ? e.message : "Failed to remove dependency"
        );
      }
    },
    [refetch]
  );

  const goalTitle = (id: string) =>
    goals.find((g) => g.id === id)?.title ?? id.slice(0, 8);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Dependency Graph</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Drag from the <strong>right handle</strong> of one goal to the{" "}
          <strong>left handle</strong> of another (A → B means A depends on B).
          {data?.cycle && (
            <span className="ml-1">
              Cycle {data.cycle.year} · {data.cycle.phase.replace(/_/g, " ")}
            </span>
          )}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0F172A]">Add dependency</h2>

          <section className="space-y-2">
            <Label htmlFor="dependent-goal">This goal depends on…</Label>
            <select
              id="dependent-goal"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              value={dependentId}
              onChange={(e) => setDependentId(e.target.value)}
            >
              <option value="">Select goal (dependent)</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-2">
            <Label htmlFor="required-goal">…this required goal</Label>
            <select
              id="required-goal"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              value={requiredId}
              onChange={(e) => setRequiredId(e.target.value)}
            >
              <option value="">Select goal (required)</option>
              {goals
                .filter((g) => g.id !== dependentId)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
            </select>
          </section>

          <Button
            className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90"
            disabled={submitting || goals.length < 2}
            onClick={addDependency}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add dependency
          </Button>

          {actionError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {actionError}
            </p>
          )}
          {actionSuccess && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              {actionSuccess}
            </p>
          )}

          <section className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold uppercase text-[#64748B]">
              Current dependencies
            </h3>
            {apiEdges.length === 0 ? (
              <p className="mt-2 text-xs text-[#64748B]">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {apiEdges.map((edge) => (
                  <li
                    key={edge.id}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <span>
                      {goalTitle(edge.dependentGoalId)} →{" "}
                      {goalTitle(edge.requiredGoalId)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove dependency"
                      onClick={() => removeDependency(edge.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="text-xs text-[#64748B]">
            <p className="font-medium text-[#0F172A]">Node colors</p>
            <ul className="mt-1 space-y-0.5">
              <li>Grey — Not started</li>
              <li>Yellow — On track</li>
              <li>Green — Completed</li>
            </ul>
          </section>
        </aside>

        <section className="h-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading && (
            <p className="flex h-full items-center justify-center gap-2 text-sm text-[#64748B]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading graph…
            </p>
          )}
          {error && (
            <p className="p-4 text-sm text-red-700">{error}</p>
          )}
          {!loading && !error && goals.length === 0 && (
            <p className="flex h-full items-center justify-center text-sm text-[#64748B]">
              Add goals first to build a dependency graph.
            </p>
          )}
          {!loading && goals.length > 0 && (
            <ReactFlow
              className="h-full w-full"
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              nodesConnectable
              elementsSelectable
              connectionLineStyle={{ stroke: "#1E40AF", strokeWidth: 2 }}
              defaultEdgeOptions={{
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: "#64748B" },
              }}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          )}
        </section>
      </section>
    </section>
  );
}
