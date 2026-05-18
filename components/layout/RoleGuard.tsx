import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

type RoleGuardProps = {
  allowedRoles: Role[];
  children: React.ReactNode;
};

export async function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
