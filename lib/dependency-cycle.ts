import { prisma } from "@/lib/prisma";

export async function wouldCreateCycle(
  newDependentId: string,
  newRequiredId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue = [newRequiredId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === newDependentId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = await prisma.goalDependency.findMany({
      where: { dependentGoalId: current },
      select: { requiredGoalId: true },
    });
    queue.push(...deps.map((d) => d.requiredGoalId));
  }

  return false;
}
