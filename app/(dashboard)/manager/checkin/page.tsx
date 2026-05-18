import { RoleGuard } from "@/components/layout/RoleGuard";
import { ManagerCheckinPanel } from "@/components/checkin/ManagerCheckinPanel";

export default function ManagerCheckinPage() {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <section className="mx-auto max-w-7xl">
        <ManagerCheckinPanel />
      </section>
    </RoleGuard>
  );
}
