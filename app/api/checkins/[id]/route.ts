import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { canAccessCheckin } from "@/lib/checkin-access";
import { isGoalOwner } from "@/lib/goal-access";
import { isManagerOfEmployee } from "@/lib/manager-access";
import {
  checkinManagerUpdateSchema,
  checkinUpsertSchema,
} from "@/lib/validations/checkin.schema";
import { resolveComputedScore } from "@/lib/checkin-utils";

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, context: RouteContext) {
  const { error, session } = await requireSession([
    "EMPLOYEE",
    "MANAGER",
    "ADMIN",
  ]);
  if (error || !session) return error;

  const { id } = context.params;

  if (!(await canAccessCheckin(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.checkin.findUnique({
    where: { id },
    include: { goal: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
  }

  const body = await request.json();
  const isOwner = await isGoalOwner(session.user.id, existing.goalId);
  const isManagerOfOwner =
    session.user.role === "MANAGER" &&
    (await isManagerOfEmployee(session.user.id, existing.goal.ownerId));
  const isManagerCommentUpdate =
    typeof body.managerComment === "string" &&
    (isManagerOfOwner || (session.user.role === "ADMIN" && !isOwner));

  if (isManagerCommentUpdate) {
    const parsed = checkinManagerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.checkin.update({
      where: { id },
      data: {
        managerComment: parsed.data.managerComment,
        managerId: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        goalId: existing.goalId,
        action: "CHECKIN_COMMENT_ADDED",
        details: { period: existing.period, comment: parsed.data.managerComment },
      },
    });

    return NextResponse.json(updated);
  }

  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = checkinUpsertSchema.safeParse({
    ...body,
    goalId: existing.goalId,
    period: existing.period,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const goal = existing.goal;

  const actualDate =
    data.actualDate && goal.uomType === "TIMELINE"
      ? new Date(data.actualDate)
      : null;

  let actualValue: number | null =
    data.progressStatus === "NOT_STARTED"
      ? null
      : goal.uomType === "ZERO"
        ? (data.actualValue ?? 0)
        : (data.actualValue ?? null);

  if (goal.uomType === "TIMELINE" && data.progressStatus !== "NOT_STARTED") {
    actualValue = 1;
  }

  const computedScore =
    data.progressStatus === "NOT_STARTED"
      ? null
      : resolveComputedScore(goal, actualValue, actualDate);

  const updated = await prisma.checkin.update({
    where: { id },
    data: {
      actualValue,
      actualDate,
      progressStatus: data.progressStatus,
      computedScore,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: goal.id,
      action: "CHECKIN_UPDATED",
      details: {
        period: existing.period,
        actualValue,
        progressStatus: data.progressStatus,
        computedScore,
      },
    },
  });

  return NextResponse.json(updated);
}
