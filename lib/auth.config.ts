import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/lib/roles";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as AppRole | undefined;

      const publicPaths = ["/login", "/unauthorized"];
      if (publicPaths.some((p) => pathname === p)) {
        return true;
      }

      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (pathname.startsWith("/employee")) {
        return role === "EMPLOYEE" || role === "ADMIN";
      }
      if (pathname.startsWith("/manager")) {
        return role === "MANAGER" || role === "ADMIN";
      }
      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.managerId = user.managerId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.managerId = (token.managerId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
