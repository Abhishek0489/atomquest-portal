"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScrollText, Loader2 } from "lucide-react";

type AuditLogRow = {
  id: string;
  action: string;
  details: unknown;
  timestamp: string;
  user: { id: string; name: string; email: string };
  goal: { id: string; title: string } | null;
};

type AuditTrailProps = {
  users?: Array<{ id: string; name: string }>;
};

export function AuditTrail({ users = [] }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (action) params.set("action", action);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/reports/audit?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load audit log");
      }
      const json = (await res.json()) as { logs: AuditLogRow[] };
      setLogs(json.logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [userId, action, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function formatDetails(details: unknown): string {
    if (details == null) return "—";
    try {
      return JSON.stringify(details, null, 0).slice(0, 120);
    } catch {
      return String(details);
    }
  }

  return (
    <section className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          fetchLogs();
        }}
      >
        {users.length > 0 && (
          <div>
            <Label htmlFor="audit-user" className="text-xs text-[#64748B]">
              User
            </Label>
            <select
              id="audit-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 flex h-9 w-48 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label htmlFor="audit-action" className="text-xs text-[#64748B]">
            Action
          </Label>
          <Input
            id="audit-action"
            placeholder="e.g. GOAL_APPROVED"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 w-48"
          />
        </div>
        <div>
          <Label htmlFor="audit-from" className="text-xs text-[#64748B]">
            From
          </Label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
        <div>
          <Label htmlFor="audit-to" className="text-xs text-[#64748B]">
            To
          </Label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
        <Button type="submit" variant="outline">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#64748B]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading audit trail...
        </p>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="Actions across the portal are logged here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{log.user.name}</p>
                    <p className="text-xs text-[#64748B]">{log.user.email}</p>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.goal?.title ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-[#64748B]">
                    {formatDetails(log.details)}
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
