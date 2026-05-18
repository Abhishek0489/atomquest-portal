"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import { useUsers, type UserRow } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Users, Plus, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { TableSkeleton } from "@/components/shared/skeletons/TableSkeleton";

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

export function UsersPanel() {
  const { users, loading, error, refetch } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const managers = users.filter(
    (u) => u.role === "MANAGER" || u.role === "ADMIN"
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      role: fd.get("role") as Role,
      department: (fd.get("department") as string) || null,
      managerId: (fd.get("managerId") as string) || null,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create user");
      }
      setAddOpen(false);
      toast.success("User created");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const body: Record<string, unknown> = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      role: fd.get("role") as Role,
      department: (fd.get("department") as string) || null,
      managerId: (fd.get("managerId") as string) || null,
    };
    if (password) body.password = password;

    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update user");
      }
      setEditUser(null);
      toast.success("User updated");
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update user";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <TableSkeleton rows={5} columns={5} />;
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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add user
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
            </DialogHeader>
            <UserForm
              managers={managers}
              onSubmit={handleCreate}
              saving={saving}
              error={formError}
              includePassword
            />
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users"
          description="Create users to assign roles and managers."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-[#64748B]">
                    {user.department ?? "—"}
                  </TableCell>
                  <TableCell className="text-[#64748B]">
                    {user.manager?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormError(null);
                        setEditUser(user);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserForm
              key={editUser.id}
              managers={managers.filter((m) => m.id !== editUser.id)}
              defaultValues={editUser}
              onSubmit={handleUpdate}
              saving={saving}
              error={formError}
              passwordOptional
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

type UserFormProps = {
  managers: Array<{ id: string; name: string }>;
  defaultValues?: UserRow;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  error: string | null;
  includePassword?: boolean;
  passwordOptional?: boolean;
};

function UserForm({
  managers,
  defaultValues,
  onSubmit,
  saving,
  error,
  includePassword,
  passwordOptional,
}: UserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultValues?.email}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">
          Password{passwordOptional ? " (leave blank to keep)" : ""}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required={includePassword}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultValues?.role ?? "EMPLOYEE"}
          className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          name="department"
          defaultValue={defaultValues?.department ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="managerId">Manager</Label>
        <select
          id="managerId"
          name="managerId"
          defaultValue={defaultValues?.managerId ?? ""}
          className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">None</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
