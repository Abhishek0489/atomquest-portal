import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { sharedGoalCreateSchema } from "@/lib/validations/shared-goal.schema";

export async function GET() {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  const activeCycle = await getActiveCycle();

  const sharedGoals = await prisma.goal.findMany({
    where: {
      isShared: true,
      ...(activeCycle ? { cycleId: activeCycle.id } : {}),
    },
    include: {
      owner: { select: { id: true, name: true } },
      sharedRecipients: {
        include: {
          recipient: { select: { id: true, name: true, email: true, department: true } },
        },
      },
      cycle: { select: { id: true, year: true, phase: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sharedGoals, cycle: activeCycle });
}

export async function POST(request: Request) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error;

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json(
      { error: "No active cycle configured" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = sharedGoalCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const recipients = await prisma.user.findMany({
    where: { id: { in: data.recipientIds }, role: "EMPLOYEE" },
    select: { id: true, name: true },
  });

  if (recipients.length !== data.recipientIds.length) {
    return NextResponse.json(
      { error: "One or more recipients are invalid or not employees" },
      { status: 400 }
    );
  }

  const targetDate =
    data.uomType === "TIMELINE" && data.targetDate
      ? new Date(data.targetDate)
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const template = await tx.goal.create({
      data: {
        ownerId: session.user.id,
        cycleId: activeCycle.id,
        thrustArea: data.thrustArea,
        title: data.title,
        description: data.description || null,
        uomType: data.uomType,
        target: data.uomType === "ZERO" ? 0 : data.target,
        targetDate,
        weightage: data.weightage,
        status: "APPROVED",
        isShared: true,
      },
    });

    const copies = [];
    for (const recipient of recipients) {
      await tx.sharedGoalRecipient.create({
        data: {
          goalId: template.id,
          recipientId: recipient.id,
          weightage: data.weightage,
        },
      });

      const copy = await tx.goal.create({
        data: {
          ownerId: recipient.id,
          cycleId: activeCycle.id,
          thrustArea: data.thrustArea,
          title: data.title,
          description: data.description || null,
          uomType: data.uomType,
          target: data.uomType === "ZERO" ? 0 : data.target,
          targetDate,
          weightage: data.weightage,
          status: "DRAFT",
          isShared: false,
          sharedFromId: template.id,
        },
      });
      copies.push(copy);
    }

    return { template, copies };
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      goalId: result.template.id,
      action: "SHARED_GOAL_CREATED",
      details: {
        title: data.title,
        recipientCount: recipients.length,
        recipientIds: data.recipientIds,
      },
    },
  });

  return NextResponse.json(
    {
      template: result.template,
      copiesCreated: result.copies.length,
    },
    { status: 201 }
  );
}
