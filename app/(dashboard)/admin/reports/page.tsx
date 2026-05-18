import { RoleGuard } from "@/components/layout/RoleGuard";
import { ReportsTabs } from "@/components/reports/ReportsTabs";

export default function AdminReportsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Reports</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Planned vs actual achievement and check-in completion across the organization.
        </p>
        <div className="mt-6">
          <ReportsTabs />
        </div>
      </div>
    </RoleGuard>
  );
}
