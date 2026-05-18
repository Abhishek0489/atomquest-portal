import { RoleGuard } from "@/components/layout/RoleGuard";
import { EmployeeGoalsView } from "@/components/manager/EmployeeGoalsView";

type PageProps = {
  params: { employeeId: string };
};

export default function ManagerEmployeePage({ params }: PageProps) {
  return (
    <RoleGuard allowedRoles={["MANAGER", "ADMIN"]}>
      <section className="mx-auto max-w-7xl">
        <EmployeeGoalsView employeeId={params.employeeId} />
      </section>
    </RoleGuard>
  );
}
