import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { getReporteeIds } from "@/lib/manager-access";

export async function GET(request: Request) {
  const { error, session } = await requireSession(["MANAGER", "ADMIN"]);
  if (error || !session) return error;

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const thrustArea = searchParams.get("thrustArea");
  const status = searchParams.get("status") || "SUBMITTED";

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ goals: [], cycle: null });
  }

  let ownerIds: string[] | undefined;

  if (session.user.role === "MANAGER") {
    ownerIds = await getReporteeIds(session.user.id);
    if (ownerIds.length === 0) {
      return NextResponse.json({ goals: [], cycle: activeCycle });
    }
    if (employeeId) {
      if (!ownerIds.includes(employeeId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      ownerIds = [employeeId];
    }
  } else if (employeeId) {
    ownerIds = [employeeId];
  }

  const goals = await prisma.goal.findMany({
    where: {
      cycleId: activeCycle.id,
      status: status as "SUBMITTED" | "APPROVED" | "RETURNED" | "DRAFT" | "LOCKED",
      ...(ownerIds ? { ownerId: { in: ownerIds } } : {}),
      ...(thrustArea ? { thrustArea } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true, department: true } },
      cycle: { select: { id: true, year: true, phase: true } },
    },
  });

  const employees = await prisma.user.findMany({
    where:
      session.user.role === "MANAGER"
        ? { managerId: session.user.id }
        : { role: "EMPLOYEE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const thrustAreas = Array.from(
    new Set(goals.map((g) => g.thrustArea))
  ).sort();

  return NextResponse.json({
    goals,
    cycle: activeCycle,
    filters: { employees, thrustAreas },
  });
}
