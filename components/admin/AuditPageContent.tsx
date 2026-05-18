"use client";

import { AuditTrail } from "@/components/reports/AuditTrail";
import { useUsers } from "@/hooks/useUsers";

export function AuditPageContent() {
  const { users } = useUsers();

  return (
    <AuditTrail users={users.map((u) => ({ id: u.id, name: u.name }))} />
  );
}
