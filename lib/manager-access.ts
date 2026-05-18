import { prisma } from "@/lib/prisma";

export async function getReporteeIds(managerId: string): Promise<string[]> {
  const reportees = await prisma.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  return reportees.map((r) => r.id);
}

export async function isManagerOfEmployee(
  managerId: string,
  employeeId: string
): Promise<boolean> {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { managerId: true },
  });
  return employee?.managerId === managerId;
}

export async function validateGoalsBelongToReportees(
  managerId: string,
  goalIds: string[],
  role: "MANAGER" | "ADMIN"
): Promise<{ valid: boolean; error?: string }> {
  if (role === "ADMIN") return { valid: true };

  const goals = await prisma.goal.findMany({
    where: { id: { in: goalIds } },
    include: { owner: { select: { managerId: true } } },
  });

  if (goals.length !== goalIds.length) {
    return { valid: false, error: "One or more goals not found" };
  }

  const invalid = goals.some((g) => g.owner.managerId !== managerId);
  if (invalid) {
    return { valid: false, error: "Goals must belong to your direct reportees" };
  }

  return { valid: true };
}
