import { z } from "zod";
import { THRUST_AREAS } from "@/lib/constants/thrust-areas";

const uomTypes = ["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"] as const;

export const sharedGoalCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    thrustArea: z.enum(
      THRUST_AREAS as unknown as [string, ...string[]],
      { message: "Select a thrust area" }
    ),
    description: z.string().max(2000).optional().nullable(),
    uomType: z.enum(uomTypes),
    target: z.number(),
    targetDate: z.string().optional().nullable(),
    recipientIds: z.array(z.string().min(1)).min(1, "Select at least one recipient"),
    weightage: z
      .number()
      .min(10, "Minimum weightage is 10%")
      .max(100, "Maximum weightage is 100%"),
  })
  .superRefine((data, ctx) => {
    if (data.uomType === "ZERO" && data.target !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target must be 0 for Zero UoM",
        path: ["target"],
      });
    } else if (data.uomType === "TIMELINE" && !data.targetDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target date is required for Timeline UoM",
        path: ["targetDate"],
      });
    } else if (data.uomType !== "ZERO" && data.uomType !== "TIMELINE" && data.target <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target must be greater than 0",
        path: ["target"],
      });
    }
  });

export type SharedGoalCreateInput = z.infer<typeof sharedGoalCreateSchema>;
