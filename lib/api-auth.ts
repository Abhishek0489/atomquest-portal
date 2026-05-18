import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function requireSession(allowedRoles?: Role[]) {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
