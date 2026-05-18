import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { cycleUpdateSchema } from "@/lib/validations/cycle.schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = cycleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.cycle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const data = parsed.data;
  const openDate = data.openDate ? new Date(data.openDate) : existing.openDate;
  const closeDate = data.closeDate ? new Date(data.closeDate) : existing.closeDate;

  if (closeDate <= openDate) {
    return NextResponse.json(
      { error: "Close date must be after open date" },
      { status: 400 }
    );
  }

  const cycle = await prisma.$transaction(async (tx) => {
    if (data.isActive === true) {
      await tx.cycle.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    return tx.cycle.update({
      where: { id },
      data: {
        ...(data.year !== undefined && { year: data.year }),
        ...(data.phase !== undefined && { phase: data.phase }),
        ...(data.openDate !== undefined && { openDate }),
        ...(data.closeDate !== undefined && { closeDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: data.isActive ? "CYCLE_ACTIVATED" : "CYCLE_UPDATED",
      details: { cycleId: id, changes: data },
    },
  });

  return NextResponse.json(cycle);
}
