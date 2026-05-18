import { RoleGuard } from "@/components/layout/RoleGuard";
import { DependencyGraph } from "@/components/graph/DependencyGraph";
import { ReactFlowProvider } from "@xyflow/react";

export default function EmployeeDependenciesPage() {
  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <section className="mx-auto max-w-7xl">
        <ReactFlowProvider>
          <DependencyGraph />
        </ReactFlowProvider>
      </section>
    </RoleGuard>
  );
}
