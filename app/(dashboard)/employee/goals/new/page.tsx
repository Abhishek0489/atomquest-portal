import Link from "next/link";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { GoalForm } from "@/components/goals/GoalForm";
import { auth } from "@/lib/auth";
import { getActiveCycle, getGoalsWeightageTotal } from "@/lib/goal-validation";
import { ChevronLeft } from "lucide-react";

export default async function NewGoalPage() {
  const session = await auth();
  const activeCycle = await getActiveCycle();
  let existingTotal = 0;

  if (session?.user && activeCycle) {
    existingTotal = await getGoalsWeightageTotal(
      session.user.id,
      activeCycle.id
    );
  }

  return (
    <RoleGuard allowedRoles={["EMPLOYEE", "ADMIN"]}>
      <div className="mx-auto max-w-7xl space-y-4">
        <Link
          href="/employee/goals"
          className="inline-flex items-center gap-1 text-sm text-[#64748B] hover:text-[#0F172A]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to goals
        </Link>
        <GoalForm mode="create" existingTotalWeightage={existingTotal} />
      </div>
    </RoleGuard>
  );
}
