import { RoleGuard } from "@/components/layout/RoleGuard";
import { GoalList } from "@/components/goals/GoalList";

export default function EmployeeGoalsPage() {
  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <GoalList />
      </div>
    </RoleGuard>
  );
}
