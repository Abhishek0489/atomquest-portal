import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { bulkActionSchema } from "@/lib/validations/goal.schema";
import { serializeGoalSnapshot } from "@/lib/goal-validation";
import { validateGoalsBelongToReportees } from "@/lib/manager-access";

export async function POST(request: Request) {
  const { error, session } = await requireSession(["MANAGER", "ADMIN"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = bulkActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { goalIds, action, comment } = parsed.data;

  if (action === "RETURN" && !comment?.trim()) {
    return NextResponse.json(
      { error: "A comment is required when returning goals" },
      { status: 400 }
    );
  }

  const access = await validateGoalsBelongToReportees(
    session.user.id,
    goalIds,
    session.user.role as "MANAGER" | "ADMIN"
  );
  if (!access.valid) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const goals = await prisma.goal.findMany({
    where: { id: { in: goalIds } },
    include: { owner: { select: { managerId: true } } },
  });

  if (goals.length !== goalIds.length) {
    return NextResponse.json({ error: "One or more goals not found" }, { status: 404 });
  }

  const notSubmitted = goals.filter((g) => g.status !== "SUBMITTED");
  if (notSubmitted.length > 0) {
    return NextResponse.json(
      { error: "All selected goals must be in SUBMITTED status" },
      { status: 400 }
    );
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "RETURNED";
  const changeNote =
    action === "RETURN"
      ? comment?.trim() || "Returned for rework"
      : "Approved by manager";

  await prisma.$transaction(async (tx) => {
    for (const goal of goals) {
      await tx.goalVersion.create({
        data: {
          goalId: goal.id,
          changedById: session.user.id,
          snapshot: serializeGoalSnapshot(goal),
          changeNote,
        },
      });

      await tx.goal.update({
        where: { id: goal.id },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          goalId: goal.id,
          action: action === "APPROVE" ? "GOAL_APPROVED" : "GOAL_RETURNED",
          details: {
            previousStatus: "SUBMITTED",
            newStatus,
            comment: action === "RETURN" ? comment?.trim() : undefined,
          },
        },
      });
    }
  });

  return NextResponse.json({ success: true, processed: goals.length });
}
