import { RoleGuard } from "@/components/layout/RoleGuard";
import { CyclesPanel } from "@/components/admin/CyclesPanel";

export default function AdminCyclesPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Cycle configuration</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Manage performance cycles. Only one cycle can be active at a time.
        </p>
        <div className="mt-6">
          <CyclesPanel />
        </div>
      </div>
    </RoleGuard>
  );
}
