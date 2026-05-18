import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { cycleCreateSchema } from "@/lib/validations/cycle.schema";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const cycles = await prisma.cycle.findMany({
    orderBy: [{ isActive: "desc" }, { year: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { goals: true } } },
  });

  return NextResponse.json({ cycles });
}

export async function POST(request: Request) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = cycleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const openDate = new Date(data.openDate);
  const closeDate = new Date(data.closeDate);

  if (closeDate <= openDate) {
    return NextResponse.json(
      { error: "Close date must be after open date" },
      { status: 400 }
    );
  }

  const cycle = await prisma.$transaction(async (tx) => {
    if (data.isActive) {
      await tx.cycle.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return tx.cycle.create({
      data: {
        year: data.year,
        phase: data.phase,
        openDate,
        closeDate,
        isActive: data.isActive ?? false,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CYCLE_CREATED",
      details: { cycleId: cycle.id, year: cycle.year, phase: cycle.phase },
    },
  });

  return NextResponse.json(cycle, { status: 201 });
}
