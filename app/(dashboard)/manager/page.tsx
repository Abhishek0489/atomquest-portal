import { RoleGuard } from "@/components/layout/RoleGuard";

export default function ManagerHomePage() {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Manager Dashboard</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Review team goals, approvals, and check-ins — coming in Phase 4.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            <strong>Approvals</strong> and <strong>Team</strong> pages will host bulk
            approval and team overview workflows.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
