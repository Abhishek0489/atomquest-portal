import { z } from "zod";
import { THRUST_AREAS } from "@/lib/constants/thrust-areas";

const uomTypes = ["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"] as const;

export const goalFormSchema = z
  .object({
    thrustArea: z.enum(
      THRUST_AREAS as unknown as [string, ...string[]],
      { error: "Select a thrust area" }
    ),
    title: z
      .string()
      .min(1, { error: "Title is required" })
      .max(200, { error: "Title must be 200 characters or less" }),
    description: z
      .string()
      .max(2000, { error: "Description is too long" })
      .optional()
      .nullable(),
    uomType: z.enum(uomTypes, { error: "Select a unit of measure" }),
    target: z.number({ error: "Enter a valid target" }),
    targetDate: z.string().optional().nullable(),
    weightage: z
      .number({ error: "Enter a valid weightage" })
      .min(10, { error: "Minimum weightage is 10%" })
      .max(100, { error: "Maximum weightage is 100%" }),
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
