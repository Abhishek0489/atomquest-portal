"use client";

import { useCallback, useEffect, useState } from "react";
import type { Role } from "@prisma/client";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  managerId: string | null;
  manager: { id: string; name: string } | null;
  createdAt: string;
};

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load users");
      }
      const json = (await res.json()) as { users: UserRow[] };
      setUsers(json.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
