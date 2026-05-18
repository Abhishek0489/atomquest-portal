import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { getReporteeIds } from "@/lib/manager-access";

export async function GET() {
  const { error, session } = await requireSession(["MANAGER", "ADMIN"]);
  if (error || !session) return error;

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ members: [], cycle: null });
  }

  const reporteeIds =
    session.user.role === "MANAGER"
      ? await getReporteeIds(session.user.id)
      : (
          await prisma.user.findMany({
            where: { role: "EMPLOYEE" },
            select: { id: true },
          })
        ).map((u) => u.id);

  if (reporteeIds.length === 0) {
    return NextResponse.json({ members: [], cycle: activeCycle });
  }

  const reportees = await prisma.user.findMany({
    where: { id: { in: reporteeIds } },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      goals: {
        where: { cycleId: activeCycle.id },
        select: {
          id: true,
          status: true,
          checkins: { select: { id: true, period: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const members = reportees.map((user) => {
    const goals = user.goals;
    const approved = goals.filter(
      (g) => g.status === "APPROVED" || g.status === "LOCKED"
    ).length;
    const submitted = goals.filter((g) => g.status === "SUBMITTED").length;
    const draft = goals.filter((g) => g.status === "DRAFT").length;
    const returned = goals.filter((g) => g.status === "RETURNED").length;
    const checkinsDone = goals.reduce((sum, g) => sum + g.checkins.length, 0);
    const checkinsExpected = approved > 0 ? approved : goals.length;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      goalsTotal: goals.length,
      goalsSubmitted: submitted,
      goalsApproved: approved,
      goalsDraft: draft,
      goalsReturned: returned,
      goalsPending: submitted,
      checkinsDone,
      checkinsExpected,
    };
  });

  return NextResponse.json({ members, cycle: activeCycle });
}
