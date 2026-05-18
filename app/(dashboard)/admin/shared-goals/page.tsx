import { RoleGuard } from "@/components/layout/RoleGuard";
import { SharedGoalsPanel } from "@/components/admin/SharedGoalsPanel";

export default function AdminSharedGoalsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Shared goals</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Push organization KPIs to employees. Recipients can adjust weightage only.
        </p>
        <div className="mt-6">
          <SharedGoalsPanel />
        </div>
      </div>
    </RoleGuard>
  );
}
