import { RoleGuard } from "@/components/layout/RoleGuard";
import { TeamDashboard } from "@/components/manager/TeamDashboard";

export default function ManagerTeamPage() {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <section className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#0F172A]">Team Overview</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Monitor goal submission, approvals, and check-in progress across your
            team.
          </p>
        </header>
        <TeamDashboard />
      </section>
    </RoleGuard>
  );
}
