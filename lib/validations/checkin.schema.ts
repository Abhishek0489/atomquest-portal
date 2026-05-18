import { z } from "zod";

const checkinPeriods = ["Q1", "Q2", "Q3", "Q4_ANNUAL"] as const;
const progressStatuses = ["NOT_STARTED", "ON_TRACK", "COMPLETED"] as const;

export const checkinUpsertSchema = z
  .object({
    goalId: z.string().min(1),
    period: z.enum(checkinPeriods),
    actualValue: z.number().optional().nullable(),
    actualDate: z.string().optional().nullable(),
    progressStatus: z.enum(progressStatuses),
  })
  .superRefine((data, ctx) => {
    if (
      data.progressStatus !== "NOT_STARTED" &&
      data.actualValue == null &&
      !data.actualDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Achievement value or date is required",
        path: ["actualValue"],
      });
    }
  });

export const checkinManagerUpdateSchema = z.object({
  managerComment: z.string().max(2000),
});

export type CheckinUpsertInput = z.infer<typeof checkinUpsertSchema>;
export type CheckinManagerUpdateInput = z.infer<typeof checkinManagerUpdateSchema>;
