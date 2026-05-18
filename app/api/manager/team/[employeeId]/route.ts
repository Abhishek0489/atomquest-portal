import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getActiveCycle } from "@/lib/goal-validation";
import { isManagerOfEmployee } from "@/lib/manager-access";

type RouteContext = { params: { employeeId: string } };

export async function GET(_request: Request, context: RouteContext) {
  const { error, session } = await requireSession(["MANAGER", "ADMIN"]);
  if (error || !session) return error;

  const { employeeId } = context.params;

  if (session.user.role === "MANAGER") {
    const allowed = await isManagerOfEmployee(session.user.id, employeeId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
    },
  });

  if (!employee || employee.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const activeCycle = await getActiveCycle();
  if (!activeCycle) {
    return NextResponse.json({ employee, goals: [], cycle: null });
  }

  const goals = await prisma.goal.findMany({
    where: { ownerId: employeeId, cycleId: activeCycle.id },
    orderBy: { createdAt: "desc" },
    include: {
      checkins: {
        orderBy: { period: "asc" },
      },
    },
  });

  return NextResponse.json({ employee, goals, cycle: activeCycle });
}
