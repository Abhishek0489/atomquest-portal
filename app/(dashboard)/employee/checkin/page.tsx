import { RoleGuard } from "@/components/layout/RoleGuard";
import { EmployeeCheckinPanel } from "@/components/checkin/EmployeeCheckinPanel";

export default function EmployeeCheckinPage() {
  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <section className="mx-auto max-w-7xl">
        <EmployeeCheckinPanel />
      </section>
    </RoleGuard>
  );
}
