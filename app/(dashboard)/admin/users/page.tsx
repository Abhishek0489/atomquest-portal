import { RoleGuard } from "@/components/layout/RoleGuard";
import { UsersPanel } from "@/components/admin/UsersPanel";

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">User management</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Create users, assign roles, and set reporting managers.
        </p>
        <div className="mt-6">
          <UsersPanel />
        </div>
      </div>
    </RoleGuard>
  );
}
