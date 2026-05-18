import { z } from "zod";

const cyclePhases = [
  "GOAL_SETTING",
  "Q1_CHECKIN",
  "Q2_CHECKIN",
  "Q3_CHECKIN",
  "Q4_ANNUAL",
  "CLOSED",
] as const;

export const cycleCreateSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  phase: z.enum(cyclePhases),
  openDate: z.string().min(1, "Open date is required"),
  closeDate: z.string().min(1, "Close date is required"),
  isActive: z.boolean().optional(),
});

export const cycleUpdateSchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
  phase: z.enum(cyclePhases).optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CycleCreateInput = z.infer<typeof cycleCreateSchema>;
export type CycleUpdateInput = z.infer<typeof cycleUpdateSchema>;
