import { RoleGuard } from "@/components/layout/RoleGuard";

export default function EmployeeHomePage() {
  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Employee Dashboard</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Welcome back. Manage your goals for the active cycle.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            Open <strong>My Goals</strong> to view, create, and submit goals, or{" "}
            <strong>Check-in</strong> to record quarterly achievement on approved goals.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
