import { RoleGuard } from "@/components/layout/RoleGuard";
import { ApprovalsPanel } from "@/components/approvals/ApprovalsPanel";

export default function ManagerApprovalsPage() {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <section className="mx-auto max-w-7xl">
        <ApprovalsPanel />
      </section>
    </RoleGuard>
  );
}
