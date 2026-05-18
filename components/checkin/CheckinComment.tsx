"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProgressScore } from "@/components/checkin/ProgressScore";
import { formatTarget, PROGRESS_STATUS_LABELS } from "@/lib/goal-labels";
import type { CheckinGoalItem } from "@/hooks/useCheckins";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "@/lib/toast";

type CheckinCommentProps = {
  item: CheckinGoalItem;
  onSaved?: () => void;
};

export function CheckinComment({ item, onSaved }: CheckinCommentProps) {
  const { goal, checkin } = item;
  const [comment, setComment] = useState(checkin?.managerComment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!checkin) {
    return (
      <article className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
        <p className="mt-1 text-sm text-[#64748B]">
          No check-in submitted yet for this goal.
        </p>
      </article>
    );
  }

  async function saveComment() {
    if (!comment.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkins/${checkin!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerComment: comment.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to save comment");
      }
      toast.success("Comment saved");
      onSaved?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <section>
          <h3 className="font-semibold text-[#0F172A]">{goal.title}</h3>
          {goal.owner && (
            <p className="text-xs text-[#64748B]">{goal.owner.name}</p>
          )}
          <p className="text-xs text-[#64748B]">
            Target: {formatTarget(goal.uomType, goal.target, goal.targetDate)}
          </p>
        </section>
        <ProgressScore score={checkin.computedScore} />
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        <section>
          <dt className="text-xs text-[#64748B]">Status</dt>
          <dd className="font-medium">
            {PROGRESS_STATUS_LABELS[checkin.progressStatus]}
          </dd>
        </section>
        <section>
          <dt className="text-xs text-[#64748B]">Actual</dt>
          <dd className="font-medium">
            {checkin.actualDate
              ? new Date(checkin.actualDate).toLocaleDateString()
              : checkin.actualValue != null
                ? checkin.actualValue.toLocaleString()
                : "—"}
          </dd>
        </section>
        <section>
          <dt className="text-xs text-[#64748B]">Period</dt>
          <dd className="font-medium">{checkin.period.replace("_", " ")}</dd>
        </section>
      </dl>

      <section className="mt-4 space-y-2">
        <Label htmlFor={`comment-${checkin.id}`}>Manager comment</Label>
        <Textarea
          id={`comment-${checkin.id}`}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add feedback on this achievement..."
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button size="sm" variant="outline" disabled={saving} onClick={saveComment}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-1 h-4 w-4" />
          )}
          Save comment
        </Button>
      </section>
    </article>
  );
}
