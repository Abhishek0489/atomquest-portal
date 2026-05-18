import { z } from "zod";

const roles = ["EMPLOYEE", "MANAGER", "ADMIN"] as const;

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(roles),
  department: z.string().max(100).optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(roles).optional(),
  department: z.string().max(100).optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
