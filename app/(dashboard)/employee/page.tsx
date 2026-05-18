import { RoleGuard } from "@/components/layout/RoleGuard";

export default function EmployeeHomePage() {
  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Employee Dashboard</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Welcome back. Goal list and check-ins arrive in Phase 3.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            Use the sidebar to navigate. <strong>My Goals</strong> and other sections
            will be available soon.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
