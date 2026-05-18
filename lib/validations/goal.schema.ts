import { z } from "zod";
import { THRUST_AREAS } from "@/lib/constants/thrust-areas";

const uomTypes = ["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"] as const;

export const goalFormSchema = z
  .object({
    thrustArea: z.enum(
      THRUST_AREAS as unknown as [string, ...string[]],
      { message: "Select a thrust area" }
    ),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional().nullable(),
    uomType: z.enum(uomTypes),
    target: z.number(),
    targetDate: z.string().optional().nullable(),
    weightage: z
      .number()
      .min(10, "Minimum weightage is 10%")
      .max(100, "Maximum weightage is 100%"),
    submit: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.uomType === "ZERO") {
      if (data.target !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target must be 0 for Zero UoM",
          path: ["target"],
        });
      }
    } else if (data.uomType === "TIMELINE") {
      if (!data.targetDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target date is required for Timeline UoM",
          path: ["targetDate"],
        });
      }
    } else if (data.target <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target must be greater than 0",
        path: ["target"],
      });
    }
  });

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const goalCreateSchema = goalFormSchema;
export const goalUpdateSchema = goalFormSchema;

export const bulkActionSchema = z.object({
  goalIds: z.array(z.string().min(1)).min(1, "Select at least one goal"),
  action: z.enum(["APPROVE", "RETURN"]),
  comment: z.string().max(1000).optional(),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;
