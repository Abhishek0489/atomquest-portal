import { RoleGuard } from "@/components/layout/RoleGuard";
import { AuditPageContent } from "@/components/admin/AuditPageContent";

export default function AdminAuditPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Audit trail</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Full log of goal and admin actions. Filter by user, action, or date range.
        </p>
        <div className="mt-6">
          <AuditPageContent />
        </div>
      </div>
    </RoleGuard>
  );
}
