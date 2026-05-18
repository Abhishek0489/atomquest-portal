import type { Role } from "@prisma/client";

export function getRoleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "EMPLOYEE":
    default:
      return "/employee";
  }
}
