"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";

type BulkActionBarProps = {
  selectedCount: number;
  onApprove: () => Promise<void>;
  onReturn: (comment: string) => Promise<void>;
  disabled?: boolean;
};

export function BulkActionBar({
  selectedCount,
  onApprove,
  onReturn,
  disabled,
}: BulkActionBarProps) {
  const [returnOpen, setReturnOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState<"approve" | "return" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      await onApprove();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  async function handleReturn() {
    if (!comment.trim()) {
      setError("Please enter a comment for the employee");
      return;
    }
    setLoading("return");
    setError(null);
    try {
      await onReturn(comment.trim());
      setReturnOpen(false);
      setComment("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Return failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <section className="fixed bottom-4 left-4 right-4 z-40 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-auto sm:max-w-xl sm:-translate-x-1/2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-5">
        <p className="text-sm font-medium text-[#0F172A]">
          {selectedCount} goal{selectedCount !== 1 ? "s" : ""} selected
        </p>
        <section className="flex gap-2">
          <Button
            size="sm"
            className="bg-[#16A34A] hover:bg-[#16A34A]/90"
            disabled={disabled || loading !== null}
            onClick={handleApprove}
          >
            {loading === "approve" ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1 h-4 w-4" />
            )}
            Approve Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#D97706] text-[#D97706] hover:bg-amber-50"
            disabled={disabled || loading !== null}
            onClick={() => {
              setReturnOpen(true);
              setError(null);
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Return for Rework
          </Button>
        </section>
        {error && !returnOpen && (
          <p className="w-full text-xs text-red-600">{error}</p>
        )}
      </section>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return goals for rework</DialogTitle>
            <DialogDescription>
              This comment will apply to all {selectedCount} selected goal
              {selectedCount !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <section className="space-y-2">
            <Label htmlFor="return-comment">Manager comment</Label>
            <Textarea
              id="return-comment"
              rows={4}
              placeholder="Explain what needs to be revised..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {error && returnOpen && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </section>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading === "return"}
              onClick={handleReturn}
            >
              {loading === "return" && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Return Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
