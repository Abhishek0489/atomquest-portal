import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { goalUpdateSchema } from "@/lib/validations/goal.schema";
import { canAccessGoal, isGoalOwner } from "@/lib/goal-access";
import {
  canEmployeeEditStatus,
  serializeGoalSnapshot,
  validateTotalWeightage,
  validateWeightageBounds,
} from "@/lib/goal-validation";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  const { error, session } = await requireSession([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
  ]);
  if (error || !session) return error;

  const { id } = context.params;

  if (!(await canAccessGoal(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      cycle: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json(goal);
}

export async function PUT(request: Request, context: RouteContext) {
  const { error, session } = await requireSession([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
  ]);
  if (error || !session) return error;

  const { id } = context.params;

  const existing = await prisma.goal.findUnique({
    where: { id },
    include: { owner: { select: { id: true, managerId: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (!(await canAccessGoal(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isOwner = existing.ownerId === session.user.id;
  const isManager =
    session.user.role === "MANAGER" &&
    existing.owner.managerId === session.user.id;

  if (isOwner && !canEmployeeEditStatus(existing.status)) {
    return NextResponse.json(
      { error: "Goal cannot be edited in its current status" },
      { status: 400 }
    );
  }

  if (!isOwner && !isManager && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    existing.status === "LOCKED" &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Locked goals cannot be edited" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = goalUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const weightageError = validateWeightageBounds(data.weightage);
  if (weightageError) {
    return NextResponse.json({ error: weightageError }, { status: 400 });
  }

  let newStatus = existing.status;
  if (isOwner) {
    newStatus = data.submit ? "SUBMITTED" : existing.status;
    if (existing.status === "RETURNED" && !data.submit) {
      newStatus = "RETURNED";
    }
    if (existing.status === "DRAFT" && !data.submit) {
      newStatus = "DRAFT";
    }
  }

  if (newStatus === "SUBMITTED" || (isOwner && data.submit)) {
    const totalError = await validateTotalWeightage(
      existing.ownerId,
      existing.cycleId,
      data.weightage,
      id
    );
    if (totalError) {
      return NextResponse.json({ error: totalError }, { status: 400 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.goalVersion.create({
      data: {
        goalId: existing.id,
        changedById: session.user.id,
        snapshot: serializeGoalSnapshot(existing),
        changeNote: isManager
          ? "Manager edited during approval"
          : data.submit
            ? "Submitted for approval"
            : "Goal updated",
      },
    });

    return tx.goal.update({
      where: { id },
      data: {
        thrustArea: data.thrustArea,
        title: data.title,
        description: data.description || null,
        uomType: data.uomType,
        target: data.uomType === "ZERO" ? 0 : data.target,
        targetDate:
          data.uomType === "TIMELINE" && data.targetDate
            ? new Date(data.targetDate)
            : null,
        weightage: data.weightage,
        status: isOwner && data.submit ? "SUBMITTED" : newStatus,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: updated.id,
      action:
        isOwner && data.submit ? "GOAL_SUBMITTED" : "GOAL_UPDATED",
      details: { title: updated.title, status: updated.status },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error, session } = await requireSession(["EMPLOYEE", "ADMIN"]);
  if (error || !session) return error;

  const { id } = context.params;

  if (!(await isGoalOwner(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.goal.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft goals can be deleted" },
      { status: 400 }
    );
  }

  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
