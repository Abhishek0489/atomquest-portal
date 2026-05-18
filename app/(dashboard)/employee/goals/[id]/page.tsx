import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalDetailActions } from "@/components/goals/GoalDetailActions";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGoal } from "@/lib/goal-access";
import { getGoalsWeightageTotal } from "@/lib/goal-validation";
import { ChevronLeft } from "lucide-react";

type PageProps = { params: { id: string } };

export default async function GoalDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed = await canAccessGoal(
    session.user.id,
    session.user.role,
    params.id
  );
  if (!allowed) redirect("/unauthorized");

  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
    include: { cycle: true },
  });

  if (!goal) notFound();

  const isOwner = goal.ownerId === session.user.id;
  const existingTotal = isOwner
    ? await getGoalsWeightageTotal(goal.ownerId, goal.cycleId)
    : 0;

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

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">{goal.title}</h1>
          <GoalStatusBadge status={goal.status} />
        </div>

        {isOwner && <GoalDetailActions goal={goal} />}

        {isOwner ? (
          <GoalForm
            mode="edit"
            goal={goal}
            existingTotalWeightage={existingTotal}
          />
        ) : (
          <p className="text-sm text-[#64748B]">
            View-only — managers edit during approval in Phase 4.
          </p>
        )}
      </div>
    </RoleGuard>
  );
}
