"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Goal } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export function GoalDetailActions({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (goal.status !== "DRAFT") return null;

  async function handleDelete() {
    if (!confirm("Delete this draft goal?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete");
      }
      router.push("/employee/goals");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        disabled={deleting}
        onClick={handleDelete}
      >
        {deleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        Delete draft
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
