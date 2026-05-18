import type { Role } from "@prisma/client";

export type DemoAccount = {
  role: Role;
  label: string;
  name: string;
  email: string;
  password: string;
  description: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    label: "Admin",
    name: "Priya Sharma",
    email: "admin@atomquest.com",
    password: "Admin@123",
    description: "Full portal access — users, cycles, reports",
  },
  {
    role: "MANAGER",
    label: "Manager",
    name: "Rahul Mehta",
    email: "manager@atomquest.com",
    password: "Manager@123",
    description: "Approve goals, view team, check-ins",
  },
  {
    role: "EMPLOYEE",
    label: "Employee",
    name: "Arjun Verma",
    email: "employee@atomquest.com",
    password: "Employee@123",
    description: "Set goals, check-ins, dependencies",
  },
  {
    role: "EMPLOYEE",
    label: "Employee 2",
    name: "Sneha Patel",
    email: "employee2@atomquest.com",
    password: "Employee@123",
    description: "Bulk approval demo — submitted goals",
  },
];
