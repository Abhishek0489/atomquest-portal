import { z } from "zod";

export const dependencyCreateSchema = z
  .object({
    dependentGoalId: z.string().min(1),
    requiredGoalId: z.string().min(1),
  })
  .refine((data) => data.dependentGoalId !== data.requiredGoalId, {
    message: "A goal cannot depend on itself",
    path: ["requiredGoalId"],
  });

export type DependencyCreateInput = z.infer<typeof dependencyCreateSchema>;
