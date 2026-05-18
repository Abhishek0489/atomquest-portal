import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/unauthorized"];

function hasRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}

function getRoleHome(role: Role): string {
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

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // NextAuth must receive JSON from /api/auth/* — never redirect these to /login
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (pathname === "/login" && isLoggedIn && role) {
      return NextResponse.redirect(new URL(getRoleHome(role), req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/employee")) {
    if (!role || !hasRole(role, ["EMPLOYEE", "ADMIN"])) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } else if (pathname.startsWith("/manager")) {
    if (!role || !hasRole(role, ["MANAGER", "ADMIN"])) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } else if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } else if (pathname.startsWith("/api/users")) {
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (pathname.startsWith("/api/cycles")) {
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
